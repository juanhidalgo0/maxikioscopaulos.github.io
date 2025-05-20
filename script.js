// script optimizado.js

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
  const productosRef = database.ref("/productos");

  productosRef.on("value", (snapshot) => {
    const productos = snapshot.val();
    if (!productos) return;

    document.querySelectorAll(".producto").forEach((producto) => {
      const nombreOriginal = producto.getAttribute("data-nombre");
      if (!nombreOriginal) return;

      const clave = nombreOriginal.trim().replace(/[.$#[\]/]/g, "_");
      const precio = productos[clave]?.precio;
      const precioElemento = producto.querySelector(".precio");
      if (precioElemento && precio) precioElemento.textContent = `$${precio.toFixed(2)}`;
    });
  });

  const menuToggle = document.getElementById('menuToggle');
  const menu = document.getElementById('menu');
  const overlay = document.getElementById('overlay');
  const header = document.querySelector('.header');
  const abrirCarrito = document.getElementById('abrir-carrito');
  const cerrarCarrito = document.getElementById('cerrar-carrito');
  const carritoSidebar = document.getElementById('carrito-sidebar');

  function cerrarTodosLosSubmenus() {
    document.querySelectorAll('.sub-menu-fixed').forEach(submenu => {
      submenu.classList.remove('show', 'show-mobile', 'mostrar');
    });
  }



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

document.addEventListener("click", (e) => {
  const target = e.target;

  if (target.matches(".volver-btn")) {
  e.preventDefault();
  console.log("Botón volver clickeado");
  const submenu = target.closest(".sub-menu-fixed");
  console.log("Submenú encontrado:", submenu);
  submenu?.classList.remove("show", "show-mobile", "mostrar");
  }

if (target.matches(".abrir-submenu")) {
  e.preventDefault();
  const submenuId = target.getAttribute("data-submenu");
  const submenu = document.getElementById(submenuId);
  if (submenu) {
    cerrarTodosLosSubmenus();
    submenu.classList.add("show-mobile"); // <-- Bien
  }
}

  });

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

  function animarAgregar(boton) {
    const floating = document.createElement("div");
    floating.className = "floating-plus";
    floating.textContent = "+1";
    document.body.appendChild(floating);

    const fromRect = boton.getBoundingClientRect();
    floating.style.left = `${fromRect.left + fromRect.width / 2}px`;
    floating.style.top = `${fromRect.top}px`;

    const carritoIcon = abrirCarrito.getBoundingClientRect();
    const deltaX = carritoIcon.left - fromRect.left;
    const deltaY = carritoIcon.top - fromRect.top;

    setTimeout(() => {
      floating.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.5)`;
      floating.style.opacity = 0;
      setTimeout(() => floating.remove(), 1000);
    }, 50);
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

function filtrarCategoria(categoria, botonClickeado = null) {
  const productos = document.querySelectorAll('.producto');
  const submenu = document.getElementById('submenu-categorias');

  // Cerrar si se hace clic en la misma categoría activa
  if (window.categoriaActiva === categoria) {
    submenu.classList.remove('show', 'animar');
    submenu.innerHTML = '';
    window.categoriaActiva = null;

    // Restaurar flecha del botón clickeado
    if (botonClickeado) {
      const iconoFlecha = botonClickeado.querySelector('.flecha-icono');
      if (iconoFlecha) {
        iconoFlecha.classList.remove('fa-arrow-down');
        iconoFlecha.classList.add('fa-arrow-right');
      }
    }

    return;
  }

  // Cerrar cualquier submenú anterior y restaurar flechas
  submenu.classList.remove('show', 'animar');
  submenu.innerHTML = '';
  window.categoriaActiva = categoria;

  // Restaurar todas las flechas a flecha derecha
  document.querySelectorAll('.flecha-icono').forEach(icono => {
    icono.classList.remove('fa-arrow-down');
    icono.classList.add('fa-arrow-right');
  });

  // Posicionar submenu debajo del botón clickeado
  if (botonClickeado) {
    const li = botonClickeado.closest("li");
    if (li && submenu) {
      li.insertAdjacentElement("afterend", submenu);
    }

    // Cambiar la flecha del botón clickeado a flecha abajo
    const iconoFlecha = botonClickeado.querySelector('.flecha-icono');
    if (iconoFlecha) {
      iconoFlecha.classList.remove('fa-arrow-right');
      iconoFlecha.classList.add('fa-arrow-down');
    }
  }




  const subcategoriasPorCategoria = {
    bebidas: ['Cerveza', 'Gaseosas', 'Jugos', 'Vinos'],
    
    Cerveza: ['Packs', 'Latas','Latones', 'Botellas'],
    Gaseosas: ['Linea Coca', 'Linea Pepsi','Linea Manaos', 'Soda'],
    Vinos: ['Tinto', 'Blanco'],

    golosinas: ['Chocolates', 'Gomitas', 'Caramelos', 'Galletitas', 'Snacks'],

    Chocolates: ['Blanco', 'Negro', 'Cajas de Chocolates', 'Bocaditos'],
    Gomitas: ['Acidas/Picantes', 'Comunes'],
    Snacks: ['Papas', 'Palitos', 'Chizitos'],
    
    alimentos: ['Panadería', 'Fideos', 'Arroz', 'Salchichas', 'Hamburguesas', 'Pizzas'],
    Panadería: ['Pan Común', 'Pan de Hamburguesa', 'Pan de Panchos', 'Pan Lactal', 'Grisines/Galletas'],

    farmacia: ['Medicamentos', 'Higiene', 'Preservativos'],
    Higiene: ['Productos Femeninos', 'Desodoranetes','Máquinas de Afeitar','Jabones']


  };

  const subcategorias = subcategoriasPorCategoria[categoria];

  if (subcategorias) {
    submenu.classList.add('show', 'animar');

 const btnTodos = document.createElement('button');
btnTodos.textContent = 'Ver todos';
btnTodos.onclick = () => {
  productos.forEach(prod => {
    const cat = prod.getAttribute('data-categoria');
    prod.style.display = (cat === categoria) ? 'flex' : 'none';
  });
  cerrarMenuYOverlay();
};
submenu.appendChild(btnTodos);


    subcategorias.forEach(sub => {
      const btn = document.createElement('button');
      btn.textContent = sub;
      btn.onclick = () => {
        productos.forEach(prod => {
          const cat = prod.getAttribute('data-categoria');
          const subcat = prod.getAttribute('data-subcategoria');
          prod.style.display = (cat === categoria && subcat === sub) ? 'flex' : 'none';
        });
        cerrarMenuYOverlay();
      };
      submenu.appendChild(btn);
    });
  } else {
    // 💡 Si NO tiene subcategorías, mostrar los productos directamente
    productos.forEach(prod => {
      const cat = prod.getAttribute('data-categoria');
      prod.style.display = (cat === categoria) ? 'flex' : 'none';
    });
    cerrarMenuYOverlay(); // cerrar menú y overlay
}
}

// Esta función se encarga de cerrar el menú, overlay y submenús
function cerrarMenuYOverlay() {
  const menu = document.getElementById('menu');
  const overlay = document.getElementById('overlay');
  const header = document.querySelector('.header');
  const menuToggle = document.getElementById('menuToggle');
  const submenuCategorias = document.getElementById('submenu-categorias');

  menu.classList.remove('abierto');
  overlay.classList.remove('active');
  header.classList.remove('opaco');
  menuToggle.classList.remove('activo');
  cerrarTodosLosSubmenus(); // oculta submenús laterales

  // ⬇️ Esta línea oculta también el bloque de subcategorías
  submenuCategorias?.classList.remove('show', 'animar');
  submenuCategorias.innerHTML = '';
  window.categoriaActiva = null;
}



function filtrarPorTercerCategoria(tercerCategoria) {
  const productos = document.querySelectorAll('.producto');

  productos.forEach(producto => {
    const categoria = producto.getAttribute('data-tercer-categoria')?.toLowerCase();
    producto.style.display = (categoria === tercerCategoria.toLowerCase()) ? 'flex' : 'none';
  });

  cerrarMenuYOverlay(); // Usás esta función para cerrar menú, overlay y submenús
}

function filtrarSoloCategoria(categoria) {
  const productos = document.querySelectorAll('.producto');

  productos.forEach(prod => {
    const cat = prod.getAttribute('data-categoria');
    prod.style.display = (cat === categoria) ? 'flex' : 'none';
  });

  cerrarMenuYOverlay(); // cierra menú, overlay y submenús
}