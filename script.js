document.getElementById("cerrarMenu")?.addEventListener("click", () => {
  document.getElementById("menu").classList.remove("abierto");
  document.getElementById("overlay")?.classList.remove("active");
  document.querySelector(".header")?.classList.remove("opaco");
  document.getElementById("menuToggle")?.classList.remove("activo");
  cerrarTodosLosSubmenus();
});



function cerrarTodosLosSubmenus() {
  document.querySelectorAll('.sub-menu-fixed').forEach(submenu => {

    submenu.classList.remove('show', 'show-mobile', 'mostrar');
  });
}
function cargarProductosDesdeFirebase(callback) {
  const contenedor = document.getElementById("productos-container");
  const loader = document.getElementById("loader2");
  const pantallaInicio = document.getElementById("pantalla-inicio");

  contenedor.innerHTML = "";
  loader?.classList.remove("loaderoculto");
  pantallaInicio?.classList.add("oculto");

  const catalogoRef = firebase.database().ref("/catalogo");
  const preciosRef = firebase.database().ref("/productos");
  const stockRef = firebase.database().ref("/stock");

  const modoAdmin = localStorage.getItem("modoAdmin") === "true";

  Promise.all([
    catalogoRef.once("value"),
    preciosRef.once("value"),
    stockRef.once("value")
  ])
    .then(([catalogoSnap, preciosSnap, stockSnap]) => {
      const catalogo = catalogoSnap.val();
      const precios = preciosSnap.val();
      const stockData = stockSnap.val() || {};

      if (!Array.isArray(catalogo)) {
        console.error("❌ /catalogo no contiene un array.");
        loader?.classList.add("loaderoculto");
        return;
      }

      const obtenerPrecio = (dataNombre) => {
        if (!Array.isArray(precios)) return undefined;
        const clave = (dataNombre || "").trim().toUpperCase();
        const encontrado = precios.find(p => (p["data-nombre"] || "").trim().toUpperCase() === clave);
        return encontrado?.precio;
      };

      const productosPreparados = [];

      catalogo.forEach(producto => {
        const {
          nombre,
          ["data-nombre"]: dataNombre,
          imagen,
          categoria = "",
          subcategoria = "",
          tercer_categoria = ""
        } = producto;

        const precio = obtenerPrecio(dataNombre);
        const estaEnStock = stockData[dataNombre] !== false;

        const ul = document.createElement("ul");
        ul.className = "producto visible";
        ul.setAttribute("data-nombre", dataNombre);
        ul.setAttribute("data-categoria", categoria);
        ul.setAttribute("data-subcategoria", subcategoria);
        ul.setAttribute("data-tercer_categoria", tercer_categoria);
        ul.setAttribute("data-aos", "fade-up");

        if (!estaEnStock) ul.classList.add("sin-stock");

ul.innerHTML = `
  <li style="position: relative;">
    <img src="${imagen}" loading="lazy" alt="${nombre}">
    ${!estaEnStock ? `<div class="sin-stock-label">SIN STOCK</div>` : ""}
  </li>
  <li><p class="nombre" style="text-align: left;">${nombre}</p></li>
  <li><p class="precio" style="text-align: left;">${precio !== undefined ? `$${parseFloat(precio).toFixed(2)}` : "Sin precio"}</p></li>
  <li>
    <button class="agregar" onclick="agregarAlCarritoDesdeElemento(this)" ${!estaEnStock ? "disabled" : ""} style="width: 100%; display: flex; justify-content: center; align-items: center; gap: 10px;">
      🛒 <span>${!estaEnStock ? "Sin stock" : "Agregar"}</span>
    </button>
  </li>
  ${modoAdmin ? `<li><button onclick="toggleStock(this)">Toggle Stock</button></li>` : ""}
`;


        contenedor.appendChild(ul);

        // Guardamos para uso en inicio
        productosPreparados.push({
          nombre,
          imagen,
          precio: precio || 0
        });
      });

      loader?.classList.add("loaderoculto");

      if (typeof callback === "function") callback();

window.todosLosProductosParaInicio = Array.from(document.querySelectorAll("#productos-container .producto"));
mostrarProductosAleatoriosEnInicio(window.todosLosProductosParaInicio);

    })

    .catch(error => {
      console.error("❌ Error al cargar productos desde Firebase:", error);
      loader?.classList.add("loaderoculto");

       // Guardar todos los productos en una variable global para usarlos en inicio
    window.todosLosProductosParaInicio = productos;

    // Mostrar en pantalla de inicio (por primera vez)
    mostrarProductosAleatoriosEnInicio(window.todosLosProductosParaInicio);

    if (callback) callback();
    });



}





/**---SLIDER--- */
let currentIndex = 0;

