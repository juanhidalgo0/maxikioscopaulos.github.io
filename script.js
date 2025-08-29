/* ==========================================================
   UTILIDADES GLOBALES (UI, helpers, loader)
   ========================================================== */



// Actualiza Firebase y la UI
async function toggleStock(productId, nextState, cardEl, addBtnEl, toggleBtnEl) {
  try {
    // RTDB: /productos/{id}/sinStock = true|false
    await firebase.database().ref('/productos/' + productId).update({ sinStock: !!nextState });
    applyStockUI(nextState, cardEl, addBtnEl, toggleBtnEl);
  } catch (e) {
    console.error('Error al alternar stock:', e);
    alert('No se pudo actualizar el stock. Intentalo de nuevo.');
  }
}


const $ = (id) => document.getElementById(id);

function mostrarAviso(msg) {
  const box = $("app-alert");
  const txt = $("app-alert-text");
  if (box && txt) { txt.textContent = msg; box.style.display = "block"; }
  else { alert(msg); }
}

function cerrarTodosLosSubmenus() {
  document.querySelectorAll('.sub-menu-fixed').forEach(submenu => submenu.classList.remove('show', 'show-mobile', 'mostrar'));
}

// Loader principal
window.addEventListener('load', () => {
  const loader = $('loader');
  const mainContent = $('main-content');
  if (!loader || !mainContent) return;
  setTimeout(() => {
    loader.classList.add('fade-out');
    mainContent.classList.remove('hidden');
    document.body.classList.remove('no-scroll');
    setTimeout(() => loader.remove(), 1000);



    // después de quitar 'hidden' y 'no-scroll'
mainContent.classList.remove('hidden');
document.body.classList.remove('no-scroll');
if (typeof window.mostrarInicio === 'function') window.mostrarInicio();
  }, 1000);

      // después de mostrar el main-content
if (!window._sliderInited) {
  window._sliderInited = true;
  initSlider();
}
});

/* ==========================================================
   RATE LIMIT (cooldowns para evitar auth/too-many-requests)
   ========================================================== */
function createLimiter(key, baseSeconds = 60) {
  const now = Date.now();
  const item = JSON.parse(localStorage.getItem(key) || '{}');
  const until = item.until || 0;
  function secondsLeft() { return Math.max(0, Math.ceil((until - Date.now()) / 1000)); }
  function armCooldown(multiplier = 1) {
    const count = (item.count || 0) + 1;
    const next = Math.min(baseSeconds * count * multiplier, 600); // máx 10 min
    const expireAt = now + next * 1000;
    localStorage.setItem(key, JSON.stringify({ until: expireAt, count }));
    return next;
  }
  function clear() { localStorage.removeItem(key); }
  return { secondsLeft, armCooldown, clear };
}
function formatSeconds(s) { if (s <= 60) return `${s}s`; const m=Math.floor(s/60),r=s%60; return r?`${m}m ${r}s`:`${m}m`; }

/* ==========================================================
   FIREBASE INIT (Compat) — una sola vez
   ========================================================== */
(function initFirebaseOnce(){
  if (window.firebase && !firebase.apps.length) {
    const firebaseConfig = {
      apiKey: "AIzaSyDj6lYh5U-IHquTQSMjC5Ww8rmYKeYpdh4",
      authDomain: "kiosco-web.firebaseapp.com",
      databaseURL: "https://kiosco-web-default-rtdb.firebaseio.com",
      projectId: "kiosco-web",
      storageBucket: "kiosco-web.firebasestorage.app",
      messagingSenderId: "328278071313",
      appId: "1:328278071313:web:25ed6f4e648121cc7039b0",
      measurementId: "G-546TFPC8MB"
    };
    firebase.initializeApp(firebaseConfig);
  }
})();

