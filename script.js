
   // 🔧 Configuración de Firebase (reemplazá por la tuya)
  const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "kiosco-web.firebaseapp.com",
    databaseURL: "https://kiosco-web-default-rtdb.firebaseio.com",
    projectId: "kiosco-web",
    storageBucket: "kiosco-web.appspot.com",
    messagingSenderId: "XXXXXXXXXXX",
    appId: "APP_ID"
  };

  // Inicializamos Firebase
  firebase.initializeApp(firebaseConfig);
  const database = firebase.database();

  // 🔁 Función para limpiar la clave como en Python
  function limpiarClave(nombre) {
    return nombre.trim().replace(/[.$#[\]/]/g, "_");
  }

  // 🔄 Escuchar cambios en Firebase y actualizar los precios
  const productosRef = database.ref("/productos");

  productosRef.on("value", (snapshot) => {
    const productos = snapshot.val();
    if (!productos) return;

    console.log("Productos obtenidos de Firebase:", productos); // Verifica los datos obtenidos de Firebase.

    document.querySelectorAll(".producto").forEach((producto) => {
      // 🔍 Obtener el valor exacto del atributo data-nombre
      const nombreOriginal = producto.getAttribute("data-nombre");
      if (!nombreOriginal) return;

      const clave = limpiarClave(nombreOriginal);
      console.log("Buscando producto con clave:", clave); // Verifica las claves que está buscando.

      if (productos[clave]) {
        const precio = productos[clave].precio;
        const precioElemento = producto.querySelector(".precio");
        if (precioElemento) {
          precioElemento.textContent = `$${precio.toFixed(2)}`;
        }
      } else {
        console.log(`No se encontró el producto con clave: ${clave}`);
      }
    });
  });

/*Carrito*/

document.addEventListener("DOMContentLoaded", () => {
  const carrito = [];
  const abrirCarrito = document.getElementById("abrir-carrito");
  const modal = document.getElementById("carrito-modal");
  const cerrarCarrito = document.getElementById("cerrar-carrito");
  const carritoItems = document.getElementById("carrito-items");
  const totalCarrito = document.getElementById("total-carrito");
  const pagarBtn = document.getElementById("pagar-btn");

  // Abrir modal
  abrirCarrito.addEventListener("click", () => modal.style.display = "block");

  // Cerrar modal
  cerrarCarrito.addEventListener("click", () => modal.style.display = "none");
  window.addEventListener("click", e => {
    if (e.target === modal) modal.style.display = "none";
  });

  // Agregar al carrito
  document.querySelectorAll(".producto button").forEach((boton, index) => {
    boton.addEventListener("click", () => {
      const producto = boton.closest(".producto");
      const nombre = producto.querySelector(".nombre").textContent;
      const precioTexto = producto.querySelector(".precio").textContent;
      const precio = parseFloat(precioTexto.replace(/[^0-9,.]/g, "").replace(",", ".")) || 0;
      const imagen = producto.querySelector("img").src;

      carrito.push({ nombre, precio, imagen });
      actualizarCarrito();
    });
  });

  function actualizarCarrito() {
    carritoItems.innerHTML = "";
    let total = 0;

    carrito.forEach(item => {
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <img src="${item.imagen}" alt="${item.nombre}">
        <span>${item.nombre} - $${item.precio.toFixed(2)}</span>
      `;
      carritoItems.appendChild(div);
      total += item.precio;
    });

    totalCarrito.textContent = `Total: $${total.toFixed(2)}`;
  }

  // Botón pagar - enviar a WhatsApp
  pagarBtn.addEventListener("click", () => {
    if (carrito.length === 0) return alert("El carrito está vacío.");

    let mensaje = "*¡Hola! Quiero hacer este pedido:*\n\n";
    carrito.forEach((item, i) => {
      mensaje += `• ${item.nombre} - $${item.precio.toFixed(2)}\n`;
    });

    const total = carrito.reduce((acc, item) => acc + item.precio, 0);
    mensaje += `\n*Total: $${total.toFixed(2)}*`;

    const telefono = "542221430320"; // Cambia esto por tu número
    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
  });
});

/*Agregar Btn*/

document.querySelectorAll('.agregar-btn').forEach(boton => {
  boton.addEventListener('click', (e) => {
    // Lógica del carrito (agregar producto, etc.)
    // ...

    // Elemento flotante
    const floating = document.createElement('div');
    floating.className = 'floating-plus';
    floating.textContent = '+1';
    document.body.appendChild(floating);

    // Posición inicial (donde se hizo click)
    const fromRect = e.target.getBoundingClientRect();
    floating.style.left = `${fromRect.left + fromRect.width / 2}px`;
    floating.style.top = `${fromRect.top}px`;

    // Esperar un momento para que se aplique el estilo antes de animar
    setTimeout(() => {
      // Posición final (donde está el carrito)
      const carrito = document.getElementById('abrir-carrito');
      const toRect = carrito.getBoundingClientRect();

      const deltaX = toRect.left - fromRect.left;
      const deltaY = toRect.top - fromRect.top;

      floating.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.5)`;
      floating.style.opacity = '0';
    }, 10);

    // Eliminar después de la animación
    setTimeout(() => {
      floating.remove();
    }, 1000);
  });
});


let contador = 0;

function mostrarNotificacion(mensaje) {
  const contenedor = document.getElementById('notificacion-carrito');
  const notif = document.createElement('div');
  notif.classList.add('notificacion');
  notif.textContent = mensaje;
  contenedor.appendChild(notif);

  setTimeout(() => {
    notif.remove();
  }, 2500);
}

/*Filtrar categorias*/


let categoriaActiva = null;

const subcategoriasPorCategoria = {
  'Cerveza': ['Latas', 'Latones', 'Botellas', 'Packs'],
  'Gaseosas': ['Linea Coca', 'Linea Pepsi', 'Linea Manaos'],
  'Jugos': ['Polvo', 'Líquido'],
  'Vinos': ['Tinto', 'Blanco', 'Rosado']
};

function filtrarCategoria(categoria) {
  const productos = document.querySelectorAll('.producto');
  const submenu = document.getElementById('submenu-categorias');

  // Si se hace clic en la misma categoría activa, se cierra el submenú
  if (categoriaActiva === categoria) {
    submenu.classList.remove('show', 'animar');
    submenu.innerHTML = '';
    categoriaActiva = null;
    return;
  }

  categoriaActiva = categoria;

  productos.forEach(producto => {
    const cat = producto.getAttribute('data-categoria');
    if (categoria === 'todos' || cat === categoria) {
      mostrarProducto(producto);
    } else {
      ocultarProducto(producto);
    }
  });

  // Mostrar subcategorías si existen
  if (subcategoriasPorCategoria[categoria]) {
    submenu.innerHTML = ''; // Limpiar anterior

    // Botón "Todos" que filtra por la categoría completa
    const btnTodos = document.createElement('button');
    btnTodos.textContent = 'Todos';
    btnTodos.onclick = () => {
      const productos = document.querySelectorAll('.producto');
      productos.forEach(producto => {
        const cat = producto.getAttribute('data-categoria');
        if (cat === categoria) {
          mostrarProducto(producto);
        } else {
          ocultarProducto(producto);
        }
      });

      // Actualizar botón activo visualmente
      const botones = submenu.querySelectorAll('button');
      botones.forEach(b => b.classList.remove('subcategoria-activa'));
      btnTodos.classList.add('subcategoria-activa');
    };
    submenu.appendChild(btnTodos);

    subcategoriasPorCategoria[categoria].forEach(sub => {
      const btn = document.createElement('button');
      btn.textContent = sub;
      btn.onclick = () => filtrarSubcategoria(categoria, sub);
      submenu.appendChild(btn);
    });

    submenu.classList.add('show');
    void submenu.offsetWidth;
    submenu.classList.add('animar');
  } else {
    submenu.classList.remove('show', 'animar');
    submenu.innerHTML = '';
  }

  // Limpiar botón activo anterior
  const subButtons = submenu.querySelectorAll('button');
  subButtons.forEach(btn => btn.classList.remove('subcategoria-activa'));
}

function filtrarSubcategoria(categoria, subcategoria) {
  const productos = document.querySelectorAll('.producto');

  productos.forEach(producto => {
    const cat = producto.getAttribute('data-categoria');
    const sub = producto.getAttribute('data-subcategoria');

    if (cat === categoria && sub === subcategoria) {
      mostrarProducto(producto);
    } else {
      ocultarProducto(producto);
    }
  });

  // Marcar botón activo
  const botones = document.querySelectorAll('#submenu-categorias button');
  botones.forEach(btn => {
    btn.classList.remove('subcategoria-activa');
    if (btn.textContent === subcategoria) {
      btn.classList.add('subcategoria-activa');
    }
  });
}

function ocultarProducto(producto) {
  producto.classList.add('oculto');
  setTimeout(() => {
    producto.style.display = 'none';
  }, 400);
}

function mostrarProducto(producto) {
  producto.style.display = 'flex';
  producto.classList.add('oculto');
  requestAnimationFrame(() => {
    producto.classList.remove('oculto');
  });
}


/*Barra Busquera*/
document.addEventListener("DOMContentLoaded", () => {
  const inputBusqueda = document.getElementById("busqueda-productos");
  const productos = document.querySelectorAll(".producto");

  inputBusqueda.addEventListener("input", () => {
    const valor = inputBusqueda.value.toLowerCase();

    productos.forEach(producto => {
      const nombre = producto.querySelector(".nombre").textContent.toLowerCase();
      producto.style.display = nombre.includes(valor) ? "flex" : "none";
    });
  });
});

/*sidebar*/

function mostrarSidebar() {
  const sidebar = document.querySelector('.sidebar');
  sidebar.classList.add('visible');
  document.body.classList.add('sidebar-activo');
}

function ocultarSidebar() {
  const sidebar = document.querySelector('.sidebar');
  sidebar.classList.remove('visible');
  document.body.classList.remove('sidebar-activo');
}


/*CARRITO*/


// Array para guardar los productos en el carrito
// Array para guardar los productos en el carrito
/* CARRITO */

document.addEventListener("DOMContentLoaded", () => {
  let carrito = [];

  // Referencias a elementos del DOM
  const abrirCarrito = document.getElementById("abrir-carrito");
  const modal = document.getElementById("carrito-modal");
  const cerrarCarrito = document.getElementById("cerrar-carrito");
  const carritoItems = document.getElementById("carrito-items");
  const totalCarrito = document.getElementById("total-carrito");
  const contadorCarrito = document.getElementById("contador-carrito");
  const pagarBtn = document.getElementById("pagar-btn");

  // Abrir y cerrar modal del carrito
  abrirCarrito.addEventListener("click", () => modal.style.display = "block");
  cerrarCarrito.addEventListener("click", () => modal.style.display = "none");
  window.addEventListener("click", e => {
    if (e.target === modal) modal.style.display = "none";
  });

  // Función para actualizar contador sumando cantidades
  function actualizarContador() {
    const totalCantidad = carrito.reduce((acc, item) => acc + item.cantidad, 0);
    contadorCarrito.textContent = totalCantidad;
  }

  // Función para actualizar el carrito en pantalla mostrando cantidad y subtotal
 function actualizarCarrito() {
  carritoItems.innerHTML = "";
  let total = 0;

  carrito.forEach(item => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <img src="${item.imagen}" alt="${item.nombre}">
      <span>${item.nombre} x${item.cantidad} - $${(item.precio * item.cantidad).toFixed(2)}</span>
      <button class="eliminar-unidad" data-nombre="${item.nombre}" title="Eliminar una unidad">❌</button>
    `;
    carritoItems.appendChild(div);
    total += item.precio * item.cantidad;
  });

  totalCarrito.textContent = `Total: $${total.toFixed(2)}`;
  actualizarContador();

  // Vincular los botones de eliminar a su evento
  document.querySelectorAll(".eliminar-unidad").forEach(btn => {
    btn.addEventListener("click", () => {
      const nombre = btn.getAttribute("data-nombre");
      eliminarUnidad(nombre);
    });
  });
}

function eliminarUnidad(nombre) {
  const index = carrito.findIndex(item => item.nombre === nombre);
  if (index !== -1) {
    if (carrito[index].cantidad > 1) {
      carrito[index].cantidad -= 1;
    } else {
      carrito.splice(index, 1);
    }
    actualizarCarrito();
  }
}

  // Función para agregar producto al carrito con animación y control de cantidad
  function agregarAlCarritoConAnimacion(nombre, precio, imagen, boton) {
    // Buscar si ya está el producto en el carrito
    const productoExistente = carrito.find(item => item.nombre === nombre);

    if (productoExistente) {
      productoExistente.cantidad += 1; // aumentar cantidad
    } else {
      carrito.push({ nombre, precio, imagen, cantidad: 1 });
    }

    actualizarCarrito();

    // Animación +1 desde botón hacia carrito
    const carritoIcon = abrirCarrito;
    const btnRect = boton.getBoundingClientRect();
    const carritoRect = carritoIcon.getBoundingClientRect();

    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    const startX = btnRect.left + btnRect.width / 2 + scrollLeft;
    const startY = btnRect.top + btnRect.height / 2 + scrollTop;

    const endX = carritoRect.left + carritoRect.width / 2 + scrollLeft;
    const endY = carritoRect.top + carritoRect.height / 2 + scrollTop;

    const floating = document.createElement("div");
    floating.classList.add("floating-plus");
    floating.textContent = "+1";
    document.body.appendChild(floating);

    floating.style.left = `${startX}px`;
    floating.style.top = `${startY}px`;

    // Forzar reflow para que la animación funcione
    void floating.offsetWidth;

    setTimeout(() => {
      floating.style.transform = `translate(${endX - startX}px, ${endY - startY}px) scale(1.5)`;
      floating.style.opacity = "0";
    }, 50);

    setTimeout(() => {
      floating.remove();
    }, 1100);

    // Animar el carrito (pulse)
    carritoIcon.classList.add("animate");
    setTimeout(() => {
      carritoIcon.classList.remove("animate");
    }, 500);
  }

  // Asociar botón "Agregar" con la función completa
  document.querySelectorAll(".producto button").forEach(button => {
    button.addEventListener("click", () => {
      const producto = button.closest(".producto");
      const nombre = producto.querySelector(".nombre").textContent;
      let precioTexto = producto.querySelector(".precio").textContent;
      let precio = parseFloat(precioTexto.replace(/[^0-9,.]/g, "").replace(",", ".")) || 0;
      const imagen = producto.querySelector("img").src;

      agregarAlCarritoConAnimacion(nombre, precio, imagen, button);
    });
  });

  // Botón pagar - enviar a WhatsApp
  pagarBtn.addEventListener("click", () => {
    if (carrito.length === 0) return alert("El carrito está vacío.");

    let mensaje = "*¡Hola! Quiero hacer este pedido:*\n\n";
    carrito.forEach(item => {
      mensaje += `• ${item.nombre} x${item.cantidad} - $${(item.precio * item.cantidad).toFixed(2)}\n`;
    });

    const total = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    mensaje += `\n*Total: $${total.toFixed(2)}*`;

    const telefono = "542221430320"; // Cambia esto por tu número
    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
  });
});