function goToSlide(index) {
  const slides = document.getElementById("slides");
  const sliderContainer = document.querySelector(".slider-container");

  // Desplazamiento correcto hacia la IZQUIERDA
  slides.style.transform = `translateX(-${index * sliderContainer.clientWidth}px)`;

  // Actualizar dots
  document.querySelectorAll(".dot").forEach((dot, i) => {
    dot.classList.toggle("active", i === index);
  });

  currentIndex = index;
}

// Opcional: deslizar automáticamente cada 5 segundos
setInterval(() => {
  let next = (currentIndex + 1) % 3;
  goToSlide(next);
}, 5000);


/*---ADMIN LOGIN---*/
function activarModoAdmin() {
    localStorage.setItem('modoAdmin', 'true');

    // Mostrar mensaje de bienvenida
    const mensaje = document.getElementById('mensaje');
    mensaje.style.color = 'green';
    mensaje.textContent = '¡Modo Admin activado! Bienvenido.';

    // Ocultar el formulario de login
    document.getElementById('login').style.display = 'none';

    // Mostrar el botón de logout
    document.getElementById('logout').style.display = 'block';
        cargarProductosDesdeFirebase();
  }

  function verificarAdmin() {
    const usuario = document.getElementById('usuario').value;
    const contrasena = document.getElementById('contrasena').value;

    if (usuario === 'admin' && contrasena === '3612') {
      activarModoAdmin();
    } else {
      const mensaje = document.getElementById('mensaje');
      mensaje.style.color = 'red';
      mensaje.textContent = 'Usuario o contraseña incorrectos.';
    }

  }

function cerrarSesion() {
  // Eliminar el estado de admin
  localStorage.removeItem('modoAdmin');

  // Limpiar campos de login
  document.getElementById("usuario").value = "";
  document.getElementById("contrasena").value = "";
  document.getElementById("mensaje").textContent = "";

  // Mostrar login y ocultar logout
  document.getElementById("login").style.display = "block";
  document.getElementById("login-container").style.display = "block";
  document.getElementById("logout").style.display = "none";
}


  // Al cargar la página, verificar si ya está activado el modo admin
window.onload = function () {
  // Limpiar última categoría después de X horas (por ejemplo, 1 hora = 3600000 ms)
const LIMITE_TIEMPO_MS = 60 * 60 * 1000; // 1 hora
const ultimaVisita = localStorage.getItem("ultimaVisita");

if (ultimaVisita) {
  const tiempoPasado = Date.now() - parseInt(ultimaVisita, 10);
  if (tiempoPasado > LIMITE_TIEMPO_MS) {
    localStorage.removeItem("ultimaCategoria");
  }
}

// Guardar la hora actual como última visita
localStorage.setItem("ultimaVisita", Date.now().toString());

  if (localStorage.getItem('modoAdmin') === 'true') {
    activarModoAdmin();
  } else {
    document.getElementById("login").style.display = "block";
    document.getElementById("logout").style.display = "none";
    document.getElementById("login-container").style.display = "none";
  }
};
/*------MOSTRAR LOGIN------*/
  function mostrarLogin() {
    const contenedor = document.getElementById("login-container");
    contenedor.style.display = contenedor.style.display === "none" ? "block" : "none";
  }




// script optimizado.js
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  const mainContent = document.getElementById('main-content');

  // Esperamos 300ms para una transición más natural (opcional)
  setTimeout(() => {
    loader.classList.add('fade-out');
    mainContent.classList.remove('hidden');
    document.body.classList.remove('no-scroll');

    // Eliminar completamente el loader del DOM después de la animación
    setTimeout(() => loader.remove(), 1000); // 1s = duración del fade
  }, 1000);
});