/* ==========================================================
   JS PRINCIPAL
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  
  /* ---------------- Modal Cuenta (abrir/cerrar) ---------------- */
  const cuentaBtn = $('cuenta-btn');
  const cuentaModal = $('cuenta-modal');
  const modalCloses = cuentaModal ? cuentaModal.querySelectorAll('[data-close]') : [];
  if (cuentaBtn && cuentaModal) {
    const open = () => { cuentaModal.classList.add('open'); cuentaModal.setAttribute('aria-hidden','false'); document.documentElement.classList.add('no-scroll'); document.body.classList.add('no-scroll'); };
    const close= () => { cuentaModal.classList.remove('open'); cuentaModal.setAttribute('aria-hidden','true'); document.documentElement.classList.remove('no-scroll'); document.body.classList.remove('no-scroll'); };
    cuentaBtn.addEventListener('click', open);
    modalCloses.forEach(el=>el.addEventListener('click', close));
    cuentaModal.addEventListener('click', (e)=>{ if(e.target===cuentaModal) close(); });
    document.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && cuentaModal.classList.contains('open')) close(); });
    
  }

  /* ---------------- Menú lateral + carrito ---------------- */
  const menuToggle = $('menuToggle');
  const menu = $('menu');
  const overlay = $('overlay');
  const header = document.querySelector('.header');
  const abrirCarrito = $('abrir-carrito');
  const cerrarCarrito = $('cerrar-carrito');
  const carritoSidebar = $('carrito-sidebar');

  $('cerrarMenu')?.addEventListener('click', () => {
    menu?.classList.remove('abierto');
    overlay?.classList.remove('active');
    header?.classList.remove('opaco');
    menuToggle?.classList.remove('activo');
    cerrarTodosLosSubmenus();
  });

  if (menuToggle && menu && overlay && header) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const abierto = menu.classList.toggle('abierto');
      overlay.classList.toggle('active', abierto);
      menuToggle.classList.toggle('activo', abierto);
      header.classList.toggle('opaco', abierto);
    });
    overlay.addEventListener('click', () => {
      menu.classList.remove('abierto');
      carritoSidebar?.classList.remove('active');
      overlay.classList.remove('active');
      header.classList.remove('opaco');
      menuToggle.classList.remove('activo');
      cerrarTodosLosSubmenus();
    });
  }

  if (abrirCarrito && cerrarCarrito && carritoSidebar) {
    abrirCarrito.addEventListener('click', (e) => {
      e.stopPropagation();
      carritoSidebar.classList.add('active');
      overlay?.classList.add('active');
      header?.classList.add('opaco');
    });
    cerrarCarrito.addEventListener('click', () => {
      carritoSidebar.classList.remove('active');
      overlay?.classList.remove('active');
      header?.classList.remove('opaco');
    });
  }



  
  /* ---------------- Auth + Puntos ---------------- */
  if (!window.firebase) return; // corta si no cargaste los SDKs
  const auth = firebase.auth();
  const db   = firebase.database();

  // Nodos paneles
  const panelAuth      = $('panel-auth');
  const panelRegister  = $('panel-register');
  const panelUsuario   = $('panel-usuario');
  const panelVerify    = $('panel-verify'); // opcional
  const verifyText     = $('verify-text');   // opcional

  const userEmailSpan  = $('user-email');
  const userPuntosSpan = $('user-puntos');

  // Controles auth
  const btnLogin    = $('btn-login');
  const btnRegister = $('btn-register');
  const btnLogout   = $('btn-logout');
  const btnResend   = $('btn-resend-verif');
  const btnForgot   = $('btn-forgot');

  const btnShowRegister = $('btn-show-register');
  const btnShowLogin    = $('btn-show-login');
  const btnVerifyDone   = $('btn-verify-done');
  $('btn-open-gmail')?.addEventListener('click', () => window.open('https://mail.google.com', '_blank'));
  $('btn-open-outlook')?.addEventListener('click', () => window.open('https://outlook.live.com/mail/0/inbox', '_blank'));

  const getVal = (id) => $(id)?.value?.trim() || '';

  // Helpers paneles
  function hideAllPanels(){ panelAuth?.classList.add('oculto'); panelRegister?.classList.add('oculto'); panelUsuario?.classList.add('oculto'); panelVerify?.classList.add('oculto'); }
  function showAuthPanel(){ hideAllPanels(); panelAuth?.classList.remove('oculto'); if(btnForgot) btnForgot.style.display=''; if(userEmailSpan) userEmailSpan.textContent=''; if(userPuntosSpan) userPuntosSpan.textContent='0'; }
  function showRegisterPanel(){ hideAllPanels(); panelRegister?.classList.remove('oculto'); }
  function showUserPanel(email){ hideAllPanels(); panelUsuario?.classList.remove('oculto'); if(userEmailSpan) userEmailSpan.textContent=email||''; if(btnForgot) btnForgot.style.display='none'; }
  function showVerifyPanel(email){ hideAllPanels(); if(verifyText && email){ verifyText.innerHTML = `Te enviamos un correo a <strong>${email}</strong> para verificar tu cuenta. Revisá tu bandeja y seguí el link para activarla.`; } panelVerify?.classList.remove('oculto'); }
  function setResendVisibility(user){ if(!btnResend) return; btnResend.classList.toggle('oculto', !(user && !user.emailVerified)); }

  // Switch login/registro
  btnShowRegister?.addEventListener('click', showRegisterPanel);
  btnShowLogin?.addEventListener('click', showAuthPanel);
  btnVerifyDone?.addEventListener('click', showAuthPanel);

  // Toggle contraseña (FontAwesome eye)
  window.togglePassword = function (inputId, btn){
    const input = $(inputId); if(!input) return; const icon = btn.querySelector('i');
    if (input.type === 'password') { input.type = 'text'; icon?.classList.remove('fa-eye'); icon?.classList.add('fa-eye-slash'); }
    else { input.type = 'password'; icon?.classList.remove('fa-eye-slash'); icon?.classList.add('fa-eye'); }
  };

  // Cooldowns
  const resendLimiter = createLimiter('cooldown_resend_verif', 60);
  const resetLimiter  = createLimiter('cooldown_reset_pass', 60);

  // Login
  btnLogin?.addEventListener('click', async () => {
    const email = getVal('login-email');
    const pass  = getVal('login-pass');
    if(!email || !pass) return mostrarAviso('Completá email y contraseña.');
    try{
      const cred = await auth.signInWithEmailAndPassword(email, pass);
      if (!cred.user.emailVerified) { mostrarAviso('Tenés que verificar tu correo. Podés reenviar el mail con el botón de abajo.'); setResendVisibility(cred.user); showAuthPanel(); return; }
      mostrarAviso('Sesión iniciada. ¡Bienvenido!');
    }catch(e){
      console.error(e);
      if (e?.code === 'auth/invalid-login-credentials' || e?.code === 'auth/wrong-password' || e?.code === 'auth/user-not-found') mostrarAviso("Email o contraseña incorrectos. Si no recordás la contraseña, usá 'Olvidé mi contraseña'.");
      else if (e?.code === 'auth/too-many-requests') mostrarAviso('Demasiados intentos. Esperá unos minutos y probá de nuevo.');
      else mostrarAviso('No se pudo iniciar sesión. ' + (e?.message||''));
    }
  });

  // Registro → verificación + panel verify
  let pendingVerifyEmail = null;
  btnRegister?.addEventListener('click', async () => {
    const email = getVal('reg-email');
    const pass  = getVal('reg-pass');
    const tel   = getVal('reg-tel');
    if(!email || !pass) return mostrarAviso('Completá email y contraseña.');
    if(pass.length < 6) return mostrarAviso('La contraseña debe tener al menos 6 caracteres.');
    btnRegister.disabled = true;
    try{
      const cred = await auth.createUserWithEmailAndPassword(email, pass);
      await db.ref(`/usuarios/${cred.user.uid}`).set({ email, tel: tel||null, creadoEn: Date.now() });
      await db.ref(`/puntos/${cred.user.uid}`).set({ puntos: 0, actualizadoEn: Date.now() });
      await cred.user.sendEmailVerification({ url: `${location.origin}/` });
      pendingVerifyEmail = email; // evita que el onAuthStateChanged pise el panel
      await auth.signOut();
      showVerifyPanel(email);
    }catch(e){
      console.error(e);
      if (e?.code === 'auth/email-already-in-use') mostrarAviso('Ese email ya está en uso.');
      else mostrarAviso('No se pudo crear la cuenta: ' + (e?.message||''));
    }finally{ btnRegister.disabled = false; }
  });
