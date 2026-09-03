document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('[data-year]').forEach(e=>e.textContent=new Date().getFullYear());
  const products=window.RESEMBLE_PRODUCTS||[]; const cart=window.RESEMBLE_CART;
  const money=n=>`₹ ${Number(n||0).toLocaleString('en-IN')}`;
  const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const syncButtons=()=>document.querySelectorAll('.bag-count,[data-cart-count]').forEach(e=>e.textContent=cart.count());
  syncButtons();

  const grid=document.querySelector('[data-product-grid]');
  if(grid){
    const render=(cat='ALL')=>{const live=(window.RESEMBLE_PRODUCTS||[]).filter(p=>p.active!==false);const list=cat==='ALL'?live:live.filter(p=>p.category===cat);grid.innerHTML=list.map(p=>`<a class="product-card" href="product.html?id=${encodeURIComponent(p.id)}" data-category="${esc(p.category)}"><div class="product-image product-image-${esc(p.id)}"><span>${esc(p.name.split(' ')[0])}</span></div><button class="wish-btn" type="button" data-wishlist-toggle="${esc(p.id)}" aria-label="Add to wishlist">♡</button><div class="product-info"><div><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p></div><div>${money(p.price)}</div></div></a>`).join('')||'<p class="muted">NO PRODUCTS AVAILABLE.</p>';};
    render(); document.querySelectorAll('.filters button').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.filters button').forEach(x=>x.classList.remove('active'));b.classList.add('active');render(b.textContent.trim())}));
  }

  const pd=document.querySelector('[data-product-detail]');
  if(pd){
    const id=new URLSearchParams(location.search).get('id')||'aero-jacket'; const p=window.getResembleProduct(id)||products[0]; const wb=pd.querySelector('[data-wishlist-toggle]'); if(wb) wb.dataset.wishlistToggle=p.id;
    pd.querySelectorAll('[data-pname]').forEach(e=>e.textContent=p.name);pd.querySelectorAll('[data-pcode]').forEach(e=>e.textContent=p.code);pd.querySelectorAll('[data-price]').forEach(e=>e.textContent=money(p.price));pd.querySelectorAll('[data-description]').forEach(e=>e.textContent=p.description);pd.querySelectorAll('[data-materials]').forEach(e=>e.textContent=p.materials);
    const colors=pd.querySelector('[data-colors]');if(colors)colors.innerHTML=(p.colors||[]).map((c,i)=>`<button class="swatch ${i===0?'active':''}" type="button" data-color="${esc(c)}" aria-label="${esc(c)}"></button>`).join('');
    const sizes=pd.querySelector('[data-sizes]');if(sizes)sizes.innerHTML=(p.sizes||[]).map((s,i)=>`<button type="button" class="size-btn ${i===1?'active':''}" data-size="${esc(s)}">${esc(s)}</button>`).join('');
    let color=p.colors?.[0]||'Obsidian',size=p.sizes?.[1]||p.sizes?.[0]||'M';
    pd.querySelectorAll('[data-colors] .swatch').forEach(b=>b.addEventListener('click',()=>{pd.querySelectorAll('.swatch').forEach(x=>x.classList.remove('active'));b.classList.add('active');color=b.dataset.color}));
    pd.querySelectorAll('[data-sizes] .size-btn').forEach(b=>b.addEventListener('click',()=>{pd.querySelectorAll('.size-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');size=b.dataset.size}));
    const add=pd.querySelector('[data-add-product]');if(add)add.addEventListener('click',()=>{if(Number(p.stock||0)<=0){add.textContent='OUT OF STOCK';return}cart.add({lineId:`${p.id}__${size}__${color}`,id:p.id,name:p.name,price:p.price,size,color});add.textContent='ADDED ✓';setTimeout(()=>add.textContent='ADD TO BAG →',1200)});
  }

  document.querySelectorAll('[data-add-product-card]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();const p=window.getResembleProduct(b.dataset.addProductCard);if(!p||p.stock<=0)return;cart.add({lineId:`${p.id}__M__${p.colors[0]}`,id:p.id,name:p.name,price:p.price,size:'M',color:p.colors[0]});b.textContent='ADDED ✓'}));

  const cartItems=document.querySelector('#cartItems'); const cartSummary=document.querySelector('#cartSummary');
  if(cartItems&&cartSummary){
    const renderBag=()=>{
      const items=cart.get();
      if(!items.length){cartItems.innerHTML='<div class="empty-bag"><p class="eyebrow">BAG STATUS</p><h2>YOUR BAG IS EMPTY.</h2><p class="muted">ADD AN ENGINEERED ESSENTIAL TO BEGIN.</p><a class="red-btn" href="shop.html">CONTINUE SHOPPING →</a></div>';cartSummary.innerHTML='<p class="eyebrow">ORDER SUMMARY</p><div class="summary-line"><span>SUBTOTAL</span><strong>₹ 0</strong></div><div class="summary-line"><span>SHIPPING</span><span>CALCULATED AT CHECKOUT</span></div>';return}
      cartItems.innerHTML=items.map(x=>`<article class="cart-row"><div class="cart-thumb">${esc((x.name||'ITEM').split(' ')[0])}</div><div class="cart-info"><h3>${esc(x.name)}</h3><div class="cart-meta">SIZE ${esc(x.size)}<br>COLOR ${esc(x.color)}</div><div class="qty-control"><button type="button" data-qty="${esc(x.lineId)}" data-delta="-1">−</button><span>${x.qty}</span><button type="button" data-qty="${esc(x.lineId)}" data-delta="1">+</button></div><br><button class="remove-btn" type="button" data-remove="${esc(x.lineId)}">REMOVE</button></div><div class="cart-price"><strong>${money(x.price*x.qty)}</strong></div></article>`).join('');
      const subtotal=cart.subtotal();cartSummary.innerHTML=`<p class="eyebrow">ORDER SUMMARY</p><div class="summary-line"><span>SUBTOTAL</span><strong>${money(subtotal)}</strong></div><div class="summary-line"><span>SHIPPING</span><span>CALCULATED AT CHECKOUT</span></div><div class="summary-line summary-total"><strong>TOTAL</strong><strong>${money(subtotal)}</strong></div><a class="red-btn" style="display:block;text-align:center;text-decoration:none;margin-top:10px" href="checkout.html">CHECKOUT →</a><a class="text-link" href="shop.html" style="display:inline-block;margin-top:16px">CONTINUE SHOPPING →</a><p class="cart-note">Taxes, delivery and payment method are confirmed during checkout.</p>`;
    };
    cartItems.addEventListener('click',e=>{const q=e.target.closest('[data-qty]');if(q){const item=cart.get().find(x=>x.lineId===q.dataset.qty);if(item)cart.update(q.dataset.qty,item.qty+Number(q.dataset.delta));return}const r=e.target.closest('[data-remove]');if(r)cart.remove(r.dataset.remove)});
    renderBag();window.addEventListener('resemble:cartchange',renderBag);
  }
  window.addEventListener('resemble:cartchange',syncButtons);
});
