/**
 * cart.js — Carrito de Compras de Joyería INVERANOLI
 * Reglas Comerciales Estrictas:
 * 1. Autenticación obligatoria para comprar (redirige al login si no ha iniciado sesión).
 * 2. Separación de roles: Las cuentas 'admin' no pueden armar carritos de compras.
 * 3. Límite de compra: Máximo 5 unidades por producto por pedido.
 * 4. Validación de stock en tiempo real con MotorSQL.
 * 5. Aislamiento de sesión: Se vacía al cerrar sesión.
 */

var Cart = (function () {
  'use strict';

  var MAX_POR_PRODUCTO = 5;

  function obtenerCarrito() {
    var items = Api.leer('carrito_items', []);
    return Array.isArray(items) ? items : [];
  }

  function guardarCarrito(items) {
    Api.guardar('carrito_items', items);
    actualizarBadges();
    renderCarrito();
  }

  function items() {
    return obtenerCarrito();
  }

  function agregar(productoId, cantidad, personalizacion) {
    var usuario = Api.leer('sesion_actual', null);

    // 1. Validar autenticación
    if (!usuario) {
      if (typeof Notificaciones !== 'undefined') {
        Notificaciones.alerta('Para armar un pedido de joyas debes iniciar sesión o registrarte como cliente.', 'Acceso Requerido');
      } else {
        alert('Para armar un pedido de joyas debes iniciar sesión o registrarte como cliente.');
      }
      if (typeof abrirAuthModal === 'function') {
        abrirAuthModal('login');
      }
      return false;
    }

    // 2. Validar rol
    if (usuario.rol === 'admin') {
      if (typeof Notificaciones !== 'undefined') {
        Notificaciones.alerta('El usuario Administrador está reservado para la gestión de inventario y pedidos. No puede agregar joyas al carrito.', 'Acceso Restringido');
      } else {
        alert('El usuario Administrador está reservado para la gestión de inventario y pedidos. No puede agregar joyas al carrito.');
      }
      return false;
    }

    // 3. Consultar producto y stock disponible en la base de datos
    var prod = MotorSQL.consultar('productos', function (p) {
      return p.id === Number(productoId);
    })[0];

    if (!prod) {
      if (typeof Notificaciones !== 'undefined') {
        Notificaciones.alerta('La joya seleccionada no existe en el sistema.', 'Error de Catálogo');
      } else {
        alert('La joya seleccionada no existe en el sistema.');
      }
      return false;
    }

    if (prod.activo === false) {
      if (typeof Notificaciones !== 'undefined') {
        Notificaciones.alerta('Esta joya se encuentra temporalmente inactiva o fuera de catálogo.', 'Joya Inactiva');
      } else {
        alert('Esta joya se encuentra temporalmente inactiva o fuera de catálogo.');
      }
      return false;
    }

    if (prod.stock <= 0) {
      if (typeof Notificaciones !== 'undefined') {
        Notificaciones.alerta('Lo sentimos, "' + prod.nombre + '" se encuentra agotada actualmente.', 'Sin Stock');
      } else {
        alert('Lo sentimos, "' + prod.nombre + '" se encuentra agotado actualmente.');
      }
      return false;
    }

    var carrito = obtenerCarrito();
    var itemExistente = carrito.find(function (it) {
      return it.id === prod.id;
    });

    var cantAAgregar = cantidad || 1;
    var cantActual = itemExistente ? itemExistente.cantidad : 0;
    var nuevaCant = cantActual + cantAAgregar;

    // 4. Validar límite antiacaparamiento (máximo 5 unidades)
    if (nuevaCant > MAX_POR_PRODUCTO) {
      if (typeof Notificaciones !== 'undefined') {
        Notificaciones.alerta('Límite comercial alcanzado: Solo se permite un máximo de ' + MAX_POR_PRODUCTO + ' unidades de "' + prod.nombre + '" por pedido.', 'Límite por Pedido');
      } else {
        alert('Límite comercial alcanzado: Solo se permite un máximo de ' + MAX_POR_PRODUCTO + ' unidades de "' + prod.nombre + '" por pedido.');
      }
      return false;
    }

    // 5. Validar stock físico disponible
    if (nuevaCant > prod.stock) {
      if (typeof Notificaciones !== 'undefined') {
        Notificaciones.alerta('Inventario insuficiente: Solo quedan ' + prod.stock + ' unidad(es) disponibles de "' + prod.nombre + '".', 'Stock Insuficiente');
      } else {
        alert('Inventario insuficiente: Solo quedan ' + prod.stock + ' unidad(es) disponibles de "' + prod.nombre + '".');
      }
      return false;
    }

    if (itemExistente) {
      itemExistente.cantidad = nuevaCant;
      if (personalizacion) itemExistente.personalizacion = personalizacion;
    } else {
      var precioFinal = prod.precio;
      carrito.push({
        id: prod.id,
        nombre: prod.nombre,
        presentacion: prod.presentacion,
        precio: precioFinal,
        precioOriginal: prod.precio,
        descuento: 0,
        cantidad: cantAAgregar,
        stockMax: prod.stock,
        imagen: (prod.imagenes && prod.imagenes.length) ? prod.imagenes[0] : 'images/anillo_grado.jpg',
        personalizacion: personalizacion || ''
      });
    }

    guardarCarrito(carrito);
    if (typeof Notificaciones !== 'undefined') {
      Notificaciones.toast('"' + prod.nombre + '" agregada a tu pedido.', 'exito');
    }
    abrirDrawerCarrito();
    return true;
  }

  function decrementar(productoId) {
    var carrito = obtenerCarrito();
    var item = carrito.find(function (it) { return it.id === Number(productoId); });
    if (!item) return;

    if (item.cantidad > 1) {
      item.cantidad -= 1;
    } else {
      carrito = carrito.filter(function (it) { return it.id !== Number(productoId); });
    }
    guardarCarrito(carrito);
  }

  function incrementar(productoId) {
    var prod = MotorSQL.consultar('productos', function (p) { return p.id === Number(productoId); })[0];
    if (!prod) return;

    var carrito = obtenerCarrito();
    var item = carrito.find(function (it) { return it.id === Number(productoId); });
    if (!item) return;

    if (item.cantidad >= MAX_POR_PRODUCTO) {
      if (typeof Notificaciones !== 'undefined') {
        Notificaciones.toast('Límite de ' + MAX_POR_PRODUCTO + ' unidades por pieza alcanzado.', 'alerta');
      } else {
        alert('Has alcanzado el límite máximo de ' + MAX_POR_PRODUCTO + ' unidades por pieza.');
      }
      return;
    }

    if (item.cantidad >= prod.stock) {
      if (typeof Notificaciones !== 'undefined') {
        Notificaciones.toast('Solo disponemos de ' + prod.stock + ' unidades en stock.', 'alerta');
      } else {
        alert('Solo disponemos de ' + prod.stock + ' unidades en stock.');
      }
      return;
    }

    item.cantidad += 1;
    guardarCarrito(carrito);
  }

  function remover(productoId) {
    var carrito = obtenerCarrito().filter(function (it) {
      return it.id !== Number(productoId);
    });
    guardarCarrito(carrito);
  }

  function vaciar() {
    guardarCarrito([]);
  }

  function calcularTotal() {
    var carrito = obtenerCarrito();
    return carrito.reduce(function (acc, it) {
      return acc + (it.precio * it.cantidad);
    }, 0);
  }

  function contarItems() {
    var carrito = obtenerCarrito();
    return carrito.reduce(function (acc, it) {
      return acc + it.cantidad;
    }, 0);
  }

  function actualizarBadges() {
    var totalCant = contarItems();
    var badge = document.getElementById('cart-count');
    if (badge) {
      badge.textContent = totalCant;
      badge.style.display = totalCant > 0 ? 'inline-block' : 'none';
    }
  }

  return {
    agregar: agregar,
    decrementar: decrementar,
    incrementar: incrementar,
    remover: remover,
    vaciar: vaciar,
    items: items,
    calcularTotal: calcularTotal,
    contarItems: contarItems,
    actualizarBadges: actualizarBadges
  };
})();