// Logout
btnLogout?.addEventListener('click', async () => {
  try {
    await auth.signOut();
    mostrarAviso('Sesión cerrada.');
    showAuthPanel();
  }
  catch(e){
    console.error(e);
    mostrarAviso('No se pudo cerrar sesión.');
  }
});
  // Reenviar verificación
  btnResend?.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) return mostrarAviso('Primero iniciá sesión con tu correo y contraseña.');
    if (user.emailVerified) return mostrarAviso('Tu correo ya está verificado.');
    const left = resendLimiter.secondsLeft(); if (left > 0) return mostrarAviso(`Esperá ${formatSeconds(left)} para reenviar otra vez.`);
    btnResend.disabled = true;
    try{ await user.sendEmailVerification({ url: `${location.origin}/` }); mostrarAviso('Te reenviamos el correo de verificación. Revisá tu bandeja y SPAM.'); resendLimiter.armCooldown(1); }
    catch(e){ console.error(e); if (e?.code === 'auth/too-many-requests'){ const wait = resendLimiter.armCooldown(2); mostrarAviso(`Demasiados intentos desde este dispositivo. Probá de nuevo en ${formatSeconds(wait)}.`);} else mostrarAviso('No pudimos reenviar el correo. Probá en un rato.'); }
    finally{ btnResend.disabled = false; }
  });

  // Olvidé mi contraseña
  btnForgot?.addEventListener('click', async () => {
    const email = getVal('login-email');
    if (!email) return mostrarAviso('Escribí tu email en el campo de login.');
    const left = resetLimiter.secondsLeft(); if (left > 0) return mostrarAviso(`Esperá ${formatSeconds(left)} para solicitar otro correo.`);
    btnForgot.disabled = true;
    try{ await auth.sendPasswordResetEmail(email, { url: `${location.origin}/` }); mostrarAviso('Te enviamos un mail para restablecer tu contraseña.'); resetLimiter.armCooldown(1); }
    catch(e){ console.error(e); if (e?.code === 'auth/too-many-requests'){ const wait = resetLimiter.armCooldown(2); mostrarAviso(`Demasiados intentos desde este dispositivo. Probá en ${formatSeconds(wait)}.`);} else if (e?.code==='auth/user-not-found') mostrarAviso('No existe un usuario con ese email.'); else if (e?.code==='auth/invalid-email') mostrarAviso('Correo inválido. Revisá el formato.'); else mostrarAviso('No se pudo enviar el correo de recuperación.'); }
    finally{ btnForgot.disabled = false; }
  });

  // Deep-link de verificación (?mode=verifyEmail&oobCode=...)
  (function verificarLinkSiCorresponde(){
    const p = new URLSearchParams(location.search);
    const mode = p.get('mode');
    const oob  = p.get('oobCode');
    if (mode === 'verifyEmail' && oob) {
      auth.applyActionCode(oob)
        .then(()=>{ mostrarAviso('✅ ¡Listo! Tu cuenta fue verificada. Ya podés iniciar sesión.'); pendingVerifyEmail = null; history.replaceState({}, document.title, location.pathname); })
        .catch(err=>{ console.error(err); mostrarAviso("No se pudo verificar el correo. El enlace puede haber expirado. Probá reenviarlo desde 'Mi cuenta'."); });
    }
  })();

  // onAuthStateChanged (único)
  let puntosRef = null;
  auth.onAuthStateChanged((user) => {
    if (puntosRef) { puntosRef.off(); puntosRef = null; }
    setResendVisibility(user);
    if (pendingVerifyEmail) { showVerifyPanel(pendingVerifyEmail); return; }
    if (user && user.emailVerified) {
      showUserPanel(user.email || '');
      puntosRef = db.ref(`/puntos/${user.uid}/puntos`);
      puntosRef.on('value', (snap)=>{ const val = snap.val(); if(userPuntosSpan) userPuntosSpan.textContent = (val ?? 0).toString(); });
    } else {
      showAuthPanel();
    }
  });

  /* ---------------- Productos (Firebase DB) ---------------- */
  function cargarProductosDesdeFirebase(callback) {
    const contenedor = $('productos-container');
    const loader2 = $('loader2');
    const pantallaInicio = $('pantalla-inicio');
    if (!contenedor) return;

    contenedor.innerHTML = '';
    loader2?.classList.remove('loaderoculto');
    pantallaInicio?.classList.add('oculto');

    const catalogoRef = db.ref('/catalogo');
    const preciosRef  = db.ref('/productos');
    const stockRef    = db.ref('/stock');
    const modoAdmin   = localStorage.getItem('modoAdmin') === 'true';

    Promise.all([ catalogoRef.once('value'), preciosRef.once('value'), stockRef.once('value') ])
      .then(([catalogoSnap, preciosSnap, stockSnap]) => {
        const catalogo = catalogoSnap.val();
        const precios  = preciosSnap.val();
        const stock    = stockSnap.val() || {};
        if (!Array.isArray(catalogo)) { console.error('❌ /catalogo no contiene un array.'); loader2?.classList.add('loaderoculto'); return; }

        const obtenerPrecio = (dataNombre) => {
          if (!Array.isArray(precios)) return undefined;
          const clave = (dataNombre || '').trim().toUpperCase();
          const encontrado = precios.find(p => (p['data-nombre'] || '').trim().toUpperCase() === clave);
          return encontrado?.precio;
        };

        const productosDOM = [];
        catalogo.forEach(prod => {
          const { nombre, ['data-nombre']: dataNombre, imagen, categoria='', subcategoria='', tercer_categoria='' } = prod;
          const precio = obtenerPrecio(dataNombre);
          const estaEnStock = stock[dataNombre] !== false;
          const ul = document.createElement('ul');
          ul.className = 'producto visible';
          ul.setAttribute('data-nombre', dataNombre);
          ul.setAttribute('data-categoria', categoria);
          ul.setAttribute('data-subcategoria', subcategoria);
          ul.setAttribute('data-tercer_categoria', tercer_categoria);
          ul.setAttribute('data-aos', 'fade-up');
          if (!estaEnStock) ul.classList.add('sin-stock');
          ul.innerHTML = `
       <li style="position: relative;">
    <img src="${imagen}" loading="lazy" alt="${nombre}">
    ${!estaEnStock ? `<div class="sin-stock-label">SIN STOCK</div>` : ''}
  </li>
  <li><p class="nombre">${nombre}</p></li>
  <li><p class="precio">${precio !== undefined ? `$${parseFloat(precio).toFixed(2)}` : 'Sin precio'}</p></li>
  <li>
    <button class="agregar" onclick="agregarAlCarritoDesdeElemento(this)" ${!estaEnStock ? 'disabled' : ''}>
      🛒 <span>${!estaEnStock ? 'Sin stock' : 'Agregar'}</span>
    </button>
  </li>
  ${modoAdmin ? `<li><button class="admin-controles" onclick="toggleStock(this)">Toggle Stock</button></li>` : ''}
`;
          contenedor.appendChild(ul);
          productosDOM.push(ul);
        });

        loader2?.classList.add('loaderoculto');
        window.todosLosProductosParaInicio = productosDOM;
        mostrarProductosAleatoriosEnInicio(window.todosLosProductosParaInicio);
        if (typeof callback === 'function') callback();
      })
      .catch(err => { console.error('❌ Error al cargar productos:', err); loader2?.classList.add('loaderoculto'); if (typeof callback === 'function') callback(); });
  }
  window.cargarProductosDesdeFirebase = cargarProductosDesdeFirebase; // pública

