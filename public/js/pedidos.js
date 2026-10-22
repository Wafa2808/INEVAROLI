/**
 * pedidos.js — Historial de Pedidos del Cliente con Consultas JOIN Relacionales
 * Muestra el seguimiento y compras realizadas por el usuario actual en INEVAROLI.
 */

function mostrarPedidosModal() {
  var modal = document.getElementById('modal-pedidos');
  var cont = document.getElementById('contenido-modal-pedidos');
  if (!modal || !cont) return;

  var usuario = Api.leer('sesion_actual', null);
  if (!usuario) {
    if (typeof Notificaciones !== 'undefined') {
      Notificaciones.alerta('Debes iniciar sesión o registrarte para consultar tu historial de pedidos.', 'Acceso Requerido');
    } else {
      alert('Debes iniciar sesión para consultar tu historial de pedidos.');
    }
    if (typeof abrirAuthModal === 'function') abrirAuthModal('login');
    return;
  }

  // Consulta JOIN relacional mediante MotorSQL
  var ordenes = MotorSQL.consultarOrdenesConDetalle(usuario.id);

  if (!ordenes.length) {
    cont.innerHTML =
      '<div style="text-align:center; padding:30px 10px;">' +
      '  <div style="margin-bottom:12px;"><svg class="nav-icon-svg" style="width:48px;height:48px;color:var(--gold-primary);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg></div>' +
      '  <h3 style="color:var(--gold-light); margin-bottom:8px;">Aún no tienes pedidos registrados</h3>' +
      '  <p style="color:var(--text-muted); font-size:0.92rem;">Cuando confirmes un pedido de anillos de grado, matrimonio o joyas, aparecerá detallado en este panel.</p>' +
      '</div>';
    modal.style.display = 'flex';
    return;
  }

  var html = '<h3 style="margin-bottom:16px; color:var(--gold-light);">Mis Pedidos de Joyería (' + ordenes.length + ')</h3>';
  html += '<div class="pedidos-lista-wrap">';

  // Ordenar de más reciente a más antiguo
  ordenes.slice().reverse().forEach(function (ord) {
    var estadoBadge = '';
    var est = ord.estado || 'recibido';
    if (est === 'recibido') {
      estadoBadge = '<span class="badge-estado badge-recibido">Recibido</span>';
    } else if (est === 'preparacion') {
      estadoBadge = '<span class="badge-estado badge-preparacion">En Taller / Ajuste de Talla</span>';
    } else if (est === 'camino') {
      estadoBadge = '<span class="badge-estado badge-camino">En Camino / Listo para Entrega</span>';
    } else if (est === 'entregado') {
      estadoBadge = '<span class="badge-estado badge-entregado">Entregado</span>';
    }

    var totalBs = typeof TasaBCV !== 'undefined' ? TasaBCV.convertirBs(ord.total) : '';

    html +=
      '<div class="pedido-card-item">' +
      '  <div class="pedido-card-header">' +
      '    <div>' +
      '      <strong style="color:#ffffff;">Orden #' + ord.id + '</strong>' +
      '      <span style="color:var(--text-muted); font-size:0.85rem; margin-left:8px;">' + ord.fecha + '</span>' +
      '    </div>' +
      '    <div>' + estadoBadge + '</div>' +
      '  </div>' +
      '  <div class="pedido-card-body">';

    ord.detalles.forEach(function (d) {
      html +=
        '<div class="pedido-linea-producto">' +
        '  <div>' +
        '    <span style="font-weight:600; color:#ffffff;">' + d.nombre + '</span> × ' + d.cantidad + '<br>' +
        '    <small style="color:var(--gold-primary);">' + (d.presentacion || '') + (d.personalizacion ? ' · Grabado: ' + d.personalizacion : '') + '</small>' +
        '  </div>' +
        '  <div style="font-weight:600; color:#ffffff;">' +
        '    $' + (d.cantidad * d.precio_unitario).toFixed(2) +
        '  </div>' +
        '</div>';
    });

    html +=
      '  </div>' +
      '  <div class="pedido-card-footer">' +
      '    <div style="font-size:0.88rem; color:var(--text-muted);">' +
      '      <strong style="color:var(--gold-light);">Despacho:</strong> ' + (ord.despacho || 'Retiro en Tienda') +
      '    </div>' +
      '    <div style="text-align:right;">' +
      '      <strong style="font-size:1.1rem; color:var(--gold-light);">Total: $' + ord.total.toFixed(2) + '</strong><br>' +
      '      <small style="color:#f59e0b; font-weight:700;">' + totalBs + '</small>' +
      '    </div>' +
      '  </div>' +
      '</div>';
  });

  html += '</div>';
  cont.innerHTML = html;
  modal.style.display = 'flex';
}
