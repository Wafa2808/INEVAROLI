/**
 * cart.js — Carrito de Compras de Joyería INVERANOLI
 * Reglas Comerciales Estrictas:
 * 1. Autenticación obligatoria para comprar (redirige al login si no ha iniciado sesión).
 * 2. Separación de roles: Las cuentas 'admin' no pueden armar carritos de compras.
 * 3. Límite de compra: Máximo 5 unidades por producto por pedido.
 * 4. Validación de stock en tiempo real con MotorSQL.
 * 5. Aislamiento de sesión: Se vacía al cerrar sesión.
 */

// Verifica si el usuario actual tiene un pedido pendiente de validación de pago
function tienePedidoPendienteActivo() {
  try {
    var usuario = Api.leer('sesion_actual', null);
    if (!usuario || !usuario.id) return false;
    var ordenesPendientes = MotorSQL.consultar('ordenes', function (o) {
      return o.usuario_id === usuario.id && (o.estado === 'pendiente' || o.estado === 'recibido');
    });
    return ordenesPendientes.length > 0;
  } catch (e) {
    return false;
  }
}

var Cart = (function () {
  'use strict';

  var MAX_POR_PRODUCTO = 5;

  function obtenerClaveCarrito() {
    var usuario = Api.leer('sesion_actual', null);
    if (usuario && usuario.id) {
      return 'carrito_items_user_' + usuario.id;
    }
    return 'carrito_items';
  }

  function obtenerCarrito() {
    var clave = obtenerClaveCarrito();
    var items = Api.leer(clave, null);
    // Si no hay ítems en la clave del usuario pero hay en la clave general, migrar
    if (!items || !Array.isArray(items)) {
      var itemsGen = Api.leer('carrito_items', []);
      if (Array.isArray(itemsGen) && itemsGen.length > 0) {
        Api.guardar(clave, itemsGen);
        return itemsGen;
      }
      return [];
    }
    return Array.isArray(items) ? items : [];
  }

  function guardarCarrito(items) {
    var clave = obtenerClaveCarrito();
    var lista = Array.isArray(items) ? items : [];
    Api.guardar(clave, lista);
    // Mantener sincronizada la clave genérica de respaldo
    Api.guardar('carrito_items', lista);
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

    // 2.1 Validar si tiene un pedido pendiente en proceso
    var ordenesPendientes = MotorSQL.consultar('ordenes', function (o) {
      return o.usuario_id === usuario.id && (o.estado === 'pendiente' || o.estado === 'recibido');
    });
    if (ordenesPendientes.length > 0) {
      if (typeof Notificaciones !== 'undefined') {
        Notificaciones.alerta('Tienes un pedido pendiente de validación por WhatsApp. No puedes agregar más joyas al carrito hasta que el administrador valide tu pago.', 'Pedido en Curso');
      } else {
        alert('Tienes un pedido pendiente de validación por WhatsApp. No puedes agregar más joyas al carrito hasta que el administrador valide tu pago.');
      }
      abrirDrawerCarrito();
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

    var tallaElegida = personalizacion || 'Estándar';
    var stockTallas = typeof MotorSQL !== 'undefined' && typeof MotorSQL.obtenerStockTallas === 'function'
      ? MotorSQL.obtenerStockTallas(prod)
      : (prod.stock_tallas || {});

    // Determinar stock disponible de la talla específica
    var stockTalla = stockTallas[tallaElegida];
    if (stockTalla === undefined) {
      // Buscar coincidencia flexible
      var tallaNorm = String(tallaElegida).trim().toLowerCase().replace(/^talla\s*/i, '');
      for (var tk in stockTallas) {
        if (stockTallas.hasOwnProperty(tk)) {
          var tkNorm = String(tk).trim().toLowerCase().replace(/^talla\s*/i, '');
          if (tkNorm === tallaNorm) {
            stockTalla = stockTallas[tk];
            tallaElegida = tk;
            break;
          }
        }
      }
    }
    if (stockTalla === undefined) {
      stockTalla = typeof prod.stock === 'number' ? prod.stock : parseInt(prod.stock, 10) || 0;
    }

    if (stockTalla <= 0) {
      if (typeof Notificaciones !== 'undefined') {
        Notificaciones.alerta('Lo sentimos, la talla "' + tallaElegida + '" de "' + prod.nombre + '" se encuentra agotada.', 'Talla Agotada');
      } else {
        alert('Lo sentimos, la talla seleccionada se encuentra agotada.');
      }
      return false;
    }

    var carrito = obtenerCarrito();
    // Identificar ítem por producto Y por talla
    var itemExistente = carrito.find(function (it) {
      return it.id === prod.id && String(it.personalizacion || '') === String(tallaElegida);
    });

    var cantAAgregar = cantidad || 1;
    var cantActual = itemExistente ? (itemExistente.cantidad || 0) : 0;
    var nuevaCant = cantActual + cantAAgregar;

    // 4. Validar límite antiacaparamiento (máximo 5 unidades)
    if (nuevaCant > MAX_POR_PRODUCTO) {
      if (typeof Notificaciones !== 'undefined') {
        Notificaciones.alerta('Límite comercial alcanzado: Solo se permite un máximo de ' + MAX_POR_PRODUCTO + ' unidades de "' + prod.nombre + '" (Talla: ' + tallaElegida + ') por pedido.', 'Límite por Pedido');
      } else {
        alert('Límite comercial alcanzado: Solo se permite un máximo de ' + MAX_POR_PRODUCTO + ' unidades por pedido.');
      }
      return false;
    }

    // 5. Validar stock físico disponible para esta talla específica
    if (nuevaCant > stockTalla) {
      if (typeof Notificaciones !== 'undefined') {
        Notificaciones.alerta('Inventario insuficiente en talla ' + tallaElegida + ': Solo quedan ' + stockTalla + ' unidad(es) disponibles de "' + prod.nombre + '".', 'Stock Insuficiente');
      } else {
        alert('Inventario insuficiente: Solo quedan ' + stockTalla + ' unidad(es) disponibles en esta talla.');
      }
      return false;
    }

    var fotoProd = 'logo.png';
    if (prod.imagenes && Array.isArray(prod.imagenes) && prod.imagenes.length) {
      fotoProd = prod.imagenes[0];
    } else if (typeof prod.imagenes === 'string' && prod.imagenes) {
      try {
        var arr = JSON.parse(prod.imagenes);
        if (Array.isArray(arr) && arr.length) fotoProd = arr[0];
      } catch (e) {
        fotoProd = prod.imagenes;
      }
    }

    var precioFinal = Number(prod.precio) || 0;

    if (itemExistente) {
      itemExistente.cantidad = nuevaCant;
      itemExistente.precio = precioFinal;
      itemExistente.stockMax = stockTalla;
      itemExistente.personalizacion = tallaElegida;
    } else {
      carrito.push({
        id: prod.id,
        nombre: prod.nombre || 'Joya INVERANOLI',
        presentacion: prod.presentacion || 'Joyería Fina',
        precio: precioFinal,
        precioOriginal: precioFinal,
        descuento: 0,
        cantidad: cantAAgregar,
        stockMax: stockTalla,
        imagen: fotoProd,
        personalizacion: tallaElegida
      });
    }

    guardarCarrito(carrito);
    if (typeof Notificaciones !== 'undefined') {
      Notificaciones.toast('"' + prod.nombre + '" (Talla: ' + tallaElegida + ') agregada a tu pedido.', 'exito');
    }
    abrirDrawerCarrito();
    return true;
  }

  function decrementar(productoId, talla) {
    if (tienePedidoPendienteActivo()) {
      if (typeof Notificaciones !== 'undefined') {
        Notificaciones.alerta('Tu pedido está pendiente de validación de pago. No puedes modificar las cantidades ni borrar productos del carrito hasta que el administrador lo valide.', 'Pedido en Validación');
      }
      return;
    }
    var carrito = obtenerCarrito();
    var item = carrito.find(function (it) {
      if (talla !== undefined) {
        return it.id === Number(productoId) && String(it.personalizacion || '') === String(talla);
      }
      return it.id === Number(productoId);
    });
    if (!item) return;

    if (item.cantidad > 1) {
      item.cantidad -= 1;
    } else {
      carrito = carrito.filter(function (it) {
        if (talla !== undefined) {
          return !(it.id === Number(productoId) && String(it.personalizacion || '') === String(talla));
        }
        return it.id !== Number(productoId);
      });
    }
    guardarCarrito(carrito);
  }

  function incrementar(productoId, talla) {
    if (tienePedidoPendienteActivo()) {
      if (typeof Notificaciones !== 'undefined') {
        Notificaciones.alerta('Tu pedido está pendiente de validación de pago. No puedes agregar ni modificar productos en el carrito hasta que el administrador lo valide.', 'Pedido en Validación');
      }
      return;
    }
    var prod = MotorSQL.consultar('productos', function (p) { return p.id === Number(productoId); })[0];
    if (!prod) return;

    var carrito = obtenerCarrito();
    var item = carrito.find(function (it) {
      if (talla !== undefined) {
        return it.id === Number(productoId) && String(it.personalizacion || '') === String(talla);
      }
      return it.id === Number(productoId);
    });
    if (!item) return;

    if (item.cantidad >= MAX_POR_PRODUCTO) {
      if (typeof Notificaciones !== 'undefined') {
        Notificaciones.toast('Límite de ' + MAX_POR_PRODUCTO + ' unidades por pieza alcanzado.', 'alerta');
      } else {
        alert('Has alcanzado el límite máximo de ' + MAX_POR_PRODUCTO + ' unidades por pieza.');
      }
      return;
    }

    var stockTallas = typeof MotorSQL !== 'undefined' && typeof MotorSQL.obtenerStockTallas === 'function'
      ? MotorSQL.obtenerStockTallas(prod)
      : (prod.stock_tallas || {});
    var stockTalla = stockTallas[item.personalizacion];
    if (stockTalla === undefined) {
      stockTalla = typeof prod.stock === 'number' ? prod.stock : parseInt(prod.stock, 10) || 0;
    }

    if (item.cantidad >= stockTalla) {
      if (typeof Notificaciones !== 'undefined') {
        Notificaciones.toast('Solo disponemos de ' + stockTalla + ' unidades en talla ' + (item.personalizacion || '') + '.', 'alerta');
      } else {
        alert('Solo disponemos de ' + stockTalla + ' unidades en stock para esta talla.');
      }
      return;
    }

    item.cantidad += 1;
    guardarCarrito(carrito);
  }

  function remover(productoId, talla) {
    if (tienePedidoPendienteActivo()) {
      if (typeof Notificaciones !== 'undefined') {
        Notificaciones.alerta('Tu pedido está en curso y pendiente de validación por el administrador. No puedes modificar los productos del carrito.', 'Pedido en Proceso');
      } else {
        alert('Tu pedido está en curso y pendiente de validación por el administrador.');
      }
      return;
    }
    var carrito = obtenerCarrito().filter(function (it) {
      if (talla !== undefined) {
        return !(it.id === Number(productoId) && String(it.personalizacion || '') === String(talla));
      }
      return it.id !== Number(productoId);
    });
    guardarCarrito(carrito);
  }

  function vaciar(forzar) {
    if (!forzar && tienePedidoPendienteActivo()) {
      if (typeof Notificaciones !== 'undefined') {
        Notificaciones.alerta('Tu pedido está en curso y pendiente de validación por el administrador. No puedes vaciar el carrito.', 'Pedido en Proceso');
      } else {
        alert('Tu pedido está en curso y pendiente de validación.');
      }
      return;
    }
    guardarCarrito([]);
  }

  function calcularTotal() {
    var carrito = obtenerCarrito();
    return carrito.reduce(function (acc, it) {
      var p = Number(it.precio) || 0;
      var c = Number(it.cantidad) || 0;
      return acc + (p * c);
    }, 0);
  }

  function contarItems() {
    var carrito = obtenerCarrito();
    return carrito.reduce(function (acc, it) {
      var c = Number(it.cantidad) || 0;
      return acc + c;
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
    actualizarBadges: actualizarBadges,
    obtenerClaveCarrito: obtenerClaveCarrito
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

  var items = [];
  try {
    items = Cart.items();
  } catch (err) {
    items = [];
  }

  if (!Array.isArray(items) || !items.length) {
    cont.innerHTML =
      '<div class="cart-vacio-box">' +
      '  <div style="margin-bottom:12px;"><svg class="nav-icon-svg" style="width:48px;height:48px;color:var(--gold-primary);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="14" r="7"></circle><path d="M12 7V3m-3 2l6-2m-6 0l6 2"></path></svg></div>' +
      '  <h4>Tu pedido está vacío</h4>' +
      '  <p>Explora nuestras colecciones de anillos de grado, matrimonio y cadenas de acero.</p>' +
      '</div>';
    if (elSubtotalUSD) elSubtotalUSD.textContent = '$0.00';
    if (elSubtotalBs)  elSubtotalBs.textContent  = 'Bs. 0,00';
    if (btnCheckout) {
      btnCheckout.disabled = true;
      btnCheckout.textContent = 'Proceder a Confirmar Compra';
      btnCheckout.title = '';
    }
    return;
  }

  var tienePendiente = false;
  try {
    tienePendiente = (typeof Cart.tienePedidoPendienteActivo === 'function')
      ? Cart.tienePedidoPendienteActivo()
      : (typeof tienePedidoPendienteActivo === 'function' ? tienePedidoPendienteActivo() : false);
  } catch (e) {
    tienePendiente = false;
  }

  var html = '';
  if (tienePendiente) {
    html +=
      '<div style="background:rgba(245,158,11,0.12); border:1px solid #f59e0b; border-radius:8px; padding:10px 12px; margin-bottom:14px; font-size:0.86rem; color:#f59e0b;">' +
      '  <strong>⏳ Pedido en proceso de validación:</strong>' +
      '  <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:3px;">Hasta que el administrador valide tu pago no se puede modificar ni borrar el pedido. Una vez validado, se limpiará el carrito y podrás ordenar nuevas joyas.</div>' +
      '</div>';
  }

  items.forEach(function (it) {
    var numPrecio = Number(it.precio) || 0;
    var numCant = Number(it.cantidad) || 1;
    var precioUnitBs = typeof TasaBCV !== 'undefined' ? TasaBCV.convertirBs(numPrecio) : '';
    var fotoItem = it.imagen || 'logo.png';
    var nombreItem = it.nombre || 'Joya INVERANOLI';
    var presentacionItem = it.presentacion || 'Joyería Fina';

    html +=
      '<div class="cart-item-row">' +
      '  <img src="' + fotoItem + '" alt="' + nombreItem + '" class="cart-item-img" onerror="this.src=\'logo.png\'">' +
      '  <div class="cart-item-details">' +
      '    <div class="cart-item-title">' + nombreItem + '</div>' +
      '    <div class="cart-item-meta">' + presentacionItem + '</div>' +
      (it.personalizacion ? '<div class="cart-item-personalizacion">Talla/Grabado: ' + it.personalizacion + '</div>' : '') +
      '    <div class="cart-item-price">$' + numPrecio.toFixed(2) + (precioUnitBs ? ' <small>(' + precioUnitBs + ')</small>' : '') + '</div>' +
      '    <div class="cart-item-controls">' +
      '      <div class="cart-qty-group">' +
      '        <button type="button" class="cart-qty-btn" ' + (tienePendiente ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : '') + ' onclick="Cart.decrementar(' + it.id + ', \'' + (it.personalizacion || '') + '\')">-</button>' +
      '        <span class="cart-qty-num">' + numCant + '</span>' +
      '        <button type="button" class="cart-qty-btn" ' + (tienePendiente ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : '') + ' onclick="Cart.incrementar(' + it.id + ', \'' + (it.personalizacion || '') + '\')">+</button>' +
      '      </div>' +
      '      <button type="button" class="cart-remove-link" ' + (tienePendiente ? 'style="opacity:0.4; cursor:not-allowed; text-decoration:none;" title="Pedido pendiente de validación"' : '') + ' onclick="Cart.remover(' + it.id + ', \'' + (it.personalizacion || '') + '\')">' + (tienePendiente ? '🔒 Bloqueado' : 'Eliminar') + '</button>' +
      '    </div>' +
      '  </div>' +
      '</div>';
  });

  cont.innerHTML = html;

  var total = 0;
  try {
    total = Cart.calcularTotal();
  } catch (e) {
    total = 0;
  }

  if (elSubtotalUSD) elSubtotalUSD.textContent = '$' + total.toFixed(2);
  if (elSubtotalBs)  elSubtotalBs.textContent  = typeof TasaBCV !== 'undefined' ? TasaBCV.convertirBs(total) : '';
  if (btnCheckout) {
    if (tienePendiente) {
      btnCheckout.disabled = true;
      btnCheckout.textContent = '⏳ En proceso';
      btnCheckout.title = 'Esperando validación del administrador por WhatsApp';
    } else {
      btnCheckout.disabled = false;
      btnCheckout.textContent = 'Completar Pedido Formal ›';
      btnCheckout.title = '';
    }
  }
}