/* ====== Slider profesional ====== */
let currentIndex = 0;
let _sliderTimer = null;
const SLIDER_MS = 4500;

function goToSlide(index){
  const sliderContainer = document.querySelector('.slider-container');
  const slides = document.getElementById('slides'); // mismo que $('slides')
  if (!slides || !sliderContainer) return;

  // mover carrusel
  const w = sliderContainer.clientWidth;
  slides.style.transform = `translateX(-${index * w}px)`;

  // dots del slider (¡solo los de este slider!)
  const dots = sliderContainer.querySelectorAll('.dots .dot');

  dots.forEach((dot, i) => {
    const active = i === index;
    dot.classList.toggle('active', active);
    dot.setAttribute('aria-current', active ? 'true' : 'false');

    // refuerzo visual que pisa cualquier CSS conflictivo
    if (active) {
      dot.style.background = '#f6ff00';
      dot.style.opacity = '1';
      dot.style.transform = 'scale(1.2)';   // opcional: micro efecto
      dot.style.border = '2px solid #520a5dff'; // opcional
    } else {
      dot.style.background = '';  // vuelve a CSS
      dot.style.opacity = '';
      dot.style.transform = '';
      dot.style.border = '';
    }
  });

  currentIndex = index;
}


function nextSlide(){ goToSlide((currentIndex + 1) % 3); }
function prevSlide(){ goToSlide((currentIndex + 2) % 3); }

function startSlider(){
  stopSlider();
  _sliderTimer = setInterval(nextSlide, SLIDER_MS);
}
function stopSlider(){
  if (_sliderTimer){ clearInterval(_sliderTimer); _sliderTimer = null; }
}



function initSlider(){
  const slider = document.querySelector('.slider-container');
  if (!slider) return;

  goToSlide(0);
  startSlider();

  slider.addEventListener('mouseenter', stopSlider);
  slider.addEventListener('mouseleave', startSlider);

  document.addEventListener('visibilitychange', () => {
    document.hidden ? stopSlider() : startSlider();
  });

  let startX = null;
  slider.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive:true });
  slider.addEventListener('touchend', (e) => {
    if (startX == null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40){ dx < 0 ? nextSlide() : prevSlide(); }
    startX = null;
  }, { passive:true });

  window.addEventListener('resize', () => goToSlide(currentIndex));
}
window.initSlider = initSlider; // <-- ¡esto faltaba!


// Exponer al ámbito global para los onclick del HTML
window.goToSlide   = goToSlide;
window.nextSlide   = nextSlide;
window.prevSlide   = prevSlide;
window.startSlider = startSlider;
window.stopSlider  = stopSlider;
/* ---------------- Admin simple (demo) ---------------- */
function activarModoAdminUI() {
  // Muestra elementos marcados para admin
  document.querySelectorAll('.admin-controles').forEach(el => el.style.display = 'block');
  // Si tenés estilos que dependen de la clase en body (p.ej. .admin-activo .toggle-stock-btn)
  document.body.classList.add('admin-activo');
  
}

window.activarModoAdmin = function () {
  localStorage.setItem('modoAdmin', 'true');

  const m = $('mensaje');
  if (m) { m.style.color = 'green'; m.textContent = '¡Modo Admin activado! Bienvenido.'; }

  $('login')?.classList.add('oculto');
  $('logout')?.classList.remove('oculto');

  // Oculta el panel visual del login
  const c = $('login-container');
  if (c) c.style.display = 'none';

  // Carga/refresh de productos para ver controles de admin
  try { cargarProductosDesdeFirebase?.(); } catch (e) { console.warn('cargarProductosDesdeFirebase no disponible', e); }

  activarModoAdminUI();
};

window.verificarAdmin = function () {
  // Tolerante a espacios y mayúsculas
  const usuario = (($('usuario')?.value) || '').trim().toLowerCase();
  const contrasena = (($('contrasena')?.value) || '').trim();

  if (usuario === 'admin' && contrasena === '3612') {
    window.activarModoAdmin();
  } else {
    const m = $('mensaje');
    if (m) { m.style.color = 'red'; m.textContent = 'Usuario o contraseña incorrectos.'; }
  }
};

