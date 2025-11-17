/* ===== Auth & Session (LocalStorage) ===== */
(function(){
  const Y = document.getElementById('y');
  if (Y) Y.textContent = new Date().getFullYear();

  // Seed admin if not exists
  const USERS_KEY = 'csc_users';
  const SESSION_KEY = 'csc_session';

  function getUsers(){ return JSON.parse(localStorage.getItem(USERS_KEY)||'[]'); }
  function setUsers(arr){ localStorage.setItem(USERS_KEY, JSON.stringify(arr)); }
  function getSession(){ return JSON.parse(localStorage.getItem(SESSION_KEY)||'null'); }
  function setSession(obj){ localStorage.setItem(SESSION_KEY, JSON.stringify(obj)); }
  function logout(){ localStorage.removeItem(SESSION_KEY); location.href = 'index.html'; }

  // simple hash (NOT secure, demo only)
  function hash(s){ let h=0; for(let i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0;} return String(h); }

  // ensure admin
  (function seedAdmin(){
    const users = getUsers();
    const exists = users.some(u => u.email === 'admin@camposantacatalina.cl');
    if(!exists){
      users.push({
        id: cryptoRandom(),
        name: 'Administrador',
        email: 'admin@camposantacatalina.cl',
        phone: '+56 9 0000 0000',
        passwordHash: hash('csc123'),
        role: 'admin'
      });
      setUsers(users);
    }
  })();

  function cryptoRandom(){
    return (Date.now().toString(36)+Math.random().toString(36).slice(2,8));
  }

  // Header account state
  const accountLink = document.getElementById('accountLink');
  const session = getSession();
  if(accountLink){
    if(session){
      accountLink.textContent = `Hola, ${session.name} (Salir)`;
      accountLink.href = '#';
      accountLink.addEventListener('click', (e)=>{ e.preventDefault(); logout(); });
    } else {
      accountLink.textContent = 'Iniciar sesión';
      accountLink.href = 'login.html';
    }
  }

  // Contact WhatsApp quick link on home
  const contactWhats = document.getElementById('contactWhats');
  if (contactWhats){
    const NUM = '56958086762'; // número real CSC
    const msg = encodeURIComponent('Hola, me gustaría consultar por el catálogo de Campo Santa Catalina.');
    contactWhats.href = `https://wa.me/${NUM}?text=${msg}`;
    contactWhats.setAttribute('target','_blank');
  }


  // LOGIN
  const loginForm = document.getElementById('loginForm');
  if(loginForm){
    loginForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim().toLowerCase();
      const pass = document.getElementById('loginPass').value;
      const user = getUsers().find(u => u.email === email && u.passwordHash === hash(pass));
      if(!user){ alert('Credenciales inválidas'); return; }
      setSession({ id:user.id, name:user.name, email:user.email, role:user.role, phone:user.phone });
      location.href = user.role==='admin' ? 'admin.html' : 'index.html';
    });
  }

  // REGISTER
  const registerForm = document.getElementById('registerForm');
  if(registerForm){
    registerForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const name = document.getElementById('regName').value.trim();
      const email = document.getElementById('regEmail').value.trim().toLowerCase();
      const phone = document.getElementById('regPhone').value.trim();
      const pass = document.getElementById('regPass').value;
      const users = getUsers();
      if(users.some(u=>u.email===email)){ alert('Ese correo ya está registrado'); return; }
      const user = { id: cryptoRandom(), name, email, phone, passwordHash: hash(pass), role:'user' };
      users.push(user); setUsers(users); setSession({ id:user.id, name, email, role:'user', phone });
      alert('Cuenta creada. ¡Bienvenido/a!');
      location.href = 'index.html';
    });
  }

  // Admin guard
  if(location.pathname.endsWith('admin.html')){
    if(!session || session.role!=='admin'){
      alert('Necesitas iniciar sesión como administrador.');
      location.href = 'login.html';
    }
  }

  // Expose helpers for other scripts (simple global)
  window.CSC_Auth = { getUsers, setUsers, getSession, setSession, logout };
})();
