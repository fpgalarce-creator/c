/* ===== Panel admin: CRUD de productos (LocalStorage) ===== */
(function(){
  const { getSession } = window.CSC_Auth || {};
  const session = getSession?.();
  if(!session || session.role!=='admin'){ /* redundante al guard de auth.js */ }

  const PRODUCTS_KEY = 'csc_products';
  const $ = (s,c=document)=>c.querySelector(s);
  const $$ = (s,c=document)=>Array.from(c.querySelectorAll(s));

  function getProducts(){ return JSON.parse(localStorage.getItem(PRODUCTS_KEY)||'[]'); }
  function setProducts(arr){ localStorage.setItem(PRODUCTS_KEY, JSON.stringify(arr)); }

  const form = $('#productForm');
  const f = {
    id: $('#prodId'),
    cat: $('#prodCat'),
    name: $('#prodName'),
    price: $('#prodPrice'),
    weight: $('#prodWeight'),
    stock: $('#prodStock'),
    img: $('#prodImg'),
    active: $('#prodActive')
  };

  $('#btnReset')?.addEventListener('click', ()=>{ form.reset(); f.id.value=''; });

  form?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const p = {
      id: f.id.value || genId(),
      categoria: f.cat.value,
      nombre: f.name.value.trim(),
      precio: Number(f.price.value||0),
      peso: f.weight.value.trim(),
      stock: Number(f.stock.value||0),
      imagen: f.img.value.trim(),
      activo: f.active.value === 'true'
    };
    if(!p.nombre){ alert('El nombre es obligatorio'); return; }
    if(p.precio<0 || p.stock<0){ alert('Precio y stock deben ser ≥ 0'); return; }

    const products = getProducts();
    const idx = products.findIndex(x=>x.id===p.id);
    if(idx>=0) products[idx]=p; else products.push(p);
    setProducts(products);
    alert('Producto guardado');
    form.reset(); f.id.value='';
    renderLists();
  });

  function genId(){ return (Date.now().toString(36)+Math.random().toString(36).slice(2,8)); }

  // Tabs
  $$('.tab').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      $$('.tab').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      $$('.adm-list').forEach(x=>x.classList.add('hidden'));
      $(`#adm-${tab}`).classList.remove('hidden');
    });
  });

  function rowTemplate(p){
    return `
      <div class="row">
        <div><strong>${esc(p.nombre)}</strong> <span class="muted">(${p.peso||'—'})</span></div>
        <div>${p.categoria}</div>
        <div>$${Number(p.precio).toLocaleString('es-CL')}</div>
        <div>Stock: ${p.stock}</div>
        <div>${p.activo?'Activo':'Inactivo'}</div>
        <div class="actions">
          <button class="btn btn-ghost" data-act="edit">Editar</button>
          <button class="btn btn-outline" data-act="toggle">${p.activo?'Desactivar':'Activar'}</button>
          <button class="btn" data-act="del">Eliminar</button>
        </div>
      </div>
    `;
  }
  function esc(s){return String(s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}

  function renderLists(){
    const lists = {
      huevos: $('#adm-huevos'),
      quesos: $('#adm-quesos'),
      frutos: $('#adm-frutos'),
      otros : $('#adm-otros')
    };
    const products = getProducts();
    for(const k in lists){ lists[k].innerHTML=''; }
    products.forEach(p=>{
      const holder = lists[p.categoria];
      if(!holder) return;
      const wrap = document.createElement('div');
      wrap.innerHTML = rowTemplate(p);
      const row = wrap.firstElementChild;
      row.querySelector('[data-act="edit"]').addEventListener('click', ()=>{
        f.id.value = p.id;
        f.cat.value = p.categoria;
        f.name.value = p.nombre;
        f.price.value = p.precio;
        f.weight.value = p.peso;
        f.stock.value = p.stock;
        f.img.value = p.imagen||'';
        f.active.value = p.activo?'true':'false';
        window.scrollTo({top:0, behavior:'smooth'});
      });
      row.querySelector('[data-act="toggle"]').addEventListener('click', ()=>{
        const all = getProducts();
        const idx = all.findIndex(x=>x.id===p.id);
        all[idx].activo = !all[idx].activo;
        setProducts(all); renderLists();
      });
      row.querySelector('[data-act="del"]').addEventListener('click', ()=>{
        if(!confirm('¿Eliminar producto?')) return;
        setProducts(getProducts().filter(x=>x.id!==p.id));
        renderLists();
      });
      holder.appendChild(row);
    });
  }

  renderLists();
})();