window.cerrarSesion = function () {
  localStorage.removeItem('modoAdmin');

  if ($('usuario')) $('usuario').value = '';
  if ($('contrasena')) $('contrasena').value = '';
  if ($('mensaje')) $('mensaje').textContent = '';

  $('login')?.classList.remove('oculto');
  $('logout')?.classList.add('oculto');

  const c = $('login-container');
  if (c) c.style.display = 'none';

  // Oculta elementos admin y quita clase del body
  document.querySelectorAll('.admin-controles').forEach(el => el.style.display = 'none');
  document.body.classList.remove('admin-activo');
};

// Estado admin al cargar
if (localStorage.getItem('modoAdmin') === 'true') {
  activarModoAdminUI();
  $('login')?.classList.add('oculto');
  $('logout')?.classList.remove('oculto');
} else {
  if ($('login')) $('login').style.display = 'block';
  if ($('logout')) $('logout').style.display = 'none';
  if ($('login-container')) $('login-container').style.display = 'none';
}

/* ---------- Hooks para que el login SIEMPRE funcione ---------- */
document.addEventListener('DOMContentLoaded', () => {
  
  // 1) Si tu login está dentro de un <form>, evitá el submit y llamá a verificarAdmin()
  const form = document.querySelector('#login form') || document.getElementById('login-form');
  if (form && !form._adminBound) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();      // evita recarga
      window.verificarAdmin(); // valida credenciales
    });
    form._adminBound = true;
  }

  // 2) Si tenés un botón específico dentro del login (por si no es <form>)
  const btnIngresar = document.querySelector('#login button[type="submit"], #login button.ingresar-admin');
  if (btnIngresar && !btnIngresar._adminBound) {
    btnIngresar.addEventListener('click', (e) => {
      e.preventDefault();
      window.verificarAdmin();
    });
    btnIngresar._adminBound = true;
  }

  // 3) Enter en los inputs también dispara login (por si no hay <form>)
  ['usuario', 'contrasena'].forEach(id => {
    const input = $(id);
    if (input && !input._enterBound) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          window.verificarAdmin();
        }
      });
      input._enterBound = true;
    }
  });
});

