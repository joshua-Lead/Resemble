(function(){
  const USERS_KEY='resemble_users_v33';
  const SESSION_KEY='resemble_session_v33';
  const safeParse=(v,f)=>{try{return JSON.parse(v)||f}catch{return f}};
  const getUsers=()=>safeParse(localStorage.getItem(USERS_KEY),[]);
  const saveUsers=(u)=>localStorage.setItem(USERS_KEY,JSON.stringify(u));
  let cached=safeParse(localStorage.getItem('resemble_current_user_v35'),'')||null;
  const setCached=(u)=>{cached=u||null;if(u)localStorage.setItem('resemble_current_user_v35',JSON.stringify(u));else localStorage.removeItem('resemble_current_user_v35');window.dispatchEvent(new Event('resemble:authchange'));};
  const localSession=()=>safeParse(localStorage.getItem(SESSION_KEY),'');
  const setLocalSession=(email)=>{if(email)localStorage.setItem(SESSION_KEY,email);else localStorage.removeItem(SESSION_KEY)};
  async function hash(value){const data=new TextEncoder().encode(value);const buf=await crypto.subtle.digest('SHA-256',data);return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');}
  function validEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)}
  function message(el,text,ok=false){if(!el)return;el.textContent=text;el.className='auth-message '+(ok?'success':'error')}
  function redirectAfterAuth(){const next=new URLSearchParams(location.search).get('next');location.href=next||'account.html'}
  async function localLogin(email,password){const e=email.trim().toLowerCase(),u=getUsers().find(x=>x.email===e);if(!u)return {ok:false,error:'ACCOUNT NOT FOUND.'};if(await hash(password)!==u.passwordHash)return {ok:false,error:'INCORRECT PASSWORD.'};setLocalSession(e);setCached({id:u.id,name:u.name,email:u.email,createdAt:u.createdAt});return {ok:true,user:u}}
  async function localSignup(name,email,password){const n=name.trim(),e=email.trim().toLowerCase();if(n.length<2)return {ok:false,error:'ENTER YOUR FULL NAME.'};if(!validEmail(e))return {ok:false,error:'ENTER A VALID EMAIL.'};if(password.length<8)return {ok:false,error:'PASSWORD MUST BE AT LEAST 8 CHARACTERS.'};const users=getUsers();if(users.some(x=>x.email===e))return {ok:false,error:'ACCOUNT ALREADY EXISTS.'};const user={id:'RS-'+Math.random().toString(36).slice(2,9).toUpperCase(),name:n,email:e,passwordHash:await hash(password),createdAt:new Date().toISOString(),orders:[]};users.push(user);saveUsers(users);setLocalSession(e);setCached({id:user.id,name:user.name,email:user.email,createdAt:user.createdAt});return {ok:true,user}}
  async function bootstrap(){if(!window.RESEMBLE_API)return;try{const r=await window.RESEMBLE_API.me();if(r.user)setCached(r.user);else if(cached)setCached(null);}catch{} }
  window.RESEMBLE_AUTH={
    current:()=>cached||null,
    users:getUsers,
    login:async(email,password)=>{try{const r=await window.RESEMBLE_API?.login?.({email,password});if(r?.user){setCached(r.user);return r}}catch{}return localLogin(email,password)},
    signup:async(name,email,password)=>{try{const r=await window.RESEMBLE_API?.signup?.({name,email,password});if(r?.user){setCached(r.user);return r}}catch{}return localSignup(name,email,password)},
    logout:async()=>{try{await window.RESEMBLE_API?.logout?.()}catch{}setLocalSession(null);setCached(null)},
    updateUser:async(patch)=>{try{const r=await window.RESEMBLE_API?.updateProfile?.(patch);if(r?.user){setCached(r.user);return r}}catch{}const u=cached;if(!u)return {ok:false,error:'NOT SIGNED IN.'};const users=getUsers(),i=users.findIndex(x=>x.email===u.email);if(i<0)return {ok:false,error:'ACCOUNT NOT FOUND.'};users[i]={...users[i],...patch};saveUsers(users);const nu={...u,...patch};setCached(nu);return {ok:true,user:nu}},
    isAuthenticated:()=>!!cached
  };
  document.addEventListener('DOMContentLoaded',async()=>{
    await bootstrap();
    document.querySelectorAll('[data-auth-email]').forEach(el=>{const u=cached;el.textContent=u?.email||'SIGN IN'});
    document.querySelectorAll('[data-auth-name]').forEach(el=>{const u=cached;el.textContent=u?.name||'RESEMBLE CLIENT'});
    const protectedPage=document.body.dataset.authRequired==='true';
    if(protectedPage&&!cached){location.replace('auth.html?next='+encodeURIComponent(location.pathname.split('/').pop()+location.search));return;}
    const tabs=document.querySelectorAll('[data-auth-tab]');tabs.forEach(tab=>tab.addEventListener('click',()=>{tabs.forEach(t=>t.classList.remove('active'));tab.classList.add('active');document.querySelectorAll('[data-auth-panel]').forEach(p=>p.hidden=p.dataset.authPanel!==tab.dataset.authTab)}));
    const login=document.querySelector('#loginForm');if(login)login.addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(login),r=await window.RESEMBLE_AUTH.login(String(f.get('email')||''),String(f.get('password')||''));message(login.querySelector('.auth-message'),r.ok?'SIGNED IN. REDIRECTING…':r.error,r.ok);if(r.ok)setTimeout(redirectAfterAuth,300)});
    const signup=document.querySelector('#signupForm');if(signup)signup.addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(signup),r=await window.RESEMBLE_AUTH.signup(String(f.get('name')||''),String(f.get('email')||''),String(f.get('password')||''));message(signup.querySelector('.auth-message'),r.ok?'ACCOUNT CREATED. REDIRECTING…':r.error,r.ok);if(r.ok)setTimeout(redirectAfterAuth,300)});
    document.querySelectorAll('[data-logout]').forEach(logout=>logout.addEventListener('click',async e=>{e.preventDefault();await window.RESEMBLE_AUTH.logout();location.href='auth.html'}));
    document.querySelectorAll('[data-user-name]').forEach(el=>el.textContent=cached?.name||'RESEMBLE CLIENT');document.querySelectorAll('[data-user-email]').forEach(el=>el.textContent=cached?.email||'—');document.querySelectorAll('[data-account-id]').forEach(el=>el.textContent=cached?.id||'—');
  });
})();
