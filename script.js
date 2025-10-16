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
      header?.classList.remove('menu-open');   // 👈 restaura el icono
    menuToggle?.classList.remove('activo');
    cerrarTodosLosSubmenus();
  });

// Debounce para evitar que el primer click cierre inmediatamente
let overlayJustOpened = false;

if (menuToggle && menu && overlay && header) {
  menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const abierto = menu.classList.toggle('abierto');

    

    // Activo overlay *después* y con debounce
    if (abierto) {
      overlayJustOpened = true;
      setTimeout(()=> overlayJustOpened = false, 180);
    }
    overlay.classList.toggle('active', abierto);
    menuToggle.classList.toggle('activo', abierto);
    header.classList.toggle('opaco', abierto);
    header.classList.toggle('menu-open', abierto);
  });

  overlay.addEventListener('click', () => {
      // si hay submenús activos, no cerrar nada todavía
  const activo = document.querySelector('.sub-menu-fixed.mostrar');
  if (activo) return;
    if (overlayJustOpened) return; // ignora el click sintético inmediato
    menu.classList.remove('abierto');
    carritoSidebar?.classList.remove('active');
    overlay.classList.remove('active');
    header.classList.remove('opaco');
    header.classList.remove('menu-open');
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

// ===  LOGIN ===
btnLogin?.addEventListener('click', async () => {
  const identificador = getVal('login-email'); // puede ser email o nombre de usuario
  const pass = getVal('login-pass');

  if (!identificador || !pass)
    return mostrarAviso('Completá usuario/email y contraseña.');

  btnLogin.disabled = true;

  try {
    let emailParaLogin = identificador.trim().toLowerCase();

    // Si no es un email (no contiene "@"), buscar en la base de datos
    if (!emailParaLogin.includes('@')) {
      const usuariosSnap = await db.ref('/usuarios').once('value');
      let encontrado = null;

      if (usuariosSnap.exists()) {
        usuariosSnap.forEach((snap) => {
          const userData = snap.val();
          if (userData.nombreUsuario?.toLowerCase() === emailParaLogin) {
            encontrado = userData.email;
          }
        });
      }

      if (!encontrado) {
        mostrarAviso('Usuario no encontrado.');
        btnLogin.disabled = false;
        return;
      }

      emailParaLogin = encontrado;
    }

    // Iniciar sesión con el correo encontrado o ingresado
    const cred = await auth.signInWithEmailAndPassword(emailParaLogin, pass);
    mostrarAviso('Inicio de sesión exitoso ✅');

    // Mostrar nombre de usuario al iniciar sesión
    const uid = cred.user.uid;
    const userSnap = await db.ref(`/usuarios/${uid}/nombreUsuario`).once('value');
    const nombreUsuario = userSnap.val();

    const etiquetaUsuario = document.getElementById('usuario-label');
    if (etiquetaUsuario && nombreUsuario)
      etiquetaUsuario.textContent = `Usuario: ${nombreUsuario}`;

  } catch (e) {
    console.error(e);
    if (e.code === 'auth/wrong-password')
      mostrarAviso('Contraseña incorrecta.');
    else if (e.code === 'auth/user-not-found')
      mostrarAviso('Usuario o email no encontrado.');
    else
      mostrarAviso('Error al iniciar sesión: ' + (e.message || ''));
  } finally {
    btnLogin.disabled = false;
  }
});


  // Registro → verificación + panel verify
// Registro con nombre de usuario único + verificación
let pendingVerifyEmail = null;
btnRegister?.addEventListener('click', async () => {
  const email = getVal('reg-email');
  const pass  = getVal('reg-pass');
  const tel   = getVal('reg-tel');
  const nombreUsuarioInput = document.getElementById('nombreUsuario');
  const nombreUsuario = nombreUsuarioInput?.value?.trim()?.toLowerCase() || '';

  if (!email || !pass || !nombreUsuario)
    return mostrarAviso('Completá email, contraseña y nombre de usuario.');
  if (pass.length < 6)
    return mostrarAviso('La contraseña debe tener al menos 6 caracteres.');

  btnRegister.disabled = true;

  try {
    const usuariosRef = db.ref('/usuarios');
    const snapshot = await usuariosRef.once('value');
    let nombreRepetido = false;
    let contadorUsuarios = 0;

    if (snapshot.exists()) {
      snapshot.forEach(userSnap => {
        const u = userSnap.val();
        contadorUsuarios++;
        if (u.nombreUsuario?.toLowerCase() === nombreUsuario) {
          nombreRepetido = true;
        }
      });
    }

    if (nombreRepetido) {
      mostrarAviso('Ese nombre de usuario ya está en uso. Elegí otro.');
      btnRegister.disabled = false;
      return;
    }

    // Crear usuario
    const cred = await auth.createUserWithEmailAndPassword(email, pass);
    const numeroUsuario = contadorUsuarios + 1;

    await db.ref(`/usuarios/${cred.user.uid}`).set({
      email,
      tel: tel || null,
      nombreUsuario,
      numeroUsuario,
      creadoEn: Date.now()
    });

    await db.ref(`/puntos/${cred.user.uid}`).set({
      puntos: 0,
      actualizadoEn: Date.now()
    });

    await cred.user.sendEmailVerification({ url: `${location.origin}/` });
    pendingVerifyEmail = email;
    await auth.signOut();
    showVerifyPanel(email);

  } catch (e) {
    console.error(e);
    if (e?.code === 'auth/email-already-in-use')
      mostrarAviso('Ese email ya está en uso.');
    else
      mostrarAviso('No se pudo crear la cuenta: ' + (e?.message || ''));
  } finally {
    btnRegister.disabled = false;
  }
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

// === onAuthStateChanged (único) ===
let puntosRef = null;

auth.onAuthStateChanged((user) => {
  // --- Referencias del DOM ---
  const userPuntosSpan = document.getElementById("user-puntos"); // <-- ESTA es la correcta
  const etiquetaUsuario = document.getElementById("usuario-label");

  // --- Limpiar listeners anteriores ---
  if (puntosRef) {
    puntosRef.off();
    puntosRef = null;
  }

  setResendVisibility(user);
  if (pendingVerifyEmail) {
    showVerifyPanel(pendingVerifyEmail);
    return;
  }

  if (user && user.emailVerified) {
    showUserPanel(user.email || "");

    // --- Mostrar nombre de usuario ---
    db.ref(`/usuarios/${user.uid}/nombreUsuario`)
      .once("value")
      .then((snap) => {
        const nombreUsuario = snap.val();
        if (etiquetaUsuario && nombreUsuario) {
          etiquetaUsuario.textContent = `Usuario: ${nombreUsuario}`;
        }
      });

    // --- Mostrar puntos del usuario ---
    puntosRef = db.ref(`/puntos/${user.uid}/puntos`);
    puntosRef.on("value", (snap) => {
      const puntos = snap.val() ?? 0;
      if (userPuntosSpan) {
        userPuntosSpan.textContent = puntos.toString();
      }
    });

  } else {
    showAuthPanel();

    // Reset visual si no hay usuario
    if (etiquetaUsuario) etiquetaUsuario.textContent = "Usuario: -";
    if (userPuntosSpan) userPuntosSpan.textContent = "0";
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
  const productos = document.querySelectorAll('.producto');
  const pantallaInicio = $('pantalla-inicio');
  const contenedorProductos = $('productos-container');
  const containerPrincipal = document.querySelector('.container');
  const ordenadorProductos = $('ordenador-productos');
  const barraCategorias = document.querySelectorAll('.barra-categoria, .titulo-categoria');

  let hayCoincidencias = false;

  // 🔹 Buscar coincidencias
  productos.forEach(prod => {
    const nombre = prod.querySelector('.nombre')?.textContent.toLowerCase() || '';
    const coincide = nombre.includes(valor);
    prod.style.display = coincide ? 'flex' : 'none';
    if (coincide) hayCoincidencias = true;
  });

  // 🔹 Crear o buscar mensaje de "sin resultados"
  let mensajeNoResultados = document.getElementById('mensaje-no-resultados');
  if (!mensajeNoResultados) {
    mensajeNoResultados = document.createElement('p');
    mensajeNoResultados.id = 'mensaje-no-resultados';
    mensajeNoResultados.textContent = 'No se encontraron productos.';
    mensajeNoResultados.style.textAlign = 'center';
    mensajeNoResultados.style.fontSize = '1.2rem';
    mensajeNoResultados.style.marginTop = '2rem';
    mensajeNoResultados.style.color = '#742081';
    contenedorProductos?.appendChild(mensajeNoResultados);
  }

  // 🔹 Lógica principal
  if (valor.trim() !== '') {
    // Ocultar inicio y mostrar productos
    pantallaInicio?.classList.add('oculto');
    containerPrincipal?.classList.remove('oculto');
    if (contenedorProductos) contenedorProductos.style.display = 'grid';
    if (ordenadorProductos) ordenadorProductos.style.display = 'flex';

    // Ocultar carteles de categorías
    barraCategorias.forEach(el => el.style.display = 'none');

    // Mostrar u ocultar mensaje según resultados
    if (hayCoincidencias) {
      mensajeNoResultados.style.display = 'none';
    } else {
      mensajeNoResultados.style.display = 'block';
    }

  } else {
    // Si se borra la búsqueda, volver al inicio
    pantallaInicio?.classList.remove('oculto');
    containerPrincipal?.classList.add('oculto');
    if (contenedorProductos) contenedorProductos.style.display = 'none';
    if (ordenadorProductos) ordenadorProductos.style.display = 'none';
    barraCategorias.forEach(el => el.style.display = '');
    mensajeNoResultados.style.display = 'none';
  }
});



  const btnLupa = $('boton-lupa');
  const barraBusqueda = $('barra-busqueda-movil');
  if (btnLupa && barraBusqueda) btnLupa.addEventListener('click', ()=> barraBusqueda.classList.toggle('oculto-en-movil'));

  /* ---------------- Inicio / categorías ---------------- */
  window.mostrarInicio = function(){ 
    $('pantalla-inicio')?.classList.remove('oculto'); 
    $('productos-container')&&($('productos-container').style.display='none');
     $('ordenador-productos')&&($('ordenador-productos').style.display='none');
      document.querySelector('.container')?.classList.add('oculto'); 
      document.querySelector('.menu')?.classList.remove('oculto'); 
      overlay?.classList.remove('active'); 
    cerrarMenuYOverlay();
      resetearBusquedaYCategoria();
};

function cerrarMenuYOverlay() {
  const menu = document.getElementById('menu');
  const overlay = document.getElementById('overlay');
  const header = document.querySelector('.header');
  const menuToggle = document.getElementById('menuToggle');
  const productos = document.getElementById('productos-container');
  const menuHeader = document.getElementById('menuHeader');

  if (!menu || !overlay || !header || !menuToggle) return;

  // Cierra menú y quita cualquier estado
  menu.classList.remove('abierto', 'submenu-open');
  menu.removeAttribute('style');

  // Cierra TODOS los submenús
  document.querySelectorAll('.sub-menu-fixed').forEach(submenu => {
    submenu.classList.remove('mostrar', 'show', 'show-mobile');
    submenu.style.display = 'none';
  });

  // (Opcional) resetea flechas si usás último icono guardado
  if (window.ultimoIconoFlechaAbierto) {
    window.ultimoIconoFlechaAbierto.classList.remove('fa-chevron-down');
    window.ultimoIconoFlechaAbierto.classList.add('fa-arrow-right');
    window.ultimoIconoFlechaAbierto = null;
  }

  // Limpia header y botón
  header.classList.remove('opaco', 'menu-open');
  menuToggle.classList.remove('activo');

  // Desactiva overlay y limpia inline
  overlay.classList.remove('active');
  overlay.style.opacity = '0';
  overlay.style.pointerEvents = 'none';
  setTimeout(() => overlay.removeAttribute('style'), 300);

  // Asegura que el contenedor de productos NO tape el menú
  if (productos) productos.style.zIndex = '1';

  // Restituye header del menú (logo + título) si lo ocultás en submenús
  if (menuHeader) {
    menuHeader.style.display = 'flex';
    menuHeader.style.opacity = '1';
    menuHeader.style.visibility = 'visible';
  }

  document.body.classList.remove('no-scroll');
  document.documentElement.classList.remove('no-scroll');
}
window.cerrarMenuYOverlay = cerrarMenuYOverlay;




// Guarda esta variable en el scope donde están tus handlers del menú:
let ultimoIconoFlechaAbierto = null;

window.filtrarCategoria = function(categoria, botonClickeado=null){
  // --- mapa de subcategorías (dejá el tuyo como está) ---
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

  const submenu = $('submenu-categorias'); // ya existe en tu HTML/CSS
  const tieneSub = !!map[categoria]?.length;

  // --- TOGGLE: si clickeás la misma categoría abierta, cerrar ---
  const mismaCategoria = (window.categoriaActiva === categoria) && submenu?.classList.contains('show');
  if (mismaCategoria){
    // cerrar visualmente
    submenu.classList.remove('show','animar');
    submenu.innerHTML = '';
    window.categoriaActiva = null;

    // resetear flecha del botón anterior
    if (ultimoIconoFlechaAbierto){
      ultimoIconoFlechaAbierto.classList.remove('fa-chevron-down');
      ultimoIconoFlechaAbierto.classList.add('fa-arrow-right');
      ultimoIconoFlechaAbierto = null;
    }
    return; // <-- importante
  }

  // Si NO hay subcategorías definidas, filtrar directo como antes
  if (!tieneSub){
    filtrarProductosPorCategoria(categoria);
    cerrarMenuYOverlay();
      resetearBusquedaYCategoria(); // ya existe en tu código
    return;
  }

  // --- Abrir y renderizar submenú como ya hacías ---
  submenu.innerHTML = '';
  submenu.classList.add('show','animar');

  // Botón "Ver todos"
  const btnTodos = document.createElement('button');
  btnTodos.textContent = 'Ver todos';
  btnTodos.onclick = () => { filtrarProductosPorCategoria(categoria); cerrarMenuYOverlay(); };
  submenu.appendChild(btnTodos);

  // Botones de subcategorías
  map[categoria].forEach(sub => {
    const b = document.createElement('button');
    b.textContent = sub;
    b.onclick = () => { filtrarProductosPorCategoria(sub); cerrarMenuYOverlay(); };
    submenu.appendChild(b);
  });

  // Insertar el bloque debajo del <li> de la categoría clickeada (si lo pasaste como "this")
  if (botonClickeado){
    const li = botonClickeado.closest('li');
    if (li) li.insertAdjacentElement('afterend', submenu);

    // --- Manejo de flecha: cambiar → por ↓ en el item abierto ---
    // 1) resetear cualquier flecha↓ previa
    document.querySelectorAll('.flecha-icono.fa-chevron-down')
      .forEach(i => { i.classList.remove('fa-chevron-down'); i.classList.add('fa-arrow-right'); });

    // 2) conseguir/crear la flecha del botón actual
    let icon = botonClickeado.querySelector('.flecha-icono');
    if (!icon){
      icon = document.createElement('i');
      icon.className = 'fa-solid fa-arrow-right flecha-icono';
      botonClickeado.appendChild(icon);
    }
    // 3) ponerla como “abierto” (flecha hacia abajo)
    icon.classList.remove('fa-arrow-right');
    icon.classList.add('fa-chevron-down');
    ultimoIconoFlechaAbierto = icon;
  }

  window.categoriaActiva = categoria; // marcar activa
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
    
    cerrarMenuYOverlay();

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
    div.innerHTML=`<img src="${item.imagen}" alt="${item.nombre}">
      <span>${item.nombre} x${item.cantidad} - $${(item.precio*item.cantidad).toFixed(2)}</span>
      <button class="eliminar-unidad" data-nombre="${item.nombre}">❌</button>`;
    carritoItems.appendChild(div);
    total += item.precio * item.cantidad;
  });
  totalCarrito.textContent = `Total: $${total.toFixed(2)}`;
  contadorCarrito.textContent = carrito.reduce((acc,it)=>acc+it.cantidad,0);
  carritoItems.querySelectorAll('.eliminar-unidad')
    .forEach(btn=> btn.addEventListener('click', ()=> eliminarUnidad(btn.dataset.nombre)) );

  // ✅ Persistir estado
  try { localStorage.setItem('carrito', JSON.stringify(carrito)); } catch {}
}

// Cargar carrito desde localStorage (con validación y sin romper el script)
(function cargarCarritoDeLocalStorageSegura(){
  try {
    const raw = localStorage.getItem('carrito');
    if (!raw) return;                           // nada guardado
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return;           // formato inesperado

    // Sanitizar: solo objetos válidos
    const limpio = data
      .filter(it => it && typeof it.nombre==='string'
                        && typeof it.precio==='number'
                        && typeof it.cantidad==='number'
                        && it.cantidad > 0)
      .map(it => ({
        nombre: it.nombre,
        precio: it.precio,
        imagen: it.imagen || '',
        cantidad: it.cantidad
      }));

    if (limpio.length) {
      carrito = limpio;
      actualizarCarrito();                      // pinta UI con refs ya definidas
    }
  } catch (e) {
    console.warn('Carrito corrupto en localStorage; se limpia.', e);
    localStorage.removeItem('carrito');
  }
})();

  
  
  function eliminarUnidad(nombre){ const i=carrito.findIndex(it=>it.nombre===nombre); if(i!==-1){ carrito[i].cantidad>1?carrito[i].cantidad--:carrito.splice(i,1); actualizarCarrito(); } }
  function agregarAlCarrito(nombre, precio, imagen, boton){ const ex=carrito.find(it=>it.nombre===nombre); ex?ex.cantidad++:carrito.push({nombre,precio,imagen,cantidad:1}); actualizarCarrito(); animarAgregar(boton); }
  function vaciarCarrito(){
  carrito = [];
  try { localStorage.removeItem('carrito'); } catch {}
  actualizarCarrito();
}

const btnVaciar = document.getElementById('vaciar-carrito');

if (btnVaciar) {
  btnVaciar.addEventListener('click', () => {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `
      <div class="confirm-box">
        <p>¿Vaciar el carrito?</p>
        <button id="cancelar">Cancelar</button>
        <button id="aceptar">Vaciar</button>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#cancelar').onclick = () => overlay.remove();
    overlay.querySelector('#aceptar').onclick = () => {
      vaciarCarrito();   // 👈 aquí se llama a la función original
      overlay.remove();
    };
  });
}




  function animarAgregar(boton){ const floating=document.createElement('div'); floating.className='floating-plus'; floating.textContent='+1'; document.body.appendChild(floating); const from=boton.getBoundingClientRect(); floating.style.left=`${from.left + from.width/2}px`; floating.style.top=`${from.top}px`; const cRect=$('abrir-carrito').getBoundingClientRect(); const dx=cRect.left - from.left; const dy=cRect.top - from.top; setTimeout(()=>{ floating.style.transform=`translate(${dx}px, ${dy}px) scale(0.5)`; floating.style.opacity=0; setTimeout(()=>floating.remove(),1000); },50); }

  window.agregarAlCarritoDesdeElemento = function(boton){ const prod=boton.closest('.producto'); const nombre=prod.querySelector('.nombre')?.textContent||''; const precioTexto=prod.querySelector('.precio')?.textContent||'0'; const imagen=prod.querySelector('img')?.src||''; const precio=parseFloat(precioTexto.replace(/[^0-9.]/g,''))||0; agregarAlCarrito(nombre, precio, imagen, boton); };
  
  window.pagarCarrito = function(){ 
    if (carrito.length===0) return alert('El carrito está vacío.'); 
    let msj='*¡Hola! Quiero hacer este pedido:*\n\n'; carrito.forEach(it=> msj+=`• ${it.nombre} x${it.cantidad} - $${it.precio.toFixed(2)}\n` + "c/u"); 
    const total=carrito.reduce((a,it)=>a+it.precio*it.cantidad,0); 
    msj+=`\n*Total: $${total.toFixed(2)}*\n\nMi dirección es: ...`;
     window.open(`https://wa.me/+542221440844?text=${encodeURIComponent(msj)}`,'_blank'); };

 /* ---------------- Confirmación y registro de pedidos ---------------- */
 // === CONFIRMAR O ELIMINAR PEDIDOS ===
document.addEventListener("click", (e) => {
  const btnConfirmar = e.target.closest(".btn-confirmar");
  const btnCancelar = e.target.closest(".btn-cancelar");
  const modal = document.getElementById("modal-accion");
  const modalMensaje = document.getElementById("modal-mensaje");
  const modalSi = document.getElementById("modal-si");
  const modalNo = document.getElementById("modal-no");

  if (!btnConfirmar && !btnCancelar) return;

  const pedidoItem = e.target.closest(".pedido-item");
  const pedidoId = btnConfirmar?.dataset.id || btnCancelar?.dataset.id;
  const esConfirmar = !!btnConfirmar;

  if (!pedidoId || !pedidoItem) return;

  // Mostrar modal
  modal.classList.remove("oculto");
  modalMensaje.textContent = esConfirmar
    ? "¿Confirmar este pedido?"
    : "¿Eliminar este pedido?";

  // Eliminar listeners anteriores
  modalSi.replaceWith(modalSi.cloneNode(true));
  modalNo.replaceWith(modalNo.cloneNode(true));

  const newModalSi = document.getElementById("modal-si");
  const newModalNo = document.getElementById("modal-no");

  // Acciones de botones
  newModalNo.addEventListener("click", () => {
    modal.classList.add("oculto");
  });

  newModalSi.addEventListener("click", async () => {
    modal.classList.add("oculto");

    if (esConfirmar) {
      // --- Confirmar pedido ---
      try {
        const pedidoRef = firebase.database().ref(`pedidos/${pedidoId}`);
        await pedidoRef.update({ estado: "APROBADO" });

// --- Visualmente marcar como aprobado ---
pedidoItem.classList.add("pedido-aprobado");
const texto = pedidoItem.querySelector(".pedido-texto");
if (texto && !texto.textContent.includes("(APROBADO)")) {
  texto.textContent += " (APROBADO)";
}


        // Obtener UID del pedido para asignar puntos
        const snap = await pedidoRef.once("value");
        const pedido = snap.val();
        if (pedido?.uid) {
          const totalPedido = pedido.total || 0;
          const puntosGanados = Math.floor(totalPedido / 50);

          const puntosRef = firebase.database().ref(`puntos/${pedido.uid}/puntos`);
          await puntosRef.transaction((actual) => (actual || 0) + puntosGanados);

          console.log(`🎁 ${puntosGanados} puntos acreditados al usuario ${pedido.usuario}`);

          // Aviso visual
          const aviso = document.createElement("div");
          aviso.classList.add("aviso-puntos");
          aviso.textContent = `✅ Pedido confirmado. ${puntosGanados} puntos acreditados.`;
          document.body.appendChild(aviso);
          setTimeout(() => aviso.remove(), 4000);
        }
      } catch (err) {
        console.error("❌ Error al confirmar pedido:", err);
      }
    } else {
      // --- Eliminar pedido ---
      try {
        await firebase.database().ref(`pedidos/${pedidoId}`).remove();
        pedidoItem.remove();

        const aviso = document.createElement("div");
        aviso.classList.add("aviso-puntos");
        aviso.textContent = "❌ Pedido eliminado correctamente.";
        document.body.appendChild(aviso);
        setTimeout(() => aviso.remove(), 3000);
      } catch (err) {
        console.error("❌ Error al eliminar pedido:", err);
      }
    }
  });
});

const modal = document.getElementById("modal-confirmacion");
const confirmarPedidoBtn = document.getElementById("confirmar-pedido");
const cancelarPedidoBtn = document.getElementById("cancelar-pedido");
const listaPedidos = document.getElementById("lista-pedidos");
let contadorPedidos = 1;

// Abrir modal al hacer click en pagar
if (pagarBtn) {
  pagarBtn.addEventListener("click", () => {
    if (carrito.length === 0) return alert("El carrito está vacío.");
    modal.classList.remove("oculto");
  });
}

// Cerrar modal sin confirmar
cancelarPedidoBtn?.addEventListener("click", () => {
  modal.classList.add("oculto");
});

// Confirmar pedido
confirmarPedidoBtn?.addEventListener("click", () => {
  modal.classList.add("oculto");

  // Generar texto del pedido
  let textoPedido = "";
  carrito.forEach((it) => {
    textoPedido += `${it.cantidad} x ${it.nombre} ($${it.precio.toFixed(2)}) | `;
  });
  if (!textoPedido) textoPedido = "Pedido vacío";

  const pedidoBase = {
    fecha: new Date().toLocaleString(),
    texto: textoPedido,
    estado: "pendiente",
  };

    // Calcular total numérico del pedido
  const totalPedido = carrito.reduce((acc, it) => acc + it.precio * it.cantidad, 0);
  pedidoBase.total = totalPedido;


  // === Guardar pedido con número correlativo y usuario ===
  (async () => {
    const user = firebase.auth().currentUser;
    let nombreUsuario = "Invitado";

    if (user) {
      try {
        const snap = await firebase.database().ref(`/usuarios/${user.uid}/nombreUsuario`).once("value");
        nombreUsuario = snap.val() || user.email || "Desconocido";
      } catch (e) {
        console.error("Error al obtener nombreUsuario:", e);
      }
    }

    pedidoBase.usuario = nombreUsuario;
    pedidoBase.uid = user ? user.uid : null;

    // === Obtener y actualizar contador global de pedidos ===
    const contadorRef = firebase.database().ref("contadorPedidos");
    let numeroPedido = 1;

    try {
      const snapshot = await contadorRef.once("value");
      numeroPedido = (snapshot.val() || 0) + 1;
      await contadorRef.set(numeroPedido);
    } catch (err) {
      console.error("Error al actualizar contador de pedidos:", err);
    }

    pedidoBase.numeroPedido = numeroPedido;

  // === Guardar pedido en Firebase ===
const nuevoPedidoRef = firebase.database().ref("pedidos").push();
await nuevoPedidoRef.set(pedidoBase);

console.log("✅ Pedido guardado:", pedidoBase);

// === SISTEMA DE PUNTOS ===
if (user && Array.isArray(carrito) && carrito.length > 0) {
  try {
    // Calcular total del pedido
    const totalPedido = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

    // Calcular puntos ganados (1 punto por cada $50)
    const puntosGanados = Math.floor(totalPedido / 50);

    if (puntosGanados > 0) {
      const puntosRef = firebase.database().ref(`puntos/${user.uid}/puntos`);
      await puntosRef.transaction(actual => (actual || 0) + puntosGanados);

      console.log(`🎁 ${puntosGanados} puntos sumados al usuario ${pedidoBase.usuario}`);

      // Mostrar mensaje en pantalla
      const aviso = document.createElement("div");
      aviso.classList.add("aviso-puntos");
      aviso.textContent = `🎉 Ganaste ${puntosGanados} puntos con tu compra`;
      document.body.appendChild(aviso);
      setTimeout(() => aviso.remove(), 4000);
    }
  } catch (error) {
    console.error("❌ Error al asignar puntos:", error);
  }
}

// === Mostrar visualmente ===
const nuevoPedido = document.createElement("div");
nuevoPedido.classList.add("pedido-item");
nuevoPedido.innerHTML = `
  <span class="pedido-numero">#${String(numeroPedido).padStart(3, "0")}</span>
  <span class="pedido-fecha">${pedidoBase.fecha}</span>
  <span class="pedido-usuario">${pedidoBase.usuario}</span>
  <span class="pedido-texto">${pedidoBase.texto}</span>
  <div class="pedido-botones">
    <button class="btn-confirmar"><i class="fa-solid fa-check"></i></button>
    <button class="btn-cancelar"><i class="fa-solid fa-xmark"></i></button>
  </div>
`;
listaPedidos?.prepend(nuevoPedido);

// Vaciar carrito
carrito = [];
localStorage.removeItem("carrito");
actualizarCarrito();
})();








  // Enviar pedido por WhatsApp (mismo formato original)
  let msj = "*¡Hola! Quiero hacer este pedido:*\n\n";
  carrito.forEach(
    (it) => (msj += `• ${it.nombre} x${it.cantidad} - $${it.precio.toFixed(2)}\n`)
  );
  const total = carrito.reduce((a, it) => a + it.precio * it.cantidad, 0);
  msj += `\n*Total: $${total.toFixed(2)}*\n\nMi dirección es: ...`;
  window.open(
    `https://wa.me/+542221440844?text=${encodeURIComponent(msj)}`,
    "_blank"
  );

  // Vaciar carrito luego de confirmar
  carrito = [];
  localStorage.removeItem("carrito");
  actualizarCarrito();
});


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
  link.addEventListener('click', (e)=>{
    e.preventDefault();
    e.stopPropagation(); // evita burbujeo raro

    const id = link.dataset.submenu;
    const sub = document.getElementById(id);
    if (!sub) return;

    const isOpen = sub.classList.contains('show-mobile');
    closeAllSubmenus();

    if (isOpen) {
      sub.classList.remove('show-mobile');
      if (menuHeader) menuHeader.style.display = '';
    } else {
      sub.classList.add('show-mobile');

      const volverBtn = sub.querySelector('.volver-btn');
      if (volverBtn) {
        volverBtn.style.display = 'block';
        volverBtn.onclick = (ev) => {
          ev?.stopPropagation?.();
          sub.classList.remove('show-mobile');
          if (menuHeader) menuHeader.style.display = '';
        };
      }
      if (menuHeader) menuHeader.style.display = 'none';

      // Activo overlay + menú con un micro-delay para no comer el mismo click
      overlayJustOpened = true;
      setTimeout(()=> { overlayJustOpened = false; }, 180);
      setTimeout(()=> {
        overlay.classList.add('active');
        menu.classList.add('abierto');
      }, 0);
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

/* ---------------- Submenús móviles (toggle consistente) ---------------- */
(function initMobileMenus(){
  const menu = document.getElementById('menu');
  const overlay = document.getElementById('overlay');
  const menuHeader = document.getElementById('menuHeader');

  if (!menu || !overlay) return;

  function closeAllSubmenus(){
    document.querySelectorAll('.sub-menu-fixed').forEach(m => m.classList.remove('show-mobile'));
    if (menuHeader) menuHeader.style.display = '';
    menu.classList.remove('submenu-open');            // 👈 NUEVO: salgo del estado de submenú
  }

  document.querySelectorAll('.abrir-submenu').forEach(link => {
    link.addEventListener('click', (e)=>{
      e.preventDefault();
      const id = link.dataset.submenu;
      const sub = document.getElementById(id);
      if (!sub) return;

      const isOpen = sub.classList.contains('show-mobile');
      closeAllSubmenus();

      if (isOpen) {
        sub.classList.remove('show-mobile');

      } else {
        sub.classList.add('show-mobile');
        menu.classList.add('submenu-open');           // 👈 NUEVO: oculto/inhabilito la lista principal (CSS abajo)
        const volverBtn = sub.querySelector('.volver-btn');
        if (volverBtn) {
          volverBtn.style.display = 'block';
          volverBtn.onclick = () => {
            sub.classList.remove('show-mobile');

            menu.classList.remove('submenu-open');    // 👈 NUEVO: vuelvo a mostrar/rehabilitar la lista principal
          };
        }

        overlay.classList.add('active');
        menu.classList.add('abierto');
      }
    });
  });

  // Cierre por overlay
  overlay.addEventListener('click', closeAllSubmenus);

  // Fallback delegado por si alguna flecha "Volver" no registró el onclick
  document.addEventListener('click', (e)=>{
    const volver = e.target.closest?.('.volver-btn');
    if (!volver) return;
    const sub = volver.closest('.sub-menu-fixed');
    if (sub) sub.classList.remove('show-mobile');

    menu.classList.remove('submenu-open');
  });
})();






// === Helpers consistentes para cerrar todo ===
function closeMenuAndOverlay() {
  const menu = document.getElementById('menu');
  const overlay = document.getElementById('overlay');
  const menuHeader = document.getElementById('menuHeader');

  // cerrar overlay + menú + submenús
  overlay?.classList.remove('active');
  menu?.classList.remove('abierto', 'submenu-open');
  document.body.classList.remove('no-scroll');

  document.querySelectorAll('.sub-menu-fixed.show-mobile, .sub-menu-fixed.mostrar')
    .forEach(s => s.classList.remove('show-mobile', 'mostrar'));

  // asegurá el header del menú visible (logo + "Categorías")
  if (menuHeader) {
    menuHeader.style.display = 'flex';
    menuHeader.style.opacity = '1';
    menuHeader.style.visibility = 'visible';
  }
}
// 🔹 Resetear barra de búsqueda y vista al cambiar de categoría
function resetearBusquedaYCategoria() {
  const inputBusqueda = document.getElementById('busqueda-productos');
  const mensajeNoResultados = document.getElementById('mensaje-no-resultados');

  // Limpiar barra de búsqueda
  if (inputBusqueda) {
    inputBusqueda.value = '';
    inputBusqueda.dispatchEvent(new Event('input')); // fuerza refresco visual
  }

  // Asegurar que los carteles de categoría vuelvan a mostrarse
  document.querySelectorAll('.barra-categoria, .titulo-categoria').forEach(el => {
    el.style.display = '';
  });

  // Ocultar mensaje "No se encontraron productos" si existe
  if (mensajeNoResultados) mensajeNoResultados.style.display = 'none';
}
// === FILTRO PERSONALIZADO DE PEDIDOS POR RANGO DE FECHAS ===
document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("toggle-filtro");
  const filtroCont = document.getElementById("filtro-pedidos-container");
  const btnFiltrar = document.getElementById("btn-filtrar");
  const inputInicio = document.getElementById("fecha-inicio");
  const inputFin = document.getElementById("fecha-fin");
  const res = document.getElementById("resultado-filtro");

  if (!window.firebase) return;
  const pedidosRef = firebase.database().ref("pedidos");

  // Mostrar / ocultar panel
  toggleBtn?.addEventListener("click", () => {
    filtroCont.classList.toggle("oculto");
    toggleBtn.textContent = filtroCont.classList.contains("oculto")
      ? "📅 Ver pedidos por rango de fechas"
      : "❌ Ocultar filtro";
  });

  // Función principal
  async function filtrarPedidosPorRango() {
    const fechaInicio = inputInicio.value;
    const fechaFin = inputFin.value;

    if (!fechaInicio || !fechaFin) {
      alert("Por favor, seleccioná ambas fechas.");
      return;
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    fin.setHours(23, 59, 59, 999);

    const snap = await pedidosRef.once("value");
    const data = snap.val();
    if (!data) {
      res.innerHTML = "<p>No hay pedidos registrados.</p>";
      return;
    }

    const pedidosFiltrados = Object.values(data).filter((pedido) => {
      const fechaPedido = new Date(pedido.fecha);
      return fechaPedido >= inicio && fechaPedido <= fin;
    });

    mostrarPedidosFiltrados(pedidosFiltrados, fechaInicio, fechaFin);
  }

  // Mostrar resultados
  function mostrarPedidosFiltrados(pedidos, desde, hasta) {
    if (pedidos.length === 0) {
      res.innerHTML = `<p>No hay pedidos entre ${desde} y ${hasta}.</p>`;
      return;
    }

    const total = pedidos.length;
    const totalPesos = pedidos.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
    const totalPuntos = Math.floor(totalPesos / 50);

    res.innerHTML = `
      <h4>📦 Total de pedidos: ${total}</h4>
      <p>🗓️ Desde <strong>${desde}</strong> hasta <strong>${hasta}</strong></p>
      <p>💰 Monto total: <strong>$${totalPesos.toLocaleString("es-AR")}</strong></p>
      <p>💎 Puntos generados: <strong>${totalPuntos}</strong></p>

      <div class="lista-filtrada">
        ${pedidos
          .map(
            (p) => `
          <div class="pedido-filtrado">
            <span>#${p.numeroPedido || "?"}</span>
            <span>${p.fecha}</span>
            <span>${p.usuario}</span>
            <span>${p.texto}</span>
            <span>💰 $${Number(p.total || 0).toLocaleString("es-AR")}</span>
          </div>`
          )
          .join("")}
      </div>
    `;
  }

  // Evento de click
  btnFiltrar?.addEventListener("click", filtrarPedidosPorRango);
});

// === Cargar pedidos desde Firebase en tiempo real ===
document.addEventListener("DOMContentLoaded", () => {
  const listaPedidos = document.getElementById("lista-pedidos");
  const spanPendientes = document.getElementById("cant-pendientes");
  const spanAprobados = document.getElementById("cant-aprobados");

  if (!listaPedidos || !window.firebase) return;

  const pedidosRef = firebase.database().ref("pedidos");

  pedidosRef.on("value", (snapshot) => {
    const data = snapshot.val();
    listaPedidos.innerHTML = ""; // limpia lista actual

    let pendientes = 0;
    let aprobados = 0;

    if (!data) {
      listaPedidos.innerHTML = "<p>No hay pedidos registrados.</p>";
      if (spanPendientes) spanPendientes.textContent = "0";
      if (spanAprobados) spanAprobados.textContent = "0";
      return;
    }

    Object.entries(data).forEach(([id, pedido]) => {
      const item = document.createElement("div");
      item.classList.add("pedido-item");

      const esAprobado = pedido.estado === "APROBADO";
      if (esAprobado) aprobados++;
      else pendientes++;

      const total = Number(pedido.total) || 0;
      const puntos = Math.floor(total / 50); // 1 punto cada $50 (ajustable)

      const textoPedido = pedido.texto || "";

      item.innerHTML = `
        <span class="pedido-numero">#${String(pedido.numeroPedido || 0).padStart(3, "0")}</span>
        <span class="pedido-fecha">${pedido.fecha || "-"}</span>
        <span class="pedido-usuario">${pedido.usuario || "Usuario desconocido"}</span>
        <span class="pedido-texto">${textoPedido}</span>
        <span class="pedido-total">💰 $${total.toLocaleString("es-AR")}</span>
        <span class="pedido-puntos">💎 ${puntos}</span>
        <div class="pedido-botones">
          ${
            esAprobado
              ? `<span class="pedido-estado">✅ APROBADO</span>`
              : `
                <button class="btn-confirmar" data-id="${id}">
                  <i class="fa-solid fa-check"></i>
                </button>
                <button class="btn-cancelar" data-id="${id}">
                  <i class="fa-solid fa-xmark"></i>
                </button>
              `
          }
        </div>
      `;

      listaPedidos.prepend(item);
    });

    // Actualiza contadores en la barra superior
    if (spanPendientes) spanPendientes.textContent = pendientes;
    if (spanAprobados) spanAprobados.textContent = aprobados;
  });
});



/*--------------FINAL DEL DOM CONT LOADED----------*/

// === PANTALLA COMPLETA DE PEDIDOS ===
window.addEventListener("load", () => {
  const pedidosBtn = document.getElementById("pedidos-btn");
  const inicioBtn = document.querySelector(".inicio-header");
  const menu = document.getElementById("menu");
  const overlay = document.getElementById("overlay");
  const header = document.querySelector(".header");
  const pantallaInicio = document.getElementById("pantalla-inicio");
  const pantallaProductos = document.getElementById("pantalla-productos");
  const productosContainer = document.getElementById("productos-container");
  const contenedorPedidos = document.getElementById("contenedor-pedidos");

  if (!pedidosBtn || !contenedorPedidos) return;

  // === Función para cerrar menú ===
  function cerrarMenu() {
    menu?.classList.remove("abierto");
    overlay?.classList.remove("active");
    header?.classList.remove("menu-open", "opaco");
  }

  // === Función para resetear toda la página (igual que INICIO) ===
  function resetearTodo() {
    // Cierra el menú
    cerrarMenu();

    // Limpia productos y categorías
    document.querySelector(".categoria-activa")?.classList.remove("categoria-activa");
    const cartelCategoria = document.querySelector(".cartel-categoria");
    if (cartelCategoria) cartelCategoria.textContent = "";

    // Vacía el contenedor de productos
    if (productosContainer) {
      productosContainer.innerHTML = "";
      productosContainer.classList.remove("oculto");
      productosContainer.style.display = "block";
    }

    // Oculta pedidos
    contenedorPedidos?.classList.add("oculto");
    contenedorPedidos.style.display = "none";

    // Muestra el inicio
    pantallaInicio?.classList.remove("oculto");
    pantallaProductos?.classList.add("oculto");
  }

  // === BOTÓN "INICIO" ===
  if (inicioBtn) {
    inicioBtn.addEventListener("click", () => {
      resetearTodo();
    });
  }

  // === BOTÓN "PEDIDOS" ===
  pedidosBtn.addEventListener("click", () => {
    // Primero resetea todo igual que inicio
    resetearTodo();

    // Luego de un pequeño delay (para que el DOM se actualice), muestra pedidos
    setTimeout(() => {
      pantallaInicio?.classList.add("oculto");
      pantallaProductos?.classList.remove("oculto");
      productosContainer?.classList.add("oculto");

      contenedorPedidos?.classList.remove("oculto");
      contenedorPedidos.style.display = "block";
    }, 150);
  });
});