/* Toggle login admin robusto (se mantiene como lo tenías) */
window.mostrarLogin = function () {
  const c = $('login-container');
  if (!c) return;
  const visible = window.getComputedStyle(c).display !== 'none';
  c.style.display = visible ? 'none' : 'block';
  if (!visible) { $('mensaje') && ($('mensaje').textContent = ''); $('usuario')?.focus(); }
};




  /* ---------------- Búsqueda y lupa móvil ---------------- */
  const inputBusqueda = $('busqueda-productos');
  inputBusqueda?.addEventListener('input', () => {
    const valor = inputBusqueda.value.toLowerCase();
    document.querySelectorAll('.producto').forEach(prod => {
      const nombre = prod.querySelector('.nombre')?.textContent.toLowerCase() || '';
      prod.style.display = nombre.includes(valor) ? 'flex' : 'none';
    });
  });
  const btnLupa = $('boton-lupa');
  const barraBusqueda = $('barra-busqueda-movil');
  if (btnLupa && barraBusqueda) btnLupa.addEventListener('click', ()=> barraBusqueda.classList.toggle('oculto-en-movil'));

  /* ---------------- Inicio / categorías ---------------- */
  window.mostrarInicio = function(){ $('pantalla-inicio')?.classList.remove('oculto'); $('productos-container')&&($('productos-container').style.display='none'); $('ordenador-productos')&&($('ordenador-productos').style.display='none'); document.querySelector('.container')?.classList.add('oculto'); document.querySelector('.menu')?.classList.remove('oculto'); overlay?.classList.remove('active'); };

  function cerrarMenuYOverlay(){ menu?.classList.remove('abierto'); overlay?.classList.remove('active'); header?.classList.remove('opaco'); menuToggle?.classList.remove('activo'); cerrarTodosLosSubmenus(); const sub = $('submenu-categorias'); if(sub){ sub.classList.remove('show','animar'); sub.innerHTML=''; } }

  window.filtrarCategoria = function(categoria, botonClickeado=null){
    // Subcategorías
    const map = {
      bebidas:['Cerveza','Gaseosas','Jugos','Vinos'],
      Cerveza:['Packs','Latas','Latones','Botellas'],
      Gaseosas:['Linea Coca','Linea Pepsi','Linea Manaos','Soda'],
      Vinos:['Tinto','Blanco'],
      Jugos:['En Sobre','Agua Saborizada','Baggio/Cepita/Ades'],
      Golosinas:['Chocolates','Gomitas','Caramelos','Galletitas','Snacks'],
      Chocolates:['Blancos','Negro','Cajas de Chocolates','Bocaditos'],
      Gomitas:['Acidas/Picantes','Comunes'],
      Snacks:['Papas','Palitos','Chizitos'],
      Galletitas:['Bagley','Terrabusi','Arcor','Solitas','Paseo','Okebon','Frutigran','Don Satur','Cofler'],
      alimentos:['Panadería','Fideos','Arroz','Salchichas','Hamburguesas','Pizzas'],
      Panadería:['Pan Común','Pan de Hamburguesa','Pan de Panchos','Pan Lactal','Grisines/Galletas'],
      farmacia:['Medicamentos','Higiene','Preservativos'],
      Higiene:['Productos Femeninos','Desodoranetes','Máquinas de Afeitar','Jabones']
    };

    const submenu = $('submenu-categorias');
    if (map[categoria]?.length) {
      submenu.innerHTML=''; submenu.classList.add('show','animar');
      const btnTodos = document.createElement('button'); btnTodos.textContent='Ver todos'; btnTodos.onclick=()=>{ filtrarProductosPorCategoria(categoria); cerrarMenuYOverlay(); }; submenu.appendChild(btnTodos);
      map[categoria].forEach(sub=>{ const b=document.createElement('button'); b.textContent=sub; b.onclick=()=>{ filtrarProductosPorCategoria(sub); cerrarMenuYOverlay(); }; submenu.appendChild(b); });
      if (botonClickeado) { const li = botonClickeado.closest('li'); if (li) li.insertAdjacentElement('afterend', submenu); }
      window.categoriaActiva = categoria; return;
    }
    filtrarProductosPorCategoria(categoria); cerrarMenuYOverlay();
  };

  window.filtrarProductosPorCategoria = function(categoriaSeleccionada){
    const barraCategoria = $('barra-categoria');
    const tituloCategoria = $('titulo-categoria');
    const botonesContainer = $('subcategorias-relacionadas');
    if (tituloCategoria) tituloCategoria.textContent = categoriaSeleccionada;
    if (barraCategoria) barraCategoria.style.display = 'flex';

    // Render botones relacionados
    const rel = {
      Cerveza:['Packs','Latas','Latones','Botellas'],
      Gaseosas:['Linea Coca','Linea Pepsi','Linea Manaos','Soda'],
      Vinos:['Tinto','Blanco'],
      Jugos:['En Sobre','Agua Saborizada','Baggio/Cepita/Ades'],
      Chocolates:['Blancos','Negro','Cajas de Chocolates','Bocaditos'],
      Gomitas:['Acidas/Picantes','Comunes'],
      Snacks:['Papas','Palitos','Chizitos'],
      Galletitas:['Bagley'],
      Panadería:['Pan Común','Pan de Hamburguesa','Pan de Panchos','Pan Lactal','Grisines/Galletas'],
      Higiene:['Productos Femeninos','Desodoranetes','Máquinas de Afeitar','Jabones']
    };

    if (botonesContainer) {
      botonesContainer.innerHTML='';
      let rendered=false;
      for (const [principal, subs] of Object.entries(rel)) {
        if (subs.includes(categoriaSeleccionada)) { subs.filter(s=>s!==categoriaSeleccionada).forEach(s=>{ const b=document.createElement('button'); b.textContent=s; b.onclick=()=>window.filtrarProductosPorCategoria(s); botonesContainer.appendChild(b); }); const all=document.createElement('button'); all.textContent='Ver todos'; all.onclick=()=>window.filtrarProductosPorCategoria(principal); botonesContainer.appendChild(all); rendered=true; break; }
        if (principal === categoriaSeleccionada) { subs.forEach(s=>{ const b=document.createElement('button'); b.textContent=s; b.onclick=()=>window.filtrarProductosPorCategoria(s); botonesContainer.appendChild(b); }); const all=document.createElement('button'); all.textContent='Ver todos'; all.onclick=()=>window.filtrarProductosPorCategoria(categoriaSeleccionada); botonesContainer.appendChild(all); rendered=true; break; }
      }
      if (!rendered) { botonesContainer.innerHTML=''; }
    }

    localStorage.setItem('ultimaCategoria', categoriaSeleccionada);
    document.querySelector('.container')?.classList.remove('oculto');

    if (!window.productosCargados) {
      if (window.productosCargando) return; window.productosCargando = true;
      cargarProductosDesdeFirebase(() => { window.productosCargados = true; window.productosCargando = false; window.filtrarProductosPorCategoria(categoriaSeleccionada); });
      return;
    }

    document.querySelectorAll('.producto').forEach(prod => {
      const cat = prod.getAttribute('data-categoria');
      const sub = prod.getAttribute('data-subcategoria');
      const ter = prod.getAttribute('data-tercer_categoria');
      prod.style.display = (cat===categoriaSeleccionada || sub===categoriaSeleccionada || ter===categoriaSeleccionada) ? 'flex' : 'none';
    });

    $('pantalla-inicio')?.classList.add('oculto');
    $('productos-container')&&($('productos-container').style.display='grid');
    $('ordenador-productos')&&($('ordenador-productos').style.display='flex');
    overlay?.classList.remove('active');
    const ordenar = $('ordenar'); if (ordenar) ordenar.value = '';
  };

  window.filtrarPorTercerCategoria = function(categoria){
    localStorage.setItem('ultimaCategoria', categoria);
    const busca = (categoria||'').toLowerCase();
    if (!window.productosCargados) {
      if (window.productosCargando) return; window.productosCargando=true;
      cargarProductosDesdeFirebase(()=>{ window.productosCargados=true; window.productosCargando=false; window.filtrarPorTercerCategoria(categoria); });
      return;
    }
    document.querySelectorAll('.producto').forEach(p=>{
      const cat=(p.getAttribute('data-categoria')||'').toLowerCase();
      const sub=(p.getAttribute('data-subcategoria')||'').toLowerCase();
      const ter=(p.getAttribute('data-tercer_categoria')||'').toLowerCase();
      p.style.display = (cat===busca || sub===busca || ter===busca) ? 'flex' : 'none';
    });
    document.querySelector('.container')?.classList.remove('oculto');
    $('pantalla-inicio')?.classList.add('oculto');
    $('productos-container')&&($('productos-container').style.display='grid');
    $('ordenador-productos')&&($('ordenador-productos').style.display='flex');
    const ordenar = $('ordenar'); if (ordenar) ordenar.value = '';
    overlay?.classList.remove('active');
    cerrarMenuYOverlay();
  };

  window.filtrarSoloCategoria = function(categoria){
    cargarProductosDesdeFirebase(()=>{
      document.querySelectorAll('.producto').forEach(p=>{ const cat=p.getAttribute('data-categoria'); p.style.display = (cat===categoria)?'flex':'none'; });
      cerrarMenuYOverlay();
    });
  };

  /* ---------------- Carrito ---------------- */
  let carrito = [];
  const carritoItems = $('carrito-items');
  const totalCarrito = $('total-carrito');
  const contadorCarrito = $('contador-carrito');
  const pagarBtn = $('pagar-btn');

  function actualizarCarrito(){
    if (!carritoItems || !totalCarrito || !contadorCarrito) return;
    carritoItems.innerHTML='';
    let total=0;
    carrito.forEach(item=>{
      const div=document.createElement('div');
      div.className='item';
      div.innerHTML=`<img src="${item.imagen}" alt="${item.nombre}"><span>${item.nombre} x${item.cantidad} - $${(item.precio*item.cantidad).toFixed(2)}</span><button class="eliminar-unidad" data-nombre="${item.nombre}">❌</button>`;
      carritoItems.appendChild(div);
      total += item.precio * item.cantidad;
    });
    totalCarrito.textContent = `Total: $${total.toFixed(2)}`;
    contadorCarrito.textContent = carrito.reduce((acc,it)=>acc+it.cantidad,0);
    carritoItems.querySelectorAll('.eliminar-unidad').forEach(btn=> btn.addEventListener('click', ()=> eliminarUnidad(btn.dataset.nombre)) );
  }
  function eliminarUnidad(nombre){ const i=carrito.findIndex(it=>it.nombre===nombre); if(i!==-1){ carrito[i].cantidad>1?carrito[i].cantidad--:carrito.splice(i,1); actualizarCarrito(); } }
  function agregarAlCarrito(nombre, precio, imagen, boton){ const ex=carrito.find(it=>it.nombre===nombre); ex?ex.cantidad++:carrito.push({nombre,precio,imagen,cantidad:1}); actualizarCarrito(); animarAgregar(boton); }
  function vaciarCarrito(){ carrito=[]; actualizarCarrito(); }
  function animarAgregar(boton){ const floating=document.createElement('div'); floating.className='floating-plus'; floating.textContent='+1'; document.body.appendChild(floating); const from=boton.getBoundingClientRect(); floating.style.left=`${from.left + from.width/2}px`; floating.style.top=`${from.top}px`; const cRect=$('abrir-carrito').getBoundingClientRect(); const dx=cRect.left - from.left; const dy=cRect.top - from.top; setTimeout(()=>{ floating.style.transform=`translate(${dx}px, ${dy}px) scale(0.5)`; floating.style.opacity=0; setTimeout(()=>floating.remove(),1000); },50); }

  window.agregarAlCarritoDesdeElemento = function(boton){ const prod=boton.closest('.producto'); const nombre=prod.querySelector('.nombre')?.textContent||''; const precioTexto=prod.querySelector('.precio')?.textContent||'0'; const imagen=prod.querySelector('img')?.src||''; const precio=parseFloat(precioTexto.replace(/[^0-9.]/g,''))||0; agregarAlCarrito(nombre, precio, imagen, boton); };
  window.pagarCarrito = function(){ if (carrito.length===0) return alert('El carrito está vacío.'); let msj='*¡Hola! Quiero hacer este pedido:*\n\n'; carrito.forEach(it=> msj+=`• ${it.nombre} x${it.cantidad} - $${it.precio.toFixed(2)}\n`); const total=carrito.reduce((a,it)=>a+it.precio*it.cantidad,0); msj+=`\n*Total: $${total.toFixed(2)}*\n\nMi dirección es: ...`; window.open(`https://wa.me/+542221440844?text=${encodeURIComponent(msj)}`,'_blank'); };
  pagarBtn?.addEventListener('click', ()=> window.pagarCarrito());

  /* ---------------- Ordenar productos visibles ---------------- */
  $('ordenar')?.addEventListener('change', (e)=> ordenarProductosVisibles(e.target.value));
  function ordenarProductosVisibles(criterio){
    const contenedor = $('productos-container');
    const loader2 = $('loader2');
    if (!contenedor) return;
    contenedor.style.display='none'; loader2?.classList.remove('loaderoculto');
    setTimeout(()=>{
      const productos = Array.from(contenedor.querySelectorAll('.producto')).filter(p=> p.style.display !== 'none');
      productos.sort((a,b)=>{
        const nombreA = a.querySelector('.nombre')?.textContent.toLowerCase()||'';
        const nombreB = b.querySelector('.nombre')?.textContent.toLowerCase()||'';
        const precioA = parseFloat((a.querySelector('.precio')?.textContent||'0').replace(/[^0-9.]/g,''))||0;
        const precioB = parseFloat((b.querySelector('.precio')?.textContent||'0').replace(/[^0-9.]/g,''))||0;
        if (criterio==='nombre-asc') return nombreA.localeCompare(nombreB);
        if (criterio==='nombre-desc')return nombreB.localeCompare(nombreA);
        if (criterio==='precio-asc') return precioA - precioB;
        if (criterio==='precio-desc')return precioB - precioA;
        return 0;
      });
      productos.forEach(p=> contenedor.appendChild(p));
      loader2?.classList.add('loaderoculto');
      contenedor.style.display='grid';
    },300);
  }