document.addEventListener("DOMContentLoaded", () => {
  const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "kiosco-web.firebaseapp.com",
    databaseURL: "https://kiosco-web-default-rtdb.firebaseio.com",
    projectId: "kiosco-web",
    storageBucket: "kiosco-web.appspot.com",
    messagingSenderId: "XXXXXXXXXXX",
    appId: "APP_ID"
  };

  firebase.initializeApp(firebaseConfig);
  const database = firebase.database();



  document.getElementById("productos-container").style.display = "none";



function normalizarTexto(texto) {
  return (texto || "").trim().toUpperCase();
}



// Muestra funciones de admin
function activarModoAdmin() {
  document.querySelectorAll(".admin-controles").forEach(el => {
    el.style.display = "block";
  });
}


// Define modoAdmin en tu código global o antes de llamar a la función
const modoAdmin = false; // Cambiar a false para modo usuario normal









window.toggleStock = function(boton) {
  const productoEl = boton.closest(".producto");
  const sinStock = productoEl.classList.toggle("sin-stock");

  // Buscar o crear la etiqueta SIN STOCK
  let etiqueta = productoEl.querySelector(".sin-stock-label");
  if (!etiqueta) {
    etiqueta = document.createElement("div");
    etiqueta.className = "sin-stock-label";
    etiqueta.textContent = "SIN STOCK";
    etiqueta.style = `
      position: absolute;
      top: 8px;
      left: 8px;
      background: rgba(255,0,0,0.8);
      color: white;
      padding: 3px 8px;
      font-weight: bold;
      font-size: 0.8rem;
      border-radius: 3px;
      pointer-events: none;
      z-index: 10;
    `;
    const liImg = productoEl.querySelector("li:first-child");
    liImg.style.position = "relative";
    liImg.appendChild(etiqueta);
  }

  etiqueta.style.display = sinStock ? "block" : "none";

  // ✅ Deshabilitar solo el botón "Agregar"
  const botonAgregar = productoEl.querySelector("button.agregar");
  if (botonAgregar) {
    botonAgregar.disabled = sinStock;
    const span = botonAgregar.querySelector("span");
    if (span) span.textContent = sinStock ? "Sin stock" : "Agregar";
  }
};




// 🟩 Hacer la función global para que funcione con el selector de orden
window.cargarProductosDesdeFirebase = cargarProductosDesdeFirebase;


document.addEventListener("DOMContentLoaded", () => {
  const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "kiosco-web.firebaseapp.com",
    databaseURL: "https://kiosco-web-default-rtdb.firebaseio.com",
    projectId: "kiosco-web",
    storageBucket: "kiosco-web.appspot.com",
    messagingSenderId: "XXXXXXXXXXX",
    appId: "APP_ID"
  };

  firebase.initializeApp(firebaseConfig);
  cargarProductosDesdeFirebase();

  // Botón lupa móvil muestra/oculta barra de búsqueda
const btnLupa = document.getElementById("boton-lupa");
const barraBusqueda = document.getElementById("barra-busqueda-movil");

if (btnLupa && barraBusqueda) {
  console.log("Botón lupa encontrado");

  btnLupa.addEventListener("click", () => {
    console.log("Lupa clickeada");
    barraBusqueda.classList.toggle("oculto-en-movil");
  });
} else {
  console.log("No se encontró el botón o la barra");
}

});


const ultimaCategoria = localStorage.getItem("ultimaCategoria");
if (ultimaCategoria) {
  // Espera a que los productos estén cargados antes de filtrar
  cargarProductosDesdeFirebase(() => {
    filtrarProductosPorCategoria(ultimaCategoria);
  });
}





  const menuToggle = document.getElementById('menuToggle');
  const menu = document.getElementById('menu');
  const overlay = document.getElementById('overlay');
  const header = document.querySelector('.header');
  const abrirCarrito = document.getElementById('abrir-carrito');
  const cerrarCarrito = document.getElementById('cerrar-carrito');
  const carritoSidebar = document.getElementById('carrito-sidebar');







  menuToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const abierto = menu.classList.toggle("abierto");
    overlay.classList.toggle("active", abierto);
    menuToggle.classList.toggle("activo", abierto);
    header.classList.toggle("opaco", abierto);
  });

  abrirCarrito.addEventListener("click", (e) => {
    e.stopPropagation();
    carritoSidebar.classList.add("active");
    overlay.classList.add("active");
    header.classList.add("opaco");
  });

  cerrarCarrito.addEventListener("click", () => {
    carritoSidebar.classList.remove("active");
    overlay.classList.remove("active");
    header.classList.remove("opaco");
  });

  overlay.addEventListener("click", () => {
    menu.classList.remove("abierto");
    carritoSidebar.classList.remove("active");
    overlay.classList.remove("active");
    header.classList.remove("opaco");
    menuToggle.classList.remove("activo");
    cerrarTodosLosSubmenus();
  });








  function eliminarUnidad(nombre) {
    const index = carrito.findIndex(item => item.nombre === nombre);
    if (index !== -1) {
      carrito[index].cantidad > 1 ? carrito[index].cantidad-- : carrito.splice(index, 1);
      actualizarCarrito();
    }
  }



  document.querySelectorAll(".producto button").forEach(button => {
    button.addEventListener("click", () => {
      const producto = button.closest(".producto");
      const nombre = producto.querySelector(".nombre").textContent;
      const precioTexto = producto.querySelector(".precio").textContent;
      const imagen = producto.querySelector("img").src;
      const precio = parseFloat(precioTexto.replace(/[^0-9.]/g, '')) || 0;
      agregarAlCarrito(nombre, precio, imagen, button);
    });
  });

  pagarBtn?.addEventListener("click", () => {
    if (carrito.length === 0) return alert("El carrito está vacío.");
    let mensaje = "*¡Hola! Quiero hacer este pedido:*\n\n";
    carrito.forEach(item => mensaje += `• ${item.nombre} x${item.cantidad} - $${item.precio.toFixed(2)}\n`);
    mensaje += `\n*Total: $${carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0).toFixed(2)}*`;
    mensaje += `\n\nMi dirección es: ...`;
    window.open(`https://wa.me/+542221440844?text=${encodeURIComponent(mensaje)}`, "_blank");
  });

  const inputBusqueda = document.getElementById("busqueda-productos");
  inputBusqueda?.addEventListener("input", () => {
    const valor = inputBusqueda.value.toLowerCase();
    document.querySelectorAll(".producto").forEach(producto => {
      const nombre = producto.querySelector(".nombre").textContent.toLowerCase();
      producto.style.display = nombre.includes(valor) ? "flex" : "none";
    });
  });
});


