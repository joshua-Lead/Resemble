(() => {
  const API = {
    async request(path, options={}) {
      const res = await fetch(path, {credentials:'same-origin', headers:{'Content-Type':'application/json', ...(options.headers||{})}, ...options});
      let data=null; try { data=await res.json(); } catch {}
      if(!res.ok){ const err=new Error(data?.error||`HTTP ${res.status}`); err.status=res.status; err.data=data; throw err; }
      return data;
    },
    health(){return this.request('/api/health')},
    products(){return this.request('/api/products')},
    product(id){return this.request('/api/products/'+encodeURIComponent(id))},
    signup(payload){return this.request('/api/auth/signup',{method:'POST',body:JSON.stringify(payload)})},
    login(payload){return this.request('/api/auth/login',{method:'POST',body:JSON.stringify(payload)})},
    me(){return this.request('/api/auth/me')},
    logout(){return this.request('/api/auth/logout',{method:'POST'})},
    updateProfile(payload){return this.request('/api/account/profile',{method:'PUT',body:JSON.stringify(payload)})},
    cartGet(){return this.request('/api/cart')},
    cartSave(items){return this.request('/api/cart',{method:'PUT',body:JSON.stringify({items})})},
    cartClear(){return this.request('/api/cart',{method:'DELETE'})},
    addresses(){return this.request('/api/addresses')},
    saveAddresses(addresses){return this.request('/api/addresses',{method:'PUT',body:JSON.stringify({addresses})})},
    orders(){return this.request('/api/orders')},
    createOrder(payload){return this.request('/api/orders',{method:'POST',body:JSON.stringify(payload)})},
    productCreate(payload){return this.request('/api/products',{method:'POST',body:JSON.stringify(payload)})},
    productUpdate(id,payload){return this.request('/api/products/'+encodeURIComponent(id),{method:'PUT',body:JSON.stringify(payload)})},
    productDelete(id){return this.request('/api/products/'+encodeURIComponent(id),{method:'DELETE'})},
    adminStats(){return this.request('/api/admin/stats')},
    adminOrders(){return this.request('/api/admin/orders')},
    adminOrderUpdate(id,status){return this.request('/api/admin/orders/'+encodeURIComponent(id),{method:'PUT',body:JSON.stringify({status})})},
    adminUsers(){return this.request('/api/admin/users')}
  };
  window.RESEMBLE_API=API;
  window.RESEMBLE_BACKEND_ON=true;
})();
