(() => {
  const KEY='resemble_cart_v2';
  const read=()=>{try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a.map(x=>({...x,lineId:x.lineId||`${x.id}__${x.size||'M'}__${x.color||'Obsidian'}`})):[]}catch{return[]}};
  const save=x=>{localStorage.setItem(KEY,JSON.stringify(x));window.dispatchEvent(new CustomEvent('resemble:cartchange',{detail:x}));};
  const sync=()=>document.querySelectorAll('.bag-count,[data-cart-count]').forEach(e=>e.textContent=api.count());
  let syncing=false;
  const syncRemote=async()=>{if(syncing||!window.RESEMBLE_API||!window.RESEMBLE_AUTH?.isAuthenticated?.())return;syncing=true;try{const r=await window.RESEMBLE_API.cartGet();if(Array.isArray(r.items)){save(r.items)}}catch{}finally{syncing=false}};
  const remoteSave=async(items)=>{if(!window.RESEMBLE_API||!window.RESEMBLE_AUTH?.isAuthenticated?.()||syncing)return;try{await window.RESEMBLE_API.cartSave(items)}catch{}};
  const api={
    get:read,
    add(item){const c=read(),i=c.findIndex(x=>x.id===item.id&&x.size===item.size&&x.color===item.color);if(i>-1)c[i].qty=Math.min(99,c[i].qty+1);else c.push({...item,qty:1});save(c);remoteSave(c);return c},
    remove(lineId){const c=read().filter(x=>x.lineId!==lineId);save(c);remoteSave(c);return c},
    update(lineId,qty){const c=read(),i=c.findIndex(x=>x.lineId===lineId);if(i>-1){if(qty<=0)c.splice(i,1);else c[i].qty=Math.min(99,Math.max(1,qty));}save(c);remoteSave(c);return c},
    clear(){save([]);if(window.RESEMBLE_API&&window.RESEMBLE_AUTH?.isAuthenticated?.())window.RESEMBLE_API.cartClear().catch(()=>{});return []},
    count(){return read().reduce((n,x)=>n+x.qty,0)},
    subtotal(){return read().reduce((n,x)=>n+x.price*x.qty,0)}
  };
  window.RESEMBLE_CART=api;sync();window.addEventListener('resemble:cartchange',sync);window.addEventListener('resemble:authchange',syncRemote);document.addEventListener('DOMContentLoaded',()=>setTimeout(syncRemote,250));
})();