function mostrarInicio() {
  document.getElementById("pantalla-inicio").classList.remove("oculto");

  document.getElementById("productos-container").style.display = "none";
  document.getElementById("ordenador-productos").style.display = "none";

  document.querySelector('.container')?.classList.add("oculto"); // ✅ OCULTA EL CONTENEDOR COMPLETO
  document.querySelector('.menu')?.classList.remove("oculto");
  document.getElementById("overlay")?.classList.remove("active");

  

}


function filtrarCategoria(categoria, botonClickeado = null) {

  // Si la categoría clickeada ya está activa, cerramos el submenú y reseteamos estado
if (window.categoriaActiva === categoria) {
  const submenu = document.getElementById('submenu-categorias');
  submenu.classList.remove('show', 'animar');
  submenu.innerHTML = '';
  window.categoriaActiva = null;
  return;
}

  const submenu = document.getElementById('submenu-categorias');

  // Subcategorías posibles
  const subcategoriasPorCategoria = {
    bebidas: ['Cerveza', 'Gaseosas', 'Jugos', 'Vinos'],
    Cerveza: ['Packs', 'Latas', 'Latones', 'Botellas'],
    Gaseosas: ['Linea Coca', 'Linea Pepsi', 'Linea Manaos', 'Soda'],
    Vinos: ['Tinto', 'Blanco'],
    Jugos: ['En Sobre','Agua Saborizada', 'Baggio/Cepita/Ades'],
    Golosinas: ['Chocolates', 'Gomitas', 'Caramelos', 'Galletitas', 'Snacks'],
    Chocolates: ['Blancos', 'Negro', 'Cajas de Chocolates', 'Bocaditos'],
    Gomitas: ['Acidas/Picantes', 'Comunes'],
    Snacks: ['Papas', 'Palitos', 'Chizitos'],
    Galletitas: ['Bagley'],
    alimentos: ['Panadería', 'Fideos', 'Arroz', 'Salchichas', 'Hamburguesas', 'Pizzas'],
    Panadería: ['Pan Común', 'Pan de Hamburguesa', 'Pan de Panchos', 'Pan Lactal', 'Grisines/Galletas'],
    farmacia: ['Medicamentos', 'Higiene', 'Preservativos'],
    Higiene: ['Productos Femeninos', 'Desodoranetes', 'Máquinas de Afeitar', 'Jabones']
  };

  const subcategorias = subcategoriasPorCategoria[categoria];

  // Mostrar submenú si tiene subcategorías
  if (subcategorias && subcategorias.length > 0) {
    submenu.innerHTML = '';
    submenu.classList.add('show', 'animar');

    const btnTodos = document.createElement('button');
    btnTodos.textContent = 'Ver todos';
    btnTodos.onclick = () => {
      filtrarProductosPorCategoria(categoria);
      cerrarMenuYOverlay(); // ✅ cierra menú SOLO cuando se selecciona “ver todos”
    };
    submenu.appendChild(btnTodos);

    subcategorias.forEach(sub => {
      const btn = document.createElement('button');
      btn.textContent = sub;
      btn.onclick = () => {
        filtrarProductosPorCategoria(sub);
        cerrarMenuYOverlay(); // ✅ cierra menú al seleccionar una subcategoría
      };
      submenu.appendChild(btn);
    });

    // Insertar el submenú justo debajo del botón
    if (botonClickeado) {
      const li = botonClickeado.closest('li');
      if (li) li.insertAdjacentElement('afterend', submenu);
    }

    window.categoriaActiva = categoria;
    return; // ⛔ NO continuar, evitamos mostrar productos ni cerrar menú
  }

  // Si NO tiene subcategorías, mostrar productos directamente
  filtrarProductosPorCategoria(categoria);
  cerrarMenuYOverlay(); // ✅ solo se cierra menú si se muestran productos directamente
}



