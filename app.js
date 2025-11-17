/* ===== Tienda: catálogo, carrito y WhatsApp checkout ===== */
(function(){
  // Número real de WhatsApp (sin +)
  window.CSC_WA_NUMBER = '56958086762';

  const PRODUCTS_KEY = 'csc_products';
  const CART_KEY = 'csc_cart';

  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

  function money(n){
    return new Intl.NumberFormat('es-CL',{
      style:'currency',currency:'CLP',maximumFractionDigits:0
    }).format(n||0);
  }

  /* LocalStorage helpers */
  function getProducts(){ return JSON.parse(localStorage.getItem(PRODUCTS_KEY)||'[]'); }
  function setProducts(arr){ localStorage.setItem(PRODUCTS_KEY, JSON.stringify(arr)); }
  function getCart(){ return JSON.parse(localStorage.getItem(CART_KEY)||'[]'); }
  function setCart(arr){ localStorage.setItem(CART_KEY, JSON.stringify(arr)); }
  function clearCart(){ localStorage.removeItem(CART_KEY); }
  function id(){ return (Date.now().toString(36)+Math.random().toString(36).slice(2,8)); }

  // Seed initial products if empty
  (function seed(){
    if(getProducts().length) return;
    const demo = [
      // Huevos
      {id:id(), categoria:'huevos', nombre:'Huevos de campo (docena)', precio:6500, peso:'docena', stock:24, imagen:'', activo:true},
      {id:id(), categoria:'huevos', nombre:'Huevos XL (docena)', precio:7200, peso:'docena', stock:12, imagen:'', activo:true},
      // Quesos
      {id:id(), categoria:'quesos', nombre:'Queso Chanco', precio:6900, peso:'500g', stock:20, imagen:'', activo:true},
      {id:id(), categoria:'quesos', nombre:'Queso Mantecoso', precio:7400, peso:'500g', stock:18, imagen:'', activo:true},
      // Frutos secos
      {id:id(), categoria:'frutos', nombre:'Nueces', precio:4500, peso:'500g', stock:30, imagen:'', activo:true},
      {id:id(), categoria:'frutos', nombre:'Almendras', precio:5200, peso:'500g', stock:25, imagen:'', activo:true},
      // Otros
      {id:id(), categoria:'otros', nombre:'Aceite de oliva', precio:9800, peso:'500ml', stock:15, imagen:'', activo:true},
      {id:id(), categoria:'otros', nombre:'Miel de campo', precio:6200, peso:'500g', stock:16, imagen:'', activo:true},
    ];
    setProducts(demo);
  })();

  /* ====== Render catálogo ====== */
  const lists = {
    huevos: $('#list-huevos'),
    quesos: $('#list-quesos'),
    frutos: $('#list-frutos'),
    otros : $('#list-otros')
  };

  function renderCatalog(){
    if(!lists.huevos) return; // no estamos en index
    const products = getProducts().filter(p=>p.activo);
    for(const key in lists){ if(lists[key]) lists[key].innerHTML = ''; }

    products.forEach(p=>{
      const wrap = document.createElement('article');
      wrap.className = 'card product-card';
      wrap.id = 'prod-' + p.id;
      wrap.innerHTML = `
        <img alt="" src="${p.imagen || placeholderData()}" />
        <div class="product-body">
          <h4>${escapeHtml(p.nombre)}</h4>
          <div class="product-meta">${p.peso ? p.peso+' · ' : ''}<span class="stock-badge">${p.stock>0 ? (p.stock+' en stock') : 'Sin stock'}</span></div>
          <div class="product-actions">
            <strong>${money(p.precio)}</strong>
            <input class="qty" type="number" min="1" step="1" value="1" ${p.stock? '' : 'disabled'}>
            <button class="btn btn-outline add" ${p.stock? '' : 'disabled'}>Agregar</button>
          </div>
        </div>
      `;
      wrap.querySelector('.add')?.addEventListener('click', ()=>{
        const qty = Number(wrap.querySelector('.qty').value||1);
        if(qty<1) return;
        if(qty>p.stock){ alert('No hay stock suficiente.'); return; }
        addToCart(p.id, qty);
      });
      lists[p.categoria]?.appendChild(wrap);
    });

    buildCategoryMenus(products);
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  }

  function placeholderData(){
    return 'data:image/svg+xml;utf8,'+encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
        <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#63BFA0"/><stop offset="1" stop-color="#1F6F54"/>
        </linearGradient></defs>
        <rect width="800" height="600" fill="url(#g)"/>
      </svg>`
    );
  }

  /* ====== Menús desplegables en categorías ====== */
  function buildCategoryMenus(products){
    const grouped = {huevos:[], quesos:[], frutos:[], otros:[]};
    products.forEach(p=>{ if(grouped[p.categoria]) grouped[p.categoria].push(p); });

    Object.keys(grouped).forEach(cat=>{
      const card = document.querySelector(`.card-cat[data-cat="${cat}"]`);
      if(!card) return;
      const menu = card.querySelector('.cat-menu');
      if(!menu) return;
      menu.innerHTML = '';
      const items = grouped[cat].slice(0,5);
      if(!items.length){
        const li = document.createElement('li');
        li.innerHTML = '<button type="button">Sin productos aún</button>';
        menu.appendChild(li);
      } else {
        items.forEach(p=>{
          const li = document.createElement('li');
          li.innerHTML = `<button type="button">${escapeHtml(p.nombre)} <span>${money(p.precio)}</span></button>`;
          li.querySelector('button').addEventListener('click', ()=>{
            const el = document.getElementById('prod-'+p.id);
            if(el){
              const y = el.getBoundingClientRect().top + window.scrollY - 90;
              window.scrollTo({top:y, behavior:'smooth'});
            }
          });
          menu.appendChild(li);
        });
      }

      // Toggle en móvil (click) para no depender solo del hover
      card.addEventListener('click', e=>{
        if(window.innerWidth <= 900){
          e.preventDefault();
          const isOpen = card.classList.contains('menu-open');
          document.querySelectorAll('.card-cat.menu-open').forEach(c=>c.classList.remove('menu-open'));
          if(!isOpen) card.classList.add('menu-open');
        }
      });
    });

    // Cerrar menús al hacer click fuera en móvil
    document.addEventListener('click', e=>{
      if(window.innerWidth > 900) return;
      const card = e.target.closest('.card-cat');
      if(!card){
        document.querySelectorAll('.card-cat.menu-open').forEach(c=>c.classList.remove('menu-open'));
      }
    });
  }

  /* ====== Carrito ====== */
  const cartToggle = $('#cartToggle');
  const cartClose = $('#cartClose');
  const cartDrawer = $('#cartDrawer');
  const cartBackdrop = $('#cartBackdrop');
  const cartItems = $('#cartItems');
  const cartTotal = $('#cartTotal');
  const cartCount = $('#cartCount');
  const btnCheckout = $('#btnCheckout');
  const btnClearCart = $('#btnClearCart');
  const coName = $('#coName');
  const coPhone = $('#coPhone');
  const coAddr = $('#coAddr');

  function openDrawer(){ cartDrawer.classList.add('open'); cartDrawer.setAttribute('aria-hidden','false'); }
  function closeDrawer(){ cartDrawer.classList.remove('open'); cartDrawer.setAttribute('aria-hidden','true'); }

  cartToggle?.addEventListener('click', openDrawer);
  cartClose?.addEventListener('click', closeDrawer);
  cartBackdrop?.addEventListener('click', closeDrawer);

  function addToCart(productId, qty){
    const cart = getCart();
    const item = cart.find(i=>i.productId===productId);
    if(item) item.qty += qty;
    else cart.push({productId, qty});
    setCart(cart);
    renderCart();
    cartToggle?.classList.add('pulse');
    setTimeout(()=>cartToggle?.classList.remove('pulse'), 300);
  }

  function removeFromCart(productId){
    const cart = getCart().filter(i=>i.productId!==productId);
    setCart(cart); renderCart();
  }

  function updateQty(productId, qty){
    const cart = getCart();
    const it = cart.find(i=>i.productId===productId);
    if(!it) return;
    it.qty = Math.max(1, qty|0);
    setCart(cart); renderCart();
  }

  function renderCart(){
    if(!cartItems) return;
    const products = getProducts();
    const cart = getCart();
    let total = 0; cartItems.innerHTML = '';
    cart.forEach(line=>{
      const p = products.find(pp=>pp.id===line.productId);
      if(!p) return;
      const sub = p.precio * line.qty;
      total += sub;
      const row = document.createElement('div');
      row.className = 'line';
      row.innerHTML = `
        <div>
          <strong>${escapeHtml(p.nombre)}</strong>
          <div class="small">${p.peso||''} · ${money(p.precio)} · Stock: ${p.stock}</div>
        </div>
        <div style="display:flex; gap:6px; align-items:center">
          <input class="qty" type="number" min="1" value="${line.qty}">
          <button class="icon-btn" title="Eliminar">🗑️</button>
        </div>
      `;
      row.querySelector('.qty').addEventListener('change', e=>{
        const val = Number(e.target.value||1);
        if(val>p.stock){ alert('No hay stock suficiente.'); e.target.value = line.qty; return; }
        updateQty(p.id, val);
      });
      row.querySelector('.icon-btn').addEventListener('click', ()=>removeFromCart(p.id));
      cartItems.appendChild(row);
    });
    cartTotal.textContent = money(total);
    cartCount && (cartCount.textContent = String(cart.reduce((a,b)=>a+b.qty,0)));
  }

  btnClearCart?.addEventListener('click', ()=>{ clearCart(); renderCart(); });

  btnCheckout?.addEventListener('click', ()=>{
    const products = getProducts();
    const cart = getCart();
    if(!cart.length){ alert('Tu carrito está vacío.'); return; }

    const sess = window.CSC_Auth?.getSession?.() || null;
    const buyer = {
      name: coName?.value?.trim() || (sess?.name || ''),
      phone: coPhone?.value?.trim() || (sess?.phone || ''),
      addr: coAddr?.value?.trim() || ''
    };
    if(!buyer.name || !buyer.phone){
      alert('Ingresa tu nombre y teléfono para continuar.');
      return;
    }

    let total = 0, lines = [];
    cart.forEach(line=>{
      const p = products.find(pp=>pp.id===line.productId);
      if(!p) return;
      const sub = p.precio*line.qty; total+=sub;
      lines.push(`${p.nombre}${p.peso?' ('+p.peso+')':''} x ${line.qty} = ${money(sub)}`);
    });
    const msg = [
      `Hola, soy ${buyer.name}. Quiero confirmar este pedido:`,
      '',
      ...lines.map((l,i)=>`${i+1}) ${l}`),
      '',
      `Total: ${money(total)}`,
      `Dirección: ${buyer.addr || '(la coordino por chat)'}`,
      `Teléfono: ${buyer.phone}`,
      '',
      'Enviado desde la web de Campo Santa Catalina.'
    ].join('\n');

    const url = `https://wa.me/${window.CSC_WA_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');

    setTimeout(()=>{
      if(confirm('¿Marcamos este pedido como enviado y descontamos stock?')){
        const updated = products.map(p=>{
          const line = cart.find(l=>l.productId===p.id);
          if(!line) return p;
          return {...p, stock: Math.max(0, p.stock - line.qty)};
        });
        setProducts(updated);
        clearCart();
        renderCatalog();
        renderCart();
        alert('¡Listo! Stock actualizado. Gracias por tu compra 🥚🧀🥜');
        closeDrawer();
      }
    }, 300);
  });

  $('#fakeContact')?.addEventListener('submit', (e)=>{
    e.preventDefault();
    alert('Gracias por tu mensaje. Te responderemos por WhatsApp o correo 🙌');
    e.target.reset();
  });

  /* Inicialización */
  renderCatalog();
  renderCart();

  /* Pulso al agregar */
  const style = document.createElement('style');
  style.textContent = `.pulse{animation:pulse .3s}@keyframes pulse{from{transform:scale(1)}50%{transform:scale(1.1)}to{transform:scale(1)}}`;
  document.head.appendChild(style);
})();
