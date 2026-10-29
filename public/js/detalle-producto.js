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
  if (p.activo === false) {
    if (typeof Notificaciones !== 'undefined') {
      Notificaciones.alerta('Esta joya se encuentra temporalmente fuera de catálogo o pausada.', 'Joya Pausada');
    }
    return;
  }

  productoDetalleActual = p;
  fotosDetalleActuales = (p.imagenes && p.imagenes.length) ? p.imagenes : ['logo.png'];
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
  var elSpecsMat = document.getElementById('detalle-specs-material');
  var elStock = document.getElementById('detalle-stock-badge');

  if (elTitulo) elTitulo.textContent = p.nombre;
  if (elMaterial) elMaterial.textContent = p.presentacion || 'Joyería Fina INVERANOLI';
  if (elSpecsMat) elSpecsMat.textContent = p.presentacion || 'Plata Ley 925 / Acero 316L';
  if (elDesc) elDesc.textContent = p.descripcion || '';
  if (elPiedras) elPiedras.textContent = p.piedras || 'Sin piedras incrustadas';

  // Obtener diccionario de stock segmentado por talla
  var stockTallas = obtenerStockTallasProducto(p);
  var selTalla = document.getElementById('detalle-talla-select');
  if (selTalla) {
    selTalla.innerHTML = '';
    var tallasDisponibles = Object.keys(stockTallas);
    tallasDisponibles.forEach(function (t) {
      var cant = stockTallas[t];
      var opt = document.createElement('option');
      opt.value = t;
      opt.textContent = (t === 'Estándar' ? 'Medida Única Estándar' : 'Talla ' + t) + ' (' + cant + ' disp.)';
      if (cant <= 0) {
        opt.disabled = true;
        opt.textContent += ' - AGOTADO';
      }
      selTalla.appendChild(opt);
    });
  }

  // Precios oficiales de joyería
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

  actualizarStockTallaSeleccionada();

  modal.style.display = 'flex';
}

// Analiza y extrae las tallas y su stock segmentado para el producto
function obtenerStockTallasProducto(p) {
  if (typeof MotorSQL !== 'undefined' && typeof MotorSQL.obtenerStockTallas === 'function') {
    return MotorSQL.obtenerStockTallas(p);
  }
  if (p.stock_tallas && typeof p.stock_tallas === 'object') {
    return p.stock_tallas;
  }
  return { 'Estándar': p.stock || 5 };
}

// Actualiza el indicador de stock según la talla elegida en el modal
function actualizarStockTallaSeleccionada() {
  if (!productoDetalleActual) return;
  var p = MotorSQL.consultar('productos', function (x) { return x.id === Number(productoDetalleActual.id); })[0] || productoDetalleActual;
  productoDetalleActual = p;
  var selTalla = document.getElementById('detalle-talla-select');
  var stockInfo = document.getElementById('detalle-talla-stock-info');
  var elStock = document.getElementById('detalle-stock-badge');
  var btnAdd = document.getElementById('detalle-btn-add');

  var stockTallas = obtenerStockTallasProducto(p);
  var tallaElegida = selTalla ? selTalla.value : Object.keys(stockTallas)[0];
  var stockTalla = (tallaElegida && stockTallas[tallaElegida] !== undefined) ? stockTallas[tallaElegida] : 0;

  if (stockInfo) {
    if (stockTalla > 0) {
      stockInfo.textContent = stockTalla + ' unidades disponibles';
      stockInfo.style.color = '#10b981';
    } else {
      stockInfo.textContent = 'Agotado en esta talla';
      stockInfo.style.color = '#ef4444';
    }
  }

  if (elStock) {
    if (stockTalla <= 0) {
      elStock.className = 'badge-stock badge-stock-agotado';
      elStock.textContent = 'Talla Agotada';
    } else if (stockTalla <= 2) {
      elStock.className = 'badge-stock badge-stock-bajo';
      elStock.textContent = '¡Últimas ' + stockTalla + ' piezas!';
    } else {
      elStock.className = 'badge-stock badge-stock-disponible';
      elStock.textContent = stockTalla + ' disp. en talla';
    }
  }

  if (btnAdd) {
    if (stockTalla <= 0) {
      btnAdd.disabled = true;
      btnAdd.textContent = 'Talla Seleccionada Agotada';
      btnAdd.onclick = null;
    } else {
      btnAdd.disabled = false;
      btnAdd.textContent = 'Añadir al Carrito (Talla: ' + tallaElegida + ')';
      btnAdd.onclick = function () {
        var agregado = Cart.agregar(p.id, 1, tallaElegida);
        if (agregado) {
          cerrarDetalleProducto();
        }
      };
    }
  }
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