function filtrarProductosPorCategoria(categoriaSeleccionada) {
const barraCategoria = document.getElementById("barra-categoria");
const tituloCategoria = document.getElementById("titulo-categoria");
const botonesContainer = document.getElementById("subcategorias-relacionadas");

tituloCategoria.textContent = categoriaSeleccionada;
barraCategoria.style.display = "flex";

// 🔁 Mostramos botones de subcategorías relacionadas
botonesContainer.innerHTML = "";

// Relación de subcategorías
const subcategoriasPorCategoria = {
  Cerveza: ['Packs', 'Latas', 'Latones', 'Botellas'],
  Gaseosas: ['Linea Coca', 'Linea Pepsi', 'Linea Manaos', 'Soda'],
  Vinos: ['Tinto', 'Blanco'],
  Jugos: ['En Sobre', 'Agua Saborizada', 'Baggio/Cepita/Ades'],
  Chocolates: ['Blancos', 'Negro', 'Cajas de Chocolates', 'Bocaditos'],
  Gomitas: ['Acidas/Picantes', 'Comunes'],
  Snacks: ['Papas', 'Palitos', 'Chizitos'],
  Galletitas: ['Bagley'],
  Panadería: ['Pan Común', 'Pan de Hamburguesa', 'Pan de Panchos', 'Pan Lactal', 'Grisines/Galletas'],
  Higiene: ['Productos Femeninos', 'Desodoranetes', 'Máquinas de Afeitar', 'Jabones']
};

// Detectar si la categoría seleccionada es una subcategoría de alguna principal
for (const [categoriaPrincipal, subcategorias] of Object.entries(subcategoriasPorCategoria)) {
  // Caso 1: estás viendo una subcategoría (ej: "Latas")
  if (subcategorias.includes(categoriaSeleccionada)) {
    subcategorias
      .filter(sub => sub !== categoriaSeleccionada)
      .forEach(sub => {
        const btn = document.createElement("button");
        btn.textContent = sub;
        btn.onclick = () => filtrarProductosPorCategoria(sub);
        botonesContainer.appendChild(btn);
      });

    const verTodos = document.createElement("button");
    verTodos.textContent = "Ver todos";
    verTodos.onclick = () => filtrarProductosPorCategoria(categoriaPrincipal);
    botonesContainer.appendChild(verTodos);
    break;
  }

  // Caso 2: estás viendo la categoría principal (ej: "Cerveza")
  if (categoriaPrincipal === categoriaSeleccionada) {
    subcategorias.forEach(sub => {
      const btn = document.createElement("button");
      btn.textContent = sub;
      btn.onclick = () => filtrarProductosPorCategoria(sub);
      botonesContainer.appendChild(btn);
    });
    const verTodos = document.createElement("button");
verTodos.textContent = "Ver todos";
verTodos.onclick = () => filtrarProductosPorCategoria(categoriaSeleccionada);
botonesContainer.appendChild(verTodos);

    break;
  }
}



    localStorage.setItem("ultimaCategoria", categoriaSeleccionada); // ✅ Guarda la categoría
  document.querySelector('.container')?.classList.remove("oculto");

  if (!window.productosCargados) {
    if (window.productosCargando) return;

    window.productosCargando = true;
    cargarProductosDesdeFirebase(() => {
      window.productosCargados = true;
      window.productosCargando = false;
      filtrarProductosPorCategoria(categoriaSeleccionada); // Reintenta el filtro
    });
    return;
  }

  const productos = document.querySelectorAll('.producto');

  productos.forEach(prod => {
    const cat = prod.getAttribute('data-categoria');
    const subcat = prod.getAttribute('data-subcategoria');
    const tercercat = prod.getAttribute('data-tercer_categoria');

    if (
      cat === categoriaSeleccionada ||
      subcat === categoriaSeleccionada ||
      tercercat === categoriaSeleccionada
    ) {
      prod.style.display = 'flex';
    } else {
      prod.style.display = 'none';
    }
  });

  document.getElementById('pantalla-inicio')?.classList.add('oculto');
  document.getElementById('productos-container').style.display = 'grid';
  document.getElementById('ordenador-productos').style.display = 'flex';

  document.getElementById('overlay')?.classList.remove('active');

  document.getElementById("ordenar").value = ""; // Reinicia el selector
  
  

}





// Esta función se encarga de cerrar el menú, overlay y submenús
function cerrarMenuYOverlay() {
  const menu = document.getElementById('menu');
  const overlay = document.getElementById('overlay');
  const header = document.querySelector('.header');
  const menuToggle = document.getElementById('menuToggle');
  const submenuCategorias = document.getElementById('submenu-categorias');

  // Forzamos estado cerrado sin depender de clases "toggle"
  menu.classList.remove('abierto');
  overlay.classList.remove('active');
  header.classList.remove('opaco');

  // Este paso es CLAVE para restaurar el botón hamburguesa
  menuToggle.classList.remove('activo');

  cerrarTodosLosSubmenus();

  if (submenuCategorias) {
    submenuCategorias.classList.remove('show', 'animar');
    submenuCategorias.innerHTML = '';
  }
}





