(() => {
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = n => `₹ ${Number(n||0).toLocaleString('en-IN')}`;
  async function boot(){
    const me = await window.RESEMBLE_API.me().catch(()=>null);
    if(!me?.user || me.user.role!=='admin') { location.href='auth.html?next=admin.html'; return; }
    $('#adminIdentity').textContent = `${me.user.name} / ${me.user.email}`;
    await Promise.all([loadStats(), loadProducts(), loadOrders(), loadUsers()]);
  }
  async function loadStats(){const r=await window.RESEMBLE_API.adminStats();const s=r.stats;$('#sProducts').textContent=s.activeProducts;$('#sStock').textContent=s.lowStock;$('#sCustomers').textContent=s.customers;$('#sOrders').textContent=s.orders;$('#sRevenue').textContent=money(s.revenue);}
  async function loadProducts(){const r=await window.RESEMBLE_API.products();const rows=$('#inventoryRows');rows.innerHTML=r.products.map(p=>`<tr><td>${esc(p.name)}<div class="muted">${esc(p.code)}</div></td><td>${esc(p.category)}</td><td><input class="stock-input" data-stock="${esc(p.id)}" value="${Number(p.stock||0)}" type="number" min="0"></td><td>${p.active!==false?'LIVE':'HIDDEN'}</td><td><button data-save-stock="${esc(p.id)}">UPDATE</button></td></tr>`).join('');}
  async function loadOrders(){const r=await window.RESEMBLE_API.adminOrders();const rows=$('#orderRows');rows.innerHTML=r.orders.length?r.orders.map(o=>`<tr><td>${esc(o.number)}</td><td>${esc(o.user?.name||'—')}<div class="muted">${esc(o.user?.email||'')}</div></td><td>${money(o.total)}</td><td><select data-status="${esc(o.id)}">${['PROCESSING','CONFIRMED','PACKED','SHIPPED','DELIVERED','CANCELLED'].map(x=>`<option ${x===o.status?'selected':''}>${x}</option>`).join('')}</select></td><td>${new Date(o.createdAt).toLocaleString()}</td></tr>`).join(''):'<tr><td colspan="5" class="muted">No orders yet.</td></tr>';}
  async function loadUsers(){const r=await window.RESEMBLE_API.adminUsers();$('#userRows').innerHTML=r.users.map(u=>`<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${esc(u.role)}</td><td>${new Date(u.createdAt).toLocaleDateString()}</td></tr>`).join('');}
  $('#inventoryRows').addEventListener('click',async e=>{const b=e.target.closest('[data-save-stock]');if(!b)return;const id=b.dataset.saveStock;const input=document.querySelector(`[data-stock="${CSS.escape(id)}"]`);await window.RESEMBLE_API.productUpdate(id,{stock:Number(input.value)});await Promise.all([loadProducts(),loadStats()]);});
  $('#orderRows').addEventListener('change',async e=>{const s=e.target.closest('[data-status]');if(!s)return;await window.RESEMBLE_API.adminOrderUpdate(s.dataset.status,s.value);await Promise.all([loadOrders(),loadProducts(),loadStats()]);});
  $('#refreshAdmin').addEventListener('click',()=>Promise.all([loadStats(),loadProducts(),loadOrders(),loadUsers()]));
  $('#adminLogout').addEventListener('click',async()=>{await window.RESEMBLE_API.logout();location.href='auth.html';});
  boot();
})();