// Control visual del Drawer lateral del carrito
function abrirDrawerCarrito() {
  var drawer = document.getElementById('cart-drawer');
  var overlay = document.getElementById('cart-overlay');
  if (drawer) drawer.classList.add('abierto');
  if (overlay) overlay.classList.add('activo');
  renderCarrito();
}

function cerrarDrawerCarrito() {
  var drawer = document.getElementById('cart-drawer');
  var overlay = document.getElementById('cart-overlay');
  if (drawer) drawer.classList.remove('abierto');
  if (overlay) overlay.classList.remove('activo');
}

function toggleCarritoDrawer() {
  var drawer = document.getElementById('cart-drawer');
  if (drawer && drawer.classList.contains('abierto')) {
    cerrarDrawerCarrito();
  } else {
    abrirDrawerCarrito();
  }
}

function renderCarrito() {
  var cont = document.getElementById('cart-items-container');
  var elSubtotalUSD = document.getElementById('cart-subtotal-usd');
  var elSubtotalBs  = document.getElementById('cart-subtotal-bs');
  var btnCheckout   = document.getElementById('cart-checkout-btn');
  if (!cont) return;

  var items = Cart.items();

  if (!items.length) {
    cont.innerHTML =
      '<div class="cart-vacio-box">' +
      '  <div style="margin-bottom:12px;"><svg class="nav-icon-svg" style="width:48px;height:48px;color:var(--gold-primary);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="14" r="7"></circle><path d="M12 7V3m-3 2l6-2m-6 0l6 2"></path></svg></div>' +
      '  <h4>Tu pedido está vacío</h4>' +
      '  <p>Explora nuestras colecciones de anillos de grado, matrimonio y cadenas de acero.</p>' +
      '</div>';
    if (elSubtotalUSD) elSubtotalUSD.textContent = '$0.00';
    if (elSubtotalBs)  elSubtotalBs.textContent  = 'Bs. 0,00';
    if (btnCheckout)   btnCheckout.disabled = true;
    return;
  }

  var html = '';
  items.forEach(function (it) {
    var precioUnitBs = typeof TasaBCV !== 'undefined' ? TasaBCV.convertirBs(it.precio) : '';
    html +=
      '<div class="cart-item-row">' +
      '  <img src="' + it.imagen + '" alt="' + it.nombre + '" class="cart-item-img">' +
      '  <div class="cart-item-details">' +
      '    <div class="cart-item-title">' + it.nombre + '</div>' +
      '    <div class="cart-item-meta">' + (it.presentacion || '') + '</div>' +
      (it.personalizacion ? '<div class="cart-item-personalizacion">Grabado: ' + it.personalizacion + '</div>' : '') +
      '    <div class="cart-item-price">$' + it.precio.toFixed(2) + ' <small>(' + precioUnitBs + ')</small></div>' +
      '    <div class="cart-item-controls">' +
      '      <div class="cart-qty-group">' +
      '        <button type="button" class="cart-qty-btn" onclick="Cart.decrementar(' + it.id + ')">-</button>' +
      '        <span class="cart-qty-num">' + it.cantidad + '</span>' +
      '        <button type="button" class="cart-qty-btn" onclick="Cart.incrementar(' + it.id + ')">+</button>' +
      '      </div>' +
      '      <button type="button" class="cart-remove-link" onclick="Cart.remover(' + it.id + ')">Eliminar</button>' +
      '    </div>' +
      '  </div>' +
      '</div>';
  });

  cont.innerHTML = html;

  var total = Cart.calcularTotal();
  if (elSubtotalUSD) elSubtotalUSD.textContent = '$' + total.toFixed(2);
  if (elSubtotalBs)  elSubtotalBs.textContent  = typeof TasaBCV !== 'undefined' ? TasaBCV.convertirBs(total) : '';
  if (btnCheckout)   btnCheckout.disabled = false;
}
