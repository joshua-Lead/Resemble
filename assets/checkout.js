(() => {
  const $ = (s,r=document) => r.querySelector(s);
  const money = n => `₹ ${Number(n||0).toLocaleString('en-IN')}`;
  const cart = window.RESEMBLE_CART;
  const api = window.RESEMBLE_API;
  function show(msg, ok=false){const el=$('[data-checkout-message]'); if(el){el.textContent=msg; el.className='checkout-message '+(ok?'success':'error');}}
  function render(){
    const items=cart?.get?.()||[]; const wrap=$('[data-checkout-items]');
    if(wrap) wrap.innerHTML=items.length?items.map(x=>`<div class="summary-line"><span>${x.name} × ${x.qty}</span><span>${money(x.price*x.qty)}</span></div>`).join(''):'<p class="account-email">YOUR BAG IS EMPTY.</p>';
    const sub=cart?.subtotal?.()||0; const shipping=sub>=5000?0:199; const total=sub+shipping;
    document.querySelectorAll('[data-checkout-subtotal]').forEach(e=>e.textContent=money(sub));
    document.querySelectorAll('[data-checkout-shipping]').forEach(e=>e.textContent=shipping?money(shipping):'FREE');
    document.querySelectorAll('[data-checkout-total]').forEach(e=>e.textContent=money(total));
  }
  async function loadRazorpay(){ if(window.Razorpay) return true; await new Promise((resolve,reject)=>{ const s=document.createElement('script'); s.src='https://checkout.razorpay.com/v1/checkout.js'; s.onload=resolve; s.onerror=reject; document.head.appendChild(s); }); return !!window.Razorpay; }
  async function submit(e){
    e.preventDefault(); const form=e.currentTarget; const items=cart?.get?.()||[]; if(!items.length){show('YOUR BAG IS EMPTY.');return;}
    const fd=new FormData(form); const address={name:String(fd.get('name')||'').trim(),line1:String(fd.get('line1')||'').trim(),city:String(fd.get('city')||'').trim(),postal:String(fd.get('postal')||'').trim(),country:String(fd.get('country')||'India')};
    if(Object.values(address).some(v=>!v)){show('COMPLETE ALL SHIPPING FIELDS.');return;}
    const method=String(fd.get('payment')||'CARD'); const sub=cart.subtotal(); const shipping=sub>=5000?0:199; const total=sub+shipping;
    const btn=form.querySelector('button[type=submit]'); if(btn) {btn.disabled=true;btn.textContent='PROCESSING…'} show('PREPARING PAYMENT…',true);
    try {
      const pay=await api.request('/api/payment/create',{method:'POST',body:JSON.stringify({amount:total,method})});
      let verified=pay.payment;
      if(pay.payment.mode==='live' && pay.payment.provider==='Razorpay'){
        await loadRazorpay();
        verified = await new Promise((resolve,reject)=>{
          const opts={key:pay.payment.keyId,amount:pay.payment.amount,currency:pay.payment.currency,name:pay.payment.name,description:pay.payment.description,order_id:pay.payment.razorpayOrderId,prefill:{name:address.name},theme:{color:'#D60000'},handler:async response=>{
            try { const vr=await api.request('/api/payment/verify',{method:'POST',body:JSON.stringify(response)}); resolve(vr.payment); } catch(e){ reject(e); }
          },modal:{ondismiss:()=>reject(new Error('PAYMENT_CANCELLED'))}};
          const rz=new window.Razorpay(opts); rz.on('payment.failed',r=>reject(new Error(r?.error?.description||'PAYMENT_FAILED'))); rz.open();
        });
      }
      const result=await api.createOrder({items,shippingAddress:address,shippingFee:shipping,payment:verified});
      sessionStorage.setItem('resemble_last_order',JSON.stringify(result.order));
      cart.clear(); location.href='confirmation.html?order='+encodeURIComponent(result.order.id);
    } catch(err){ show(String(err.message||'CHECKOUT FAILED.').replaceAll('_',' ')); if(btn){btn.disabled=false;btn.textContent='PLACE ORDER →'} }
  }
  document.addEventListener('DOMContentLoaded',()=>{render(); $('[data-checkout-form]')?.addEventListener('submit',submit); document.querySelectorAll('input[name="payment"]').forEach(x=>x.addEventListener('change',()=>document.querySelectorAll('[data-payment-note]').forEach(n=>n.textContent=x.value==='COD'?'Pay on delivery.':'Secure payment authorization.')))});
  window.addEventListener('resemble:cartchange',render);
})();
