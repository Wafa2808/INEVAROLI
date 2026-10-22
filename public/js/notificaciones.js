/**
 * notificaciones.js — Sistema de Alertas, Toasts, Confirmaciones y Prompts en Página
 * Reemplaza los popups nativos del navegador por modales y avisos de lujo en la interfaz.
 */

var Notificaciones = (function () {
  'use strict';

  // Contenedor de Toasts
  function asegurarContenedorToasts() {
    var cont = document.getElementById('inveranoli-toasts-container');
    if (!cont) {
      cont = document.createElement('div');
      cont.id = 'inveranoli-toasts-container';
      cont.className = 'toasts-container';
      document.body.appendChild(cont);
    }
    return cont;
  }

  // Notificación Toast flotante
  function toast(mensaje, tipo, duracionMs) {
    var cont = asegurarContenedorToasts();
    var t = document.createElement('div');
    var tipoClase = tipo || 'exito'; // 'exito', 'error', 'aviso', 'info'
    var duracion = duracionMs || 3500;

    var icono = '<svg class="nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    if (tipoClase === 'error') icono = '<svg class="nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    if (tipoClase === 'aviso' || tipoClase === 'alerta') icono = '<svg class="nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>';
    if (tipoClase === 'info')  icono = '<svg class="nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';

    t.className = 'toast-item toast-' + tipoClase;
    t.innerHTML =
      '<span class="toast-icono">' + icono + '</span>' +
      '<div class="toast-cuerpo">' + mensaje.replace(/\n/g, '<br>') + '</div>' +
      '<button type="button" class="toast-cerrar" onclick="this.parentElement.remove()">×</button>';

    cont.appendChild(t);

    setTimeout(function () {
      t.classList.add('visible');
    }, 10);

    setTimeout(function () {
      t.classList.remove('visible');
      setTimeout(function () {
        if (t.parentElement) t.remove();
      }, 300);
    }, duracion);
  }

  // Modal de Alerta personalizada (reemplazo de alert)
  function alerta(mensaje, titulo, callback) {
    var modal = document.getElementById('inveranoli-custom-modal');
    if (!modal) {
      modal = crearModalDialogo();
    }

    var elTitulo = document.getElementById('custom-dialog-title');
    var elMensaje = document.getElementById('custom-dialog-message');
    var elInputBox = document.getElementById('custom-dialog-input-box');
    var quickBox = document.getElementById('custom-dialog-quick-box');
    var btnOk = document.getElementById('custom-dialog-btn-ok');
    var btnCancel = document.getElementById('custom-dialog-btn-cancel');

    if (elTitulo) elTitulo.textContent = titulo || 'INVERANOLI Joyería';
    if (elMensaje) elMensaje.innerHTML = String(mensaje || '').replace(/\n/g, '<br>');
    if (elInputBox) elInputBox.style.display = 'none';
    if (quickBox) quickBox.style.display = 'none';
    if (btnCancel) btnCancel.style.display = 'none';

    btnOk.textContent = 'Aceptar';
    btnOk.onclick = function () {
      modal.style.display = 'none';
      modal.classList.remove('visible');
      if (typeof callback === 'function') callback();
    };

    modal.style.display = 'flex';
    modal.style.opacity = '1';
    modal.classList.add('visible');
    btnOk.focus();
  }

  // Modal de Confirmación personalizada (reemplazo de confirm)
  function confirmar(mensaje, titulo, onConfirmar, onCancelar) {
    var modal = document.getElementById('inveranoli-custom-modal');
    if (!modal) {
      modal = crearModalDialogo();
    }

    var elTitulo = document.getElementById('custom-dialog-title');
    var elMensaje = document.getElementById('custom-dialog-message');
    var elInputBox = document.getElementById('custom-dialog-input-box');
    var quickBox = document.getElementById('custom-dialog-quick-box');
    var btnOk = document.getElementById('custom-dialog-btn-ok');
    var btnCancel = document.getElementById('custom-dialog-btn-cancel');

    if (elTitulo) elTitulo.textContent = titulo || 'Confirmación Requerida';
    if (elMensaje) elMensaje.innerHTML = String(mensaje || '').replace(/\n/g, '<br>');
    if (elInputBox) elInputBox.style.display = 'none';
    if (quickBox) quickBox.style.display = 'none';
    if (btnCancel) btnCancel.style.display = 'inline-flex';

    btnOk.textContent = 'Confirmar';
    btnOk.onclick = function () {
      modal.style.display = 'none';
      modal.classList.remove('visible');
      if (typeof onConfirmar === 'function') onConfirmar();
    };

    btnCancel.textContent = 'Cancelar';
    btnCancel.onclick = function () {
      modal.style.display = 'none';
      modal.classList.remove('visible');
      if (typeof onCancelar === 'function') onCancelar();
    };

    modal.style.display = 'flex';
    modal.style.opacity = '1';
    modal.classList.add('visible');
    btnOk.focus();
  }

  // Modal de Entrada de Datos (reemplazo de prompt)
  function prompt(mensaje, titulo, valorInicial, onAceptar, onCancelar, tipoInput) {
    var modal = document.getElementById('inveranoli-custom-modal');
    if (!modal) {
      modal = crearModalDialogo();
    }

    var elTitulo = document.getElementById('custom-dialog-title');
    var elMensaje = document.getElementById('custom-dialog-message');
    var elInputBox = document.getElementById('custom-dialog-input-box');
    var quickBox = document.getElementById('custom-dialog-quick-box');
    var inTexto = document.getElementById('custom-dialog-input');
    var btnOk = document.getElementById('custom-dialog-btn-ok');
    var btnCancel = document.getElementById('custom-dialog-btn-cancel');

    if (elTitulo) elTitulo.textContent = titulo || 'Ingreso de Información';
    if (elMensaje) elMensaje.innerHTML = String(mensaje || '').replace(/\n/g, '<br>');
    if (elInputBox) elInputBox.style.display = 'block';

    var esNumero = (tipoInput === 'number');
    if (inTexto) {
      inTexto.type = esNumero ? 'number' : 'text';
      inTexto.value = (valorInicial !== undefined && valorInicial !== null) ? valorInicial : '';
      inTexto.placeholder = esNumero ? 'Ejemplo: 10' : 'Escribe aquí...';
    }

    if (quickBox) {
      quickBox.style.display = esNumero ? 'flex' : 'none';
    }

    if (btnCancel) btnCancel.style.display = 'inline-flex';
    btnOk.textContent = 'Aceptar';

    btnOk.onclick = function () {
      var val = inTexto ? inTexto.value : '';
      modal.style.display = 'none';
      modal.classList.remove('visible');
      if (typeof onAceptar === 'function') onAceptar(val);
    };

    btnCancel.textContent = 'Cancelar';
    btnCancel.onclick = function () {
      modal.style.display = 'none';
      modal.classList.remove('visible');
      if (typeof onCancelar === 'function') onCancelar();
    };

    // Permitir enviar con Enter o cancelar con Escape
    if (inTexto) {
      inTexto.onkeydown = function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          btnOk.click();
        } else if (e.key === 'Escape') {
          modal.style.display = 'none';
          modal.classList.remove('visible');
        }
      };
    }

    modal.style.display = 'flex';
    modal.style.opacity = '1';
    modal.classList.add('visible');

    setTimeout(function () {
      if (inTexto) {
        inTexto.focus();
        inTexto.select();
      }
    }, 60);
  }

  function setValorInput(val) {
    var inTexto = document.getElementById('custom-dialog-input');
    if (inTexto) {
      inTexto.value = String(val);
      inTexto.focus();
    }
  }

  function crearModalDialogo() {
    var m = document.getElementById('inveranoli-custom-modal');
    if (m) return m;

    m = document.createElement('div');
    m.id = 'inveranoli-custom-modal';
    m.className = 'modal-fondo custom-dialog-fondo visible';
    m.style.display = 'none';
    m.style.zIndex = '100000';
    m.style.opacity = '1';

    m.innerHTML =
      '<div class="modal-caja custom-dialog-caja">' +
      '  <button type="button" class="modal-cerrar" onclick="document.getElementById(\'inveranoli-custom-modal\').style.display=\'none\'" title="Cerrar ventana">×</button>' +
      '  <div class="custom-dialog-icono"><svg class="nav-icon-svg" style="width:28px;height:28px;color:var(--gold-primary);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="6 3 18 3 22 9 12 22 2 9"></polygon></svg></div>' +
      '  <h3 id="custom-dialog-title" class="custom-dialog-titulo">INVERANOLI Joyería</h3>' +
      '  <div id="custom-dialog-message" class="custom-dialog-mensaje"></div>' +
      '  <div id="custom-dialog-input-box" class="custom-dialog-input-box" style="display:none;">' +
      '    <input type="text" id="custom-dialog-input" class="custom-dialog-input" autocomplete="off">' +
      '    <div id="custom-dialog-quick-box" class="custom-dialog-quick-buttons" style="display:none;">' +
      '      <button type="button" class="custom-dialog-quick-btn" onclick="Notificaciones.setValorInput(5)">+5</button>' +
      '      <button type="button" class="custom-dialog-quick-btn" onclick="Notificaciones.setValorInput(10)">+10</button>' +
      '      <button type="button" class="custom-dialog-quick-btn" onclick="Notificaciones.setValorInput(25)">+25</button>' +
      '      <button type="button" class="custom-dialog-quick-btn" onclick="Notificaciones.setValorInput(50)">+50</button>' +
      '    </div>' +
      '  </div>' +
      '  <div class="custom-dialog-actions">' +
      '    <button type="button" id="custom-dialog-btn-cancel" class="btn btn-sm btn-detalle" style="display:none;">Cancelar</button>' +
      '    <button type="button" id="custom-dialog-btn-ok" class="btn btn-sm btn-auth-primary">Aceptar</button>' +
      '  </div>' +
      '</div>';

    document.body.appendChild(m);
    return m;
  }

  // Interceptar alerts y confirms del navegador para que usen nuestro modal de lujo
  if (typeof window !== 'undefined') {
    window.customAlert = alerta;
    window.customConfirm = confirmar;
    window.customPrompt = prompt;
    window.customToast = toast;
  }

  return {
    toast: toast,
    alerta: alerta,
    confirmar: confirmar,
    prompt: prompt,
    setValorInput: setValorInput
  };
})();