function filtrarPorTercerCategoria(categoria) {
  function filtrarPorTercerCategoria(categoria) {
  localStorage.setItem("ultimaCategoria", categoria); // ✅ Guarda la subcategoría

  // ...resto del código
}

  const categoriaBuscada = categoria.toLowerCase();

  if (!window.productosCargados) {
    if (window.productosCargando) return;

    window.productosCargando = true;

    cargarProductosDesdeFirebase(() => {
      window.productosCargados = true;
      window.productosCargando = false;
      filtrarPorTercerCategoria(categoria); // Reintenta después de cargar
    });

    return;
  }

  const productos = document.querySelectorAll('.producto');

  productos.forEach(producto => {
    const cat = producto.getAttribute('data-categoria')?.toLowerCase() || '';
    const subcat = producto.getAttribute('data-subcategoria')?.toLowerCase() || '';
    const tercerCat = producto.getAttribute('data-tercer_categoria')?.toLowerCase() || '';

    const pertenece = cat === categoriaBuscada || subcat === categoriaBuscada || tercerCat === categoriaBuscada;
    producto.style.display = pertenece ? 'flex' : 'none';
  });

  document.querySelector('.container')?.classList.remove("oculto");
  document.getElementById('pantalla-inicio')?.classList.add('oculto');
  document.getElementById('productos-container').style.display = 'grid';
  document.getElementById('ordenador-productos').style.display = 'flex';
  document.getElementById("ordenar").value = "";
  document.getElementById('overlay')?.classList.remove('active');

  cerrarMenuYOverlay();
}



function filtrarSoloCategoria(categoria) {  cargarProductosDesdeFirebase();
  const productos = document.querySelectorAll('.producto');

  productos.forEach(prod => {
    const cat = prod.getAttribute('data-categoria');
    prod.style.display = (cat === categoria) ? 'flex' : 'none';
  });

  cerrarMenuYOverlay(); // cierra menú, overlay y submenús
}
// Variables y funciones globales necesarias
// Variables globales necesarias
let carrito = [];
const carritoItems = document.getElementById("carrito-items");
const totalCarrito = document.getElementById("total-carrito");
const contadorCarrito = document.getElementById("contador-carrito");
const pagarBtn = document.getElementById("pagar-btn");

function actualizarCarrito() {
  carritoItems.innerHTML = "";
  let total = 0;
  carrito.forEach(item => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <img src="${item.imagen}" alt="${item.nombre}">
      <span>${item.nombre} x${item.cantidad} - $${(item.precio * item.cantidad).toFixed(2)}</span>
      <button class="eliminar-unidad" data-nombre="${item.nombre}">❌</button>
    `;
    carritoItems.appendChild(div);
    total += item.precio * item.cantidad;
  });

  totalCarrito.textContent = `Total: $${total.toFixed(2)}`;
  contadorCarrito.textContent = carrito.reduce((acc, item) => acc + item.cantidad, 0);

  document.querySelectorAll(".eliminar-unidad").forEach(btn => {
    btn.addEventListener("click", () => eliminarUnidad(btn.dataset.nombre));
  });
}

function eliminarUnidad(nombre) {
  const index = carrito.findIndex(item => item.nombre === nombre);
  if (index !== -1) {
    carrito[index].cantidad > 1 ? carrito[index].cantidad-- : carrito.splice(index, 1);
    actualizarCarrito();
  }
}

function agregarAlCarrito(nombre, precio, imagen, boton) {
  const existente = carrito.find(item => item.nombre === nombre);
  existente ? existente.cantidad++ : carrito.push({ nombre, precio, imagen, cantidad: 1 });
  actualizarCarrito();
  animarAgregar(boton);
}

function vaciarCarrito() {
  carrito = [];
  actualizarCarrito();
}

function animarAgregar(boton) {
  const floating = document.createElement("div");
  floating.className = "floating-plus";
  floating.textContent = "+1";
  document.body.appendChild(floating);

  const fromRect = boton.getBoundingClientRect();
  floating.style.left = `${fromRect.left + fromRect.width / 2}px`;
  floating.style.top = `${fromRect.top}px`;

  const carritoIcon = document.getElementById("abrir-carrito").getBoundingClientRect();
  const deltaX = carritoIcon.left - fromRect.left;
  const deltaY = carritoIcon.top - fromRect.top;

  setTimeout(() => {
    floating.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.5)`;
    floating.style.opacity = 0;
    setTimeout(() => floating.remove(), 1000);
  }, 50);
}

