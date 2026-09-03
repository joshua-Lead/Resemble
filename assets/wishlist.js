(() => {
  const KEY='resemble_wishlist_v1';
  const read=()=>{try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a:[]}catch{return[]}};
  const write=a=>{localStorage.setItem(KEY,JSON.stringify([...new Set(a)]));window.dispatchEvent(new CustomEvent('resemble:wishlistchange'))};
  const api={
    get:()=>read(),
    has:id=>read().includes(id),
    count:()=>read().length,
    toggle:id=>{const a=read();const i=a.indexOf(id);i>=0?a.splice(i,1):a.push(id);write(a);return i<0},
    add:id=>{const a=read();if(!a.includes(id)){a.push(id);write(a)}},
    remove:id=>{write(read().filter(x=>x!==id))},
    clear:()=>write([])
  };
  window.RESEMBLE_WISHLIST=api;
  const sync=()=>{
    document.querySelectorAll('[data-wishlist-count]').forEach(e=>e.textContent=api.count());
    document.querySelectorAll('[data-wishlist-toggle]').forEach(b=>{
      const active=api.has(b.dataset.wishlistToggle); b.classList.toggle('active',active); b.setAttribute('aria-pressed',active?'true':'false'); b.textContent=active?'♥':'♡';
      b.title=active?'Remove from wishlist':'Add to wishlist';
    });
  };
  document.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll('[data-wishlist-toggle]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();api.toggle(b.dataset.wishlistToggle);sync()}));
    sync();
  });
  window.addEventListener('resemble:wishlistchange',sync);
})();
