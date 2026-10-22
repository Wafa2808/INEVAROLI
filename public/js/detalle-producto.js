/**
 * detalle-producto.js — Ficha Técnica, Carrusel de Fotos y Personalización
 * Especializado en especificaciones de joyería (materiales, piedras, tallas y grabado personalizado).
 */

var indiceFotoDetalleActual = 0;
var fotosDetalleActuales = [];
var productoDetalleActual = null;

function abrirDetalleProducto(id) {
  var p = MotorSQL.consultar('productos', function (x) { return x.id === Number(id); })[0];
  if (!p) return;

  productoDetalleActual = p;
  fotosDetalleActuales = (p.imagenes && p.imagenes.length) ? p.imagenes : ['images/anillo_grado.jpg'];
  indiceFotoDetalleActual = 0;

  var modal = document.getElementById('modal-detalle');
  if (!modal) return;

  // Actualizar Foto Principal
  actualizarSlideDetalle();

  // Título y Material
  var elTitulo = document.getElementById('detalle-titulo');
  var elMaterial = document.getElementById('detalle-presentacion');
  var elDesc = document.getElementById('detalle-descripcion');
  var elPiedras = document.getElementById('detalle-piedras');
  var elTallas = document.getElementById('detalle-tallas');
  var elStock = document.getElementById('detalle-stock-badge');

  if (elTitulo) elTitulo.textContent = p.nombre;
  if (elMaterial) elMaterial.textContent = p.presentacion || 'Joyería Fina INVERANOLI';
  if (elDesc) elDesc.textContent = p.descripcion || '';
  if (elPiedras) elPiedras.textContent = p.piedras || 'Sin piedras incrustadas';
  if (elTallas) elTallas.textContent = p.tallas || 'Medida estándar';

  if (elStock) {
    if (p.stock <= 0) {
      elStock.className = 'badge-stock badge-stock-agotado';
      elStock.textContent = 'Agotado Temporalmente';
    } else if (p.stock <= 5) {
      elStock.className = 'badge-stock badge-stock-bajo';
      elStock.textContent = '¡Últimas ' + p.stock + ' unidades en stock!';
    } else {
      elStock.className = 'badge-stock badge-stock-disponible';
      elStock.textContent = 'En Stock (' + p.stock + ' disponibles)';
    }
  }

  // Precios oficiales de joyería (sin promociones de descuento)
  var elDescBadge = document.getElementById('detalle-descuento-badge');
  var elPrecioTachadoBox = document.getElementById('detalle-precio-tachado-box');
  var elPrecio = document.getElementById('detalle-precio');
  var elPrecioBs = document.getElementById('detalle-precio-bs');

  if (elDescBadge) elDescBadge.style.display = 'none';
  if (elPrecioTachadoBox) elPrecioTachadoBox.style.display = 'none';

  var precioFinal = p.precio;

  if (elPrecio) elPrecio.textContent = '$' + precioFinal.toFixed(2);
  if (elPrecioBs && typeof TasaBCV !== 'undefined') {
    elPrecioBs.textContent = TasaBCV.convertirBs(precioFinal);
  }

  // Limpiar campo de personalización de grabado
  var inputGrabado = document.getElementById('detalle-grabado-input');
  if (inputGrabado) inputGrabado.value = '';

  // Configurar Botón Añadir al Pedido
  var btnAdd = document.getElementById('detalle-btn-add');
  if (btnAdd) {
    if (p.stock <= 0) {
      btnAdd.disabled = true;
      btnAdd.textContent = 'Producto Agotado';
      btnAdd.onclick = null;
    } else {
      btnAdd.disabled = false;
      btnAdd.textContent = 'Añadir al Pedido';
      btnAdd.onclick = function () {
        var grabado = inputGrabado ? inputGrabado.value.trim() : '';
        var agregado = Cart.agregar(p.id, 1, grabado);
        if (agregado) {
          cerrarDetalleProducto();
        }
      };
    }
  }

  modal.style.display = 'flex';
}

function cerrarDetalleProducto() {
  var modal = document.getElementById('modal-detalle');
  if (modal) modal.style.display = 'none';
}

function actualizarSlideDetalle() {
  var img = document.getElementById('detalle-img');
  var badge = document.getElementById('modal-carrusel-contador');
  var thumbs = document.getElementById('modal-carrusel-thumbs');

  if (img && fotosDetalleActuales.length) {
    img.src = fotosDetalleActuales[indiceFotoDetalleActual];
  }
  if (badge) {
    badge.textContent = (indiceFotoDetalleActual + 1) + ' / ' + (fotosDetalleActuales.length || 1);
  }

  // Miniaturas
  if (thumbs) {
    thumbs.innerHTML = '';
    fotosDetalleActuales.forEach(function (url, idx) {
      var th = document.createElement('img');
      th.src = url;
      th.className = 'modal-thumb' + (idx === indiceFotoDetalleActual ? ' activa' : '');
      th.onclick = function () {
        indiceFotoDetalleActual = idx;
        actualizarSlideDetalle();
      };
      thumbs.appendChild(th);
    });
  }
}

function moverDetalleCarrusel(dir) {
  if (!fotosDetalleActuales.length) return;
  indiceFotoDetalleActual += dir;
  if (indiceFotoDetalleActual < 0) {
    indiceFotoDetalleActual = fotosDetalleActuales.length - 1;
  } else if (indiceFotoDetalleActual >= fotosDetalleActuales.length) {
    indiceFotoDetalleActual = 0;
  }
  actualizarSlideDetalle();
}

// Modal de Guía de Tallas de Anillos
function abrirGuiaTallasModal() {
  var modal = document.getElementById('modal-guia-tallas');
  if (modal) modal.style.display = 'flex';
}

function cerrarGuiaTallasModal() {
  var modal = document.getElementById('modal-guia-tallas');
  if (modal) modal.style.display = 'none';
}