// Función usada por botones generados dinámicamente
window.agregarAlCarritoDesdeElemento = function(boton) {
  const producto = boton.closest(".producto");
  const nombre = producto.querySelector(".nombre").textContent;
  const precioTexto = producto.querySelector(".precio").textContent;
  const imagen = producto.querySelector("img").src;
  const precio = parseFloat(precioTexto.replace(/[^0-9.]/g, '')) || 0;
  agregarAlCarrito(nombre, precio, imagen, boton);
};

// Botón pagar por WhatsApp
window.pagarCarrito = function() {
  if (carrito.length === 0) {
    alert("El carrito está vacío.");
    return;
  }

  let mensaje = "*¡Hola! Quiero hacer este pedido:*\n\n";
  carrito.forEach(item => {
    mensaje += `• ${item.nombre} x${item.cantidad} - $${item.precio.toFixed(2)}\n`;
  });

  const total = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  mensaje += `\n*Total: $${total.toFixed(2)}*`;
  mensaje += `\n\nMi dirección es: ...`;

  window.open(`https://wa.me/+542221440844?text=${encodeURIComponent(mensaje)}`, "_blank");
};

pagarBtn?.addEventListener("click", () => {
  window.pagarCarrito();
});

// Selector de ordenamiento
document.getElementById("ordenar")?.addEventListener("change", (e) => {
  const criterio = e.target.value;
  ordenarProductosVisibles(criterio);
});


function ordenarProductosVisibles(criterio) {
  const contenedor = document.getElementById("productos-container");
  const loader = document.getElementById("loader2");

  // Ocultar productos mientras se ordenan
  contenedor.style.display = "none";
  loader?.classList.remove("loaderoculto");

  setTimeout(() => {
    const productos = Array.from(contenedor.querySelectorAll(".producto"))
      .filter(prod => prod.style.display !== "none");

    productos.sort((a, b) => {
      const nombreA = a.querySelector(".nombre").textContent.toLowerCase();
      const nombreB = b.querySelector(".nombre").textContent.toLowerCase();
      const precioA = parseFloat((a.querySelector(".precio")?.textContent || "0").replace(/[^0-9.]/g, '')) || 0;
      const precioB = parseFloat((b.querySelector(".precio")?.textContent || "0").replace(/[^0-9.]/g, '')) || 0;

      if (criterio === "nombre-asc") return nombreA.localeCompare(nombreB);
      if (criterio === "nombre-desc") return nombreB.localeCompare(nombreA);
      if (criterio === "precio-asc") return precioA - precioB;
      if (criterio === "precio-desc") return precioB - precioA;
      return 0;
    });

    productos.forEach(prod => contenedor.appendChild(prod));

    // Mostrar productos y ocultar loader
    loader?.classList.add("loaderoculto");
    contenedor.style.display = "grid";
  }, 300); // podés ajustar este tiempo si lo necesitás
}





// Hacer pública la función de carga para que se pueda llamar desde eventos
window.cargarProductosDesdeFirebase = cargarProductosDesdeFirebase;
document.getElementById("ordenar")?.addEventListener("change", (e) => {
  const criterio = e.target.value;

});

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
    }
  });
}, {
  threshold: 0.1
});

document.querySelectorAll(".producto").forEach(el => {
  observer.observe(el);
});

gsap.from(".producto", {
  opacity: 0,
  y: 40,
  stagger: 0.1,
  duration: 0.8,
  ease: "power3.out"
});

function mostrarSubmenu(categoria, botonClickeado) {
  const submenu = document.getElementById('submenu-categorias');
  submenu.innerHTML = '';

  const subcategorias = {
    bebidas: ['Cerveza', 'Gaseosas', 'Jugos', 'Vinos'],
    Cerveza: ['Packs', 'Latas','Latones', 'Botellas'],
    Gaseosas: ['Linea Coca', 'Linea Pepsi','Linea Manaos', 'Soda'],
    Vinos: ['Tinto', 'Blanco'],
    Jugos: ['En Sobre', 'Agua Saborizada', 'Baggio/Cepita/Ades'],

    Golosinas: ['Chocolates', 'Gomitas', 'Caramelos', 'Galletitas', 'Snacks'],
    Chocolates: ['Blancos', 'Negro', 'Cajas de Chocolates', 'Bocaditos'],
    Gomitas: ['Acidas/Picantes', 'Comunes'],
    Snacks: ['Papas', 'Palitos', 'Chizitos'],
    Galletitas: ['Bagley'],
    alimentos: ['Panadería', 'Fideos', 'Arroz', 'Salchichas', 'Hamburguesas', 'Pizzas'],
    Panadería: ['Pan Común', 'Pan de Hamburguesa', 'Pan de Panchos', 'Pan Lactal', 'Grisines/Galletas'],
    farmacia: ['Medicamentos', 'Higiene', 'Preservativos'],
    Higiene: ['Productos Femeninos', 'Desodoranetes','Máquinas de Afeitar','Jabones']
  }
  
  [categoria];

  if (subcategorias) {
    submenu.classList.add('show', 'animar');
    const btnTodos = document.createElement('button');
    btnTodos.textContent = 'Ver todos';
    btnTodos.onclick = () => filtrarProductosPorCategoria(categoria);
    submenu.appendChild(btnTodos);

    subcategorias.forEach(sub => {
      const btn = document.createElement('button');
      btn.textContent = sub;
      btn.onclick = () => filtrarProductosPorCategoria(sub);
      submenu.appendChild(btn);
    });

    if (botonClickeado) {
      const li = botonClickeado.closest('li');
      if (li) li.insertAdjacentElement('afterend', submenu);
    }
  }
}
function ocultarPantallaInicio() {
  document.getElementById('pantalla-inicio')?.classList.add('oculto');
}


