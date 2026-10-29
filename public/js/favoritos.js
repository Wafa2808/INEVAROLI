/**
 * favoritos.js — Lista de Deseos / Joyas Favoritas para INVERANOLI
 * Permite a los clientes guardar sus piezas preferidas para graduaciones o bodas.
 */

var Favoritos = (function () {
  'use strict';

  function obtenerUsuarioId() {
    var u = Api.leer('sesion_actual', null);
    return u && u.id ? String(u.id) : 'anonimo';
  }

  function obtenerFavoritos() {
    var todos = Api.leer('favoritos_map', {});
    var uId = obtenerUsuarioId();
    return Array.isArray(todos[uId]) ? todos[uId] : [];
  }

  function guardarFavoritos(lista) {
    var todos = Api.leer('favoritos_map', {});
    var uId = obtenerUsuarioId();
    todos[uId] = lista;
    Api.guardar('favoritos_map', todos);
    actualizarContadorUI();
  }

  function esFavorito(prodId) {
    var list = obtenerFavoritos();
    return list.indexOf(Number(prodId)) !== -1;
  }

  function toggle(prodId, ev) {
    if (ev) {
      ev.stopPropagation();
      ev.preventDefault();
    }
    var id = Number(prodId);
    var list = obtenerFavoritos();
    var idx = list.indexOf(id);

    if (idx === -1) {
      list.push(id);
    } else {
      list.splice(idx, 1);
    }

    guardarFavoritos(list);
    sincronizarBotones(id, idx === -1);
    
    // Si el modal de favoritos está abierto, redibujarlo
    var mod = document.getElementById('modal-favoritos');
    if (mod && mod.style.display === 'flex') {
      renderModalFavoritos();
    }
  }

  function sincronizarBotones(prodId, activo) {
    var btns = document.querySelectorAll('.btn-fav[data-id="' + prodId + '"]');
    btns.forEach(function (btn) {
      if (activo) {
        btn.classList.add('activo');
        btn.setAttribute('title', 'Quitar de favoritos');
      } else {
        btn.classList.remove('activo');
        btn.setAttribute('title', 'Agregar a favoritos');
      }
    });
  }

  function actualizarContadorUI() {
    var list = obtenerFavoritos();
    var badges = document.querySelectorAll('.fav-count-badge');
    badges.forEach(function (b) {
      b.textContent = list.length;
      b.style.display = list.length > 0 ? 'inline-block' : 'none';
    });
  }

  function mostrarModal() {
    var modal = document.getElementById('modal-favoritos');
    if (!modal) return;
    renderModalFavoritos();
    modal.style.display = 'flex';
  }

  function renderModalFavoritos() {
    var cont = document.getElementById('contenido-modal-favoritos');
    if (!cont) return;

    var favIds = obtenerFavoritos();
    if (!favIds.length) {
      cont.innerHTML =
        '<div style="text-align:center; padding:30px 10px;">' +
        '  <div style="font-size:3rem; margin-bottom:12px;">🤍</div>' +
        '  <h3 style="color:#0f172a; margin-bottom:8px;">Tu lista de joyas favoritas está vacía</h3>' +
        '  <p style="color:#64748b; font-size:0.92rem;">Guarda tus anillos de grado, alianzas de boda o cadenas haciendo clic en el corazón de cada pieza.</p>' +
        '</div>';
      return;
    }

    var productos = MotorSQL.consultar('productos');
    var favProds = productos.filter(function (p) {
      return favIds.indexOf(p.id) !== -1;
    });

    var html = '<h3 style="margin-bottom:16px; color:#0f172a;">Mis Joyas Favoritas (' + favProds.length + ')</h3>';
    html += '<div class="fav-lista-grid">';

    favProds.forEach(function (p) {
      var foto = (p.imagenes && p.imagenes.length) ? p.imagenes[0] : 'logo.png';
      var precioBs = typeof TasaBCV !== 'undefined' ? TasaBCV.convertirBs(p.precio) : '';

      html +=
        '<div class="fav-item-card">' +
        '  <img src="' + foto + '" alt="' + p.nombre + '" class="fav-item-img">' +
        '  <div class="fav-item-info">' +
        '    <h4 style="font-size:0.95rem; margin-bottom:4px; color:#0f172a;">' + p.nombre + '</h4>' +
        '    <p style="font-size:0.8rem; color:#b8860b; font-weight:600; margin-bottom:4px;">' + (p.presentacion || '') + '</p>' +
        '    <div style="font-weight:700; color:#0f172a;">Ref. $' + p.precio.toFixed(2) + ' <small style="color:#64748b; font-weight:normal;">(' + precioBs + ')</small></div>' +
        '    <div style="margin-top:8px; display:flex; gap:8px;">' +
        '      <button class="btn btn-sm" onclick="Cart.agregar(' + p.id + ', 1); Favoritos.mostrarModal();">Agregar al Pedido</button>' +
        '      <button class="btn-sm btn-desactivar" onclick="Favoritos.toggle(' + p.id + ');">Quitar</button>' +
        '    </div>' +
        '  </div>' +
        '</div>';
    });

    html += '</div>';
    cont.innerHTML = html;
  }

  return {
    toggle: toggle,
    esFavorito: esFavorito,
    obtenerFavoritos: obtenerFavoritos,
    sincronizarBotones: sincronizarBotones,
    actualizarContadorUI: actualizarContadorUI,
    mostrarModal: mostrarModal,
    renderModalFavoritos: renderModalFavoritos
  };
})();