/* ---- Productos del inicio: SIEMPRE 4 y con duración estable ---- */
(function () {
  // limpia timers viejos
  ['_rotativosInterval','_rotitivosInterval','_rotativosTimeout'].forEach(k=>{
    if (window[k]) { clearTimeout(window[k]); clearInterval(window[k]); window[k] = null; }
  });

  const MAX          = 4;
  const INTERVALO_MS = 5000;
  const ANIM         = 'fade';  // <<< elige: 'fade' | 'slide' | 'scale' | 'flip' | 'css'
  const D = { fade: .35, slide: .45, scale: .45, flip: .55 }; // duraciones

  // quita “Agregar” del clon
  function removeAddButton(clon){
    const addBtn = clon.querySelector('button.agregar');
    if (addBtn) (addBtn.closest('li') || addBtn).remove();
  }

  function sample(arr, n) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a.slice(0, Math.min(n, a.length));
  }

  // ===== Animaciones =====
  async function animOut(cont){
    const current = Array.from(cont.children);
    if (!current.length) return;
    switch (ANIM) {
      case 'fade':
        await gsap.to(current, { opacity:0, duration:D.fade, ease:'power1.out' });
        break;
      case 'slide':
        await gsap.to(current, { xPercent:-6, opacity:0, duration:D.slide, ease:'power2.in' });
        break;
      case 'scale':
        await gsap.to(current, { scale:0.92, opacity:0, duration:D.scale, ease:'power2.inOut' });
        break;
      case 'flip':
        await gsap.to(current, { rotateY:-35, y:-10, opacity:0, duration:D.flip, ease:'power2.in' });
        break;
      case 'css':
        // CSS-only: dejamos que el CSS haga la salida; breve espera
        await new Promise(r=>setTimeout(r, 200));
        break;
    }
  }

  function animIn(nodes){
    switch (ANIM) {
      case 'fade':
        gsap.fromTo(nodes, { opacity:0 }, { opacity:1, duration:D.fade, ease:'power1.out', stagger:0.03 });
        break;
      case 'slide':
        gsap.fromTo(nodes, { xPercent:6, opacity:0 }, { xPercent:0, opacity:1, duration:D.slide, ease:'power3.out', stagger:0.04 });
        break;
      case 'scale':
        gsap.fromTo(nodes, { scale:0.96, opacity:0 }, { scale:1, opacity:1, duration:D.scale, ease:'back.out(1.4)', stagger:0.05 });
        break;
      case 'flip':
        gsap.fromTo(nodes, { rotateY:35, y:10, opacity:0, transformOrigin:'50% 50%' }, { rotateY:0, y:0, opacity:1, duration:D.flip, ease:'power2.out', stagger:0.05 });
        break;
      case 'css':
        // CSS-only: sin JS, el CSS hace la entrada
        break;
    }
  }

  window.mostrarProductosAleatoriosEnInicio = function (productos) {
    const $ = (id) => document.getElementById(id);
    const cont = $('productos-rotativos');
    if (!cont || !Array.isArray(productos) || !productos.length) return;

    let lastTick = 0;

    function candidatos(){ return productos.filter(p => p && !p.classList?.contains('sin-stock')); }

    async function renderBatch(){
      const pool = candidatos();
      if (!pool.length) return;

      // preparar nuevos
      const elegidos = sample(pool, MAX).map(p=>{
        const clon = p.cloneNode(true);
        clon.classList.add('rotativo-card');
        clon.style.display = '';
        removeAddButton(clon);
        // Resets sanos
        clon.style.opacity = 1; clon.style.transform = '';
        clon.querySelectorAll('.admin-controles')?.forEach(el=>el.remove());
        return clon;
      });

      // salida
      await animOut(cont);

      // reemplazo
      cont.innerHTML = '';
      elegidos.forEach(n=>cont.appendChild(n));

      // entrada
      animIn(elegidos);
    }

    function tick(){
      const now = Date.now();
      if (now - lastTick < INTERVALO_MS - 50) { scheduleNext(); return; }
      lastTick = now;
      renderBatch();
      scheduleNext();
    }
    function scheduleNext(){
      if (window._rotativosTimeout) clearTimeout(window._rotativosTimeout);
      window._rotativosTimeout = setTimeout(tick, INTERVALO_MS);
    }

    // primer render
    lastTick = Date.now();
    renderBatch();
    scheduleNext();
  };
})();






  /* ---------------- Submenús móviles ---------------- */
  if (window.innerWidth <= 768) {
    document.querySelectorAll('.abrir-submenu').forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelectorAll('.sub-menu-fixed').forEach(m => m.classList.remove('show-mobile'));
        const id = this.dataset.submenu; const sub = $(id);
        if (sub) {
          sub.classList.add('show-mobile');
          const volverBtn = sub.querySelector('.volver-btn');
          if (volverBtn) { volverBtn.style.display='block'; volverBtn.onclick=()=> sub.classList.remove('show-mobile'); }
          const mh = $('menuHeader'); if (mh) mh.style.display='none';
        }
      });
    });
  }

  document.addEventListener('click', (e)=>{
    if (e.target.classList?.contains('volver-btn')) { const submenu = e.target.closest('.sub-menu-fixed'); if (submenu) submenu.style.display='none'; }
  });

  /* ---------------- Toggle stock (única versión) ---------------- */
  window.toggleStock = function(boton){
    const productoEl = boton.closest('.producto'); if(!productoEl) return;
    const nombre = productoEl.getAttribute('data-nombre');
    const sinStock = productoEl.classList.toggle('sin-stock');

    // Etiqueta SIN STOCK
    let etiqueta = productoEl.querySelector('.sin-stock-label');
    if (!etiqueta) {
      etiqueta = document.createElement('div');
      etiqueta.className = 'sin-stock-label';
      etiqueta.textContent = 'SIN STOCK';
      etiqueta.style = 'position:absolute;top:8px;left:8px;background:rgba(255,0,0,.85);color:#fff;padding:3px 8px;font-weight:700;font-size:.8rem;border-radius:3px;pointer-events:none;z-index:10;';
      const liImg = productoEl.querySelector('li:first-child');
      if (liImg) { liImg.style.position='relative'; liImg.appendChild(etiqueta); }
    }
    etiqueta.style.display = sinStock ? 'block' : 'none';

    // Botón agregar
    const botonAgregar = productoEl.querySelector('button.agregar');
    if (botonAgregar) { botonAgregar.disabled = sinStock; const span = botonAgregar.querySelector('span'); if (span) span.textContent = sinStock ? 'Sin stock' : 'Agregar'; }

    // Persistir en Firebase (/stock/{data-nombre} = !sinStock)
    try { firebase.database().ref('/stock/' + nombre).set(!sinStock); } catch(e){ console.error('No se pudo actualizar stock:', e); }
  };

  /* ---------------- Estado de última categoría y carga inicial ---------------- */
  const LIMITE_TIEMPO_MS = 60*60*1000; // 1h
  const ultimaVisita = localStorage.getItem('ultimaVisita');
  if (ultimaVisita){ const diff = Date.now()-parseInt(ultimaVisita,10); if(diff>LIMITE_TIEMPO_MS){ localStorage.removeItem('ultimaCategoria'); } }
  localStorage.setItem('ultimaVisita', Date.now().toString());

  const ultimaCategoria = localStorage.getItem('ultimaCategoria');
  if (ultimaCategoria) { cargarProductosDesdeFirebase(()=> window.filtrarProductosPorCategoria(ultimaCategoria)); }
  else { cargarProductosDesdeFirebase(); }

  /* ---------------- IntersectionObserver + GSAP ---------------- */
  const observer = new IntersectionObserver((entries)=> entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('visible'); }), { threshold: 0.1 });
  document.querySelectorAll('.producto').forEach(el => observer.observe(el));
  if (window.gsap) { gsap.from('.producto', { opacity:0, y:40, stagger:0.1, duration:0.8, ease:'power3.out' }); }
});