/*---TOGGLE STOCK GLOBAL---*/

window.toggleStock = function(boton) {
  const productoEl = boton.closest(".producto");
  const nombre = productoEl.getAttribute("data-nombre");

  const sinStock = productoEl.classList.toggle("sin-stock");

  // Ocultar botón agregar si está sin stock
  const botonAgregar = productoEl.querySelector("button span");
  if (botonAgregar) {
    botonAgregar.textContent = sinStock ? "Sin stock" : "Agregar";
    productoEl.querySelector("button").disabled = sinStock;
  }

  // Guardar estado en Firebase
  firebase.database().ref("/stock/" + nombre).set(!sinStock);
};

window.toggleStock = function(boton) {
  const productoEl = boton.closest(".producto");
  const nombre = productoEl.getAttribute("data-nombre");

  const sinStock = productoEl.classList.toggle("sin-stock");

  // Cambiar botón agregar
  const botonAgregar = productoEl.querySelector("button span");
  if (botonAgregar) {
    botonAgregar.textContent = sinStock ? "Sin stock" : "Agregar";
    productoEl.querySelector("button").disabled = sinStock;
  }

  // Guardar en Firebase
  firebase.database().ref("/stock/" + nombre).set(!sinStock);
};

//*****PRODUCTOS-INICIO-ALEATORIOS***** */
function mostrarProductosAleatoriosEnInicio(productos) {
  const contenedor = document.getElementById("productos-rotativos");
  if (!contenedor || !productos || productos.length === 0) return;

  const maxMostrar = 4;
  const intervalo = 5000;

  function actualizar() {
    const seleccionados = productos
      .sort(() => Math.random() - 0.5)
      .slice(0, maxMostrar);

    contenedor.innerHTML = "";
    seleccionados.forEach(prod => {
      const clon = prod.cloneNode(true);
      clon.classList.add("visible");
      contenedor.appendChild(clon);
    });
  }

  actualizar();
  setInterval(actualizar, intervalo);
}


 


document.addEventListener("DOMContentLoaded", function () {
  // Solo activar en móviles
  if (window.innerWidth <= 768) {
    document.querySelectorAll(".abrir-submenu").forEach(link => {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        const submenuId = this.dataset.submenu;
        const submenu = document.getElementById(submenuId);

        // Ocultar todos los demás submenús
        document.querySelectorAll(".sub-menu-fixed").forEach(menu => {
          menu.classList.remove("show-mobile");
        });

        // Mostrar el submenú correspondiente
        if (submenu) {
          submenu.classList.add("show-mobile");

                // Ocultar menu-header solo en móvil
      if (window.innerWidth <= 768) {
        document.getElementById("menuHeader").style.display = "none";
      }
        }
      });
    });




  }

  document.querySelectorAll(".abrir-submenu").forEach(item => {
  item.addEventListener("click", function (e) {
    e.preventDefault(); // Previene navegación

    // Cerramos otros submenús abiertos
    document.querySelectorAll(".sub-menu-fixed").forEach(sub => sub.classList.remove("show-mobile"));

    // Abrimos el submenu correspondiente
    const submenuId = this.dataset.submenu;
    const submenu = document.getElementById(submenuId);

    if (submenu) {
      submenu.classList.add("show-mobile");

      // Mostrar botón volver solo en móvil
      const volverBtn = submenu.querySelector(".volver-btn");
      if (volverBtn) {
        volverBtn.style.display = "block";
        volverBtn.onclick = () => submenu.classList.remove("show-mobile");
      }
    }
  });
});

});


document.addEventListener("click", (e) => {
  if (e.target.classList.contains("volver-btn")) {
    console.log("Botón volver clickeado");
    const submenu = e.target.closest(".sub-menu-fixed");
    if (submenu) {
      submenu.style.display = "none";
    }
  }
});
