/**
 * checkout.js — Flujo de Compra Completo en 4 Pasos para INEVAROLI
 * 1. Resumen de la Orden (USD y Bs BCV)
 * 2. Despacho (Retiro en Tienda CC Gran Bazar o Envíos Zoom/MRW/Tealca a nivel nacional)
 * 3. Métodos de Pago Venezolanos (Pago Móvil, Transferencia, Efectivo en Tienda, Zelle)
 * 4. Confirmación, Descuento Atómico de Stock, Guardado en BD y WhatsApp oficial
 */

var Checkout = (function () {
  'use strict';

  var pasoActual = 1;
  var datosOrden = {
    tipoDespacho: 'tienda',
    destinatario: '',
    cedula: '',
    telefono: '',
    estadoVzla: 'Carabobo',
    ciudad: 'Valencia',
    direccion: '',
    agenciaEnvio: 'Retiro en Tienda CC Gran Bazar',
    metodoPago: 'pago_movil',
    referenciaPago: '',
    totalUSD: 0,
    totalBs: ''
  };

  function abrirModal() {
    var items = Cart.items();
    if (!items.length) {
      if (typeof Notificaciones !== 'undefined') {
        Notificaciones.alerta('Tu pedido está vacío. Agrega joyas al catálogo antes de proceder al checkout.', 'Pedido Vacío');
      } else {
        alert('Tu pedido está vacío. Agrega joyas al carrito antes de proceder al checkout.');
      }
      return;
    }

    var usuario = Api.leer('sesion_actual', null);
    if (!usuario) {
      if (typeof Notificaciones !== 'undefined') {
        Notificaciones.alerta('Debes iniciar sesión o registrarte como cliente para confirmar tu compra.', 'Sesión Requerida');
      } else {
        alert('Debes iniciar sesión para confirmar tu compra.');
      }
      if (typeof abrirAuthModal === 'function') abrirAuthModal('login');
      return;
    }

    // Precargar datos del usuario
    datosOrden.destinatario = (usuario.nombre || '') + ' ' + (usuario.apellido || '');
    datosOrden.cedula = usuario.cedula || '';
    datosOrden.telefono = usuario.telefono || '';

    cerrarDrawerCarrito();
    irAPaso(1);

    var modal = document.getElementById('modal-checkout');
    if (modal) modal.style.display = 'flex';
  }

  function cerrarModal() {
    var modal = document.getElementById('modal-checkout');
    if (modal) modal.style.display = 'none';
  }

  function irAPaso(paso) {
    pasoActual = paso;

    // Actualizar barra de progreso visual
    for (var i = 1; i <= 4; i++) {
      var stepIndicator = document.getElementById('checkout-step-pill-' + i);
      var stepPanel = document.getElementById('checkout-panel-paso-' + i);
      if (stepIndicator) {
        stepIndicator.classList.toggle('activo', i === paso);
        stepIndicator.classList.toggle('completado', i < paso);
      }
      if (stepPanel) {
        stepPanel.style.display = (i === paso) ? 'block' : 'none';
      }
    }

    if (paso === 1) renderPaso1();
    if (paso === 2) renderPaso2();
    if (paso === 3) renderPaso3();
    if (paso === 4) renderPaso4();
  }

  // ─── Paso 1: Resumen de Joyas ───
  function renderPaso1() {
    var cont = document.getElementById('checkout-resumen-items');
    var elTotalUSD = document.getElementById('checkout-resumen-total-usd');
    var elTotalBs  = document.getElementById('checkout-resumen-total-bs');
    if (!cont) return;

    var items = Cart.items();
    var html = '';
    var total = 0;

    items.forEach(function (it) {
      var sub = it.precio * it.cantidad;
      total += sub;
      var subBs = typeof TasaBCV !== 'undefined' ? TasaBCV.convertirBs(sub) : '';

      html +=
        '<div class="checkout-item-line">' +
        '  <div>' +
        '    <strong>' + it.nombre + '</strong> × ' + it.cantidad + '<br>' +
        '    <small style="color:#64748b;">' + (it.presentacion || '') + (it.personalizacion ? ' · Grabado: ' + it.personalizacion : '') + '</small>' +
        '  </div>' +
        '  <div style="text-align:right;">' +
        '    <strong>$' + sub.toFixed(2) + '</strong><br>' +
        '    <small style="color:#b8860b;">' + subBs + '</small>' +
        '  </div>' +
        '</div>';
    });

    cont.innerHTML = html;
    datosOrden.totalUSD = total;
    datosOrden.totalBs = typeof TasaBCV !== 'undefined' ? TasaBCV.convertirBs(total) : '';

    if (elTotalUSD) elTotalUSD.textContent = '$' + total.toFixed(2);
    if (elTotalBs)  elTotalBs.textContent  = datosOrden.totalBs;
  }

  // ─── Paso 2: Despacho / Retiro ───
  function renderPaso2() {
    var inNombre = document.getElementById('checkout-nombre');
    var inCedula = document.getElementById('checkout-cedula');
    var inTel    = document.getElementById('checkout-telefono');

    if (inNombre && !inNombre.value) inNombre.value = datosOrden.destinatario;
    if (inCedula && !inCedula.value) inCedula.value = datosOrden.cedula;
    if (inTel && !inTel.value)       inTel.value = datosOrden.telefono;

    toggleOpcionesEnvio();
  }

  function toggleOpcionesEnvio() {
    var tipo = document.querySelector('input[name="checkout_tipo_despacho"]:checked');
    var boxEnvio = document.getElementById('checkout-campos-envio-nacional');
    if (tipo && boxEnvio) {
      boxEnvio.style.display = (tipo.value === 'envio') ? 'block' : 'none';
      datosOrden.tipoDespacho = tipo.value;
    }
  }

  function validarPaso2() {
    var inNombre = document.getElementById('checkout-nombre');
    var inCedula = document.getElementById('checkout-cedula');
    var inTel    = document.getElementById('checkout-telefono');

    if (!inNombre || inNombre.value.trim().length < 3) {
      if (typeof Notificaciones !== 'undefined') {
        Notificaciones.alerta('Ingresa el nombre y apellido del destinatario.', 'Dato Requerido');
      } else {
        alert('Ingresa el nombre y apellido del destinatario.');
      }
      return false;
    }
    if (!inCedula || !esCedulaValida(inCedula.value.trim())) {
      if (typeof Notificaciones !== 'undefined') {
        Notificaciones.alerta('Ingresa una cédula de identidad válida (7 u 8 dígitos).', 'Cédula Inválida');
      } else {
        alert('Ingresa una cédula de identidad válida (7 u 8 dígitos).');
      }
      return false;
    }
    if (!inTel || inTel.value.trim().length < 10) {
      if (typeof Notificaciones !== 'undefined') {
        Notificaciones.alerta('Ingresa un número telefónico de contacto válido (+58).', 'Teléfono Inválido');
      } else {
        alert('Ingresa un número telefónico de contacto válido.');
      }
      return false;
    }

    datosOrden.destinatario = inNombre.value.trim();
    datosOrden.cedula = inCedula.value.trim();
    datosOrden.telefono = inTel.value.trim();

    if (datosOrden.tipoDespacho === 'envio') {
      var inEstado = document.getElementById('checkout-estado-vzla');
      var inCiudad = document.getElementById('checkout-ciudad');
      var inDir    = document.getElementById('checkout-direccion');
      var inAgen   = document.getElementById('checkout-agencia');

      if (!inDir || inDir.value.trim().length < 6) {
        if (typeof Notificaciones !== 'undefined') {
          Notificaciones.alerta('Ingresa la dirección detallada o agencia receptora (Zoom / MRW / Tealca).', 'Dirección Incompleta');
        } else {
          alert('Ingresa la dirección detallada o agencia receptora (Zoom / MRW / Tealca).');
        }
        return false;
      }

      datosOrden.estadoVzla = inEstado ? inEstado.value : 'Carabobo';
      datosOrden.ciudad = inCiudad ? inCiudad.value.trim() : 'Valencia';
      datosOrden.direccion = inDir.value.trim();
      datosOrden.agenciaEnvio = inAgen ? inAgen.value : 'MRW';
    } else {
      datosOrden.agenciaEnvio = 'Retiro en Tienda Física (CC Gran Bazar, Valencia)';
      datosOrden.direccion = 'Av. Lara, CC Gran Bazar, Planta Baja, Valencia';
    }

    irAPaso(3);
    return true;
  }

  // ─── Paso 3: Métodos de Pago ───
  function renderPaso3() {
    var selectMetodo = document.getElementById('checkout-select-pago');
    var contDatos = document.getElementById('checkout-datos-pago-box');
    if (!selectMetodo || !contDatos) return;

    var esEnvioNacional = (datosOrden.tipoDespacho === 'envio');

    // Validación estricta: Si es envío nacional (MRW/Zoom/Tealca/Domesa), no se permite Efectivo Divisas
    var opcionesHtml = '';
    opcionesHtml += '<option value="pago_movil">Pago Móvil Interbancario (Tasa Oficial BCV)</option>';
    opcionesHtml += '<option value="transferencia">Transferencia Bancaria Nacional (Banesco / BDV)</option>';
    if (!esEnvioNacional) {
      opcionesHtml += '<option value="efectivo">Efectivo en Tienda / Contra Entrega (USD o Bs)</option>';
    }

    selectMetodo.innerHTML = opcionesHtml;

    // Si estaba seleccionado efectivo pero es envío nacional, cambiar a pago móvil
    if (esEnvioNacional && datosOrden.metodoPago === 'efectivo') {
      datosOrden.metodoPago = 'pago_movil';
    }

    selectMetodo.value = datosOrden.metodoPago || 'pago_movil';
    actualizarDetalleMetodoPago();
  }

  function actualizarDetalleMetodoPago() {
    var selectMetodo = document.getElementById('checkout-select-pago');
    var contDatos = document.getElementById('checkout-datos-pago-box');
    if (!selectMetodo || !contDatos) return;

    var metodoId = selectMetodo.value;
    datosOrden.metodoPago = metodoId;

    var metodos = INEVAROLI_CONFIG.metodos_pago || [];
    var met = metodos.find(function (m) { return m.id === metodoId; });

    if (met) {
      var h = '<div class="pago-detalle-card">';
      h += '<h4>' + met.label + '</h4>';
      if (met.banco) h += '<p><strong>Banco:</strong> ' + met.banco + '</p>';
      if (met.telefono) h += '<p><strong>Teléfono / Pago Móvil:</strong> ' + met.telefono + '</p>';
      if (met.ci) h += '<p><strong>Cédula / RIF:</strong> ' + met.ci + '</p>';
      if (met.cuenta) h += '<p><strong>Cuenta:</strong> ' + met.cuenta + '</p>';
      if (met.titular) h += '<p><strong>Titular:</strong> ' + met.titular + '</p>';
      if (met.datos) h += '<p>' + met.datos + '</p>';
      h += '<p class="pago-instruccion">' + met.instruccion + '</p>';
      h += '</div>';
      contDatos.innerHTML = h;
    }
  }

  function validarPaso3() {
    var selectMetodo = document.getElementById('checkout-select-pago');
    var metodoId = selectMetodo ? selectMetodo.value : datosOrden.metodoPago;
    datosOrden.metodoPago = metodoId;

    // Validación: MRW o ZOOM no permiten Efectivo Divisa
    if (datosOrden.tipoDespacho === 'envio' && metodoId === 'efectivo') {
      if (typeof Notificaciones !== 'undefined') {
        Notificaciones.alerta('Para envíos nacionales (MRW / Zoom / Tealca) no se permite Efectivo Divisa. Por favor selecciona Pago Móvil o Transferencia Bancaria.', 'Método No Válido para Envíos');
      } else {
        alert('Para envíos nacionales no se permite Efectivo Divisa.');
      }
      return false;
    }

    datosOrden.referenciaPago = ''; // Se valida directamente vía WhatsApp
    irAPaso(4);
    return true;
  }

  // ─── Paso 4: Confirmación Final ───
  function renderPaso4() {
    var cont = document.getElementById('checkout-confirmacion-box');
    if (!cont) return;

    var items = Cart.items();
    var numOrden = 'INV-' + Math.floor(100000 + Math.random() * 900000);
    datosOrden.idOrden = numOrden;

    var metodoLabel = datosOrden.metodoPago === 'pago_movil' ? 'Pago Móvil (BCV)' : (datosOrden.metodoPago === 'transferencia' ? 'Transferencia Bancaria' : 'Efectivo en Tienda ($ USD)');

    var html =
      '<div class="confirmacion-card" style="background:#090e1a; border:1.5px solid var(--gold-primary); color:#ffffff; padding:18px; border-radius:8px;">' +
      '  <div style="text-align:center; margin-bottom:14px;">' +
      '    <span class="badge-confirmado" style="background:#10b981; color:#ffffff; padding:4px 10px; border-radius:4px; font-weight:800;">ORDEN LISTA PARA PROCESAR</span>' +
      '    <h3 style="margin-top:10px; color:var(--gold-light); font-size:1.35rem;">Pedido #' + numOrden + '</h3>' +
      '    <p style="color:#94a3b8; font-size:0.9rem;">INEVAROLI Joyería — CC Gran Bazar Valencia (@inveranoli2017)</p>' +
      '  </div>' +
      '  <div class="confirmacion-grid" style="color:#ffffff; font-size:0.92rem; line-height:1.6;">' +
      '    <div><strong style="color:var(--gold-light);">👤 Destinatario:</strong> ' + datosOrden.destinatario + ' (C.I. ' + datosOrden.cedula + ')</div>' +
      '    <div><strong style="color:var(--gold-light);">📱 Contacto:</strong> ' + datosOrden.telefono + '</div>' +
      '    <div><strong style="color:var(--gold-light);">📍 Despacho:</strong> ' + (datosOrden.tipoDespacho === 'tienda' ? 'Retiro en Tienda Física (CC Gran Bazar Valencia)' : 'Envío Nacional por ' + datosOrden.agenciaEnvio + ' (' + datosOrden.ciudad + ', ' + datosOrden.estadoVzla + ')') + '</div>' +
      '    <div><strong style="color:var(--gold-light);">💳 Modalidad de Pago:</strong> ' + metodoLabel + ' <em style="color:#38bdf8;">(Comprobante se envía por WhatsApp)</em></div>' +
      '    <div style="font-size:1.2rem; margin-top:10px; color:#f59e0b; font-weight:800;">' +
      '      <strong>Total a Cancelar: $' + datosOrden.totalUSD.toFixed(2) + '</strong> (' + datosOrden.totalBs + ')' +
      '    </div>' +
      '  </div>' +
      '  <p style="margin-top:14px; font-size:0.86rem; color:#94a3b8;">Al presionar <strong>"Confirmar y Enviar por WhatsApp"</strong> se generará tu orden en estado <span style="color:#10b981; font-weight:bold;">Recibido</span> y se abrirá WhatsApp con el resumen comercial para que adjuntes tu captura de pago y coordinemos la entrega.</p>' +
      '</div>';

    cont.innerHTML = html;
  }

  // Procesar orden, guardar en MotorSQL y abrir WhatsApp intuitivo y profesional
  function procesarOrdenFinal() {
    var items = Cart.items();
    if (!items.length) return alert('No hay joyas en el pedido.');

    var usuario = Api.leer('sesion_actual', null);
    if (!usuario) return alert('Sesión no encontrada.');

    // 1. Validar que todavía haya stock suficiente
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var prod = MotorSQL.consultar('productos', function (p) { return p.id === item.id; })[0];
      if (!prod || prod.stock < item.cantidad) {
        alert('Disculpa, el stock de "' + item.nombre + '" acaba de variar. Por favor revisa tu carrito.');
        return;
      }
    }

    // 2. Transacción Atómica: Guardar Orden
    var ordenId = datosOrden.idOrden || ('INV-' + Date.now());
    var fechaStr = new Date().toLocaleString('es-VE');

    MotorSQL.insertar('ordenes', {
      id: ordenId,
      usuario_id: usuario.id,
      fecha: fechaStr,
      total: datosOrden.totalUSD,
      metodo_pago: datosOrden.metodoPago,
      despacho: datosOrden.agenciaEnvio,
      estado: 'recibido'
    });

    // 3. Guardar Detalle de la Orden (El stock se mantiene hasta que pase a "En Taller / Ajuste")
    items.forEach(function (it) {
      MotorSQL.insertar('detalle_ordenes', {
        orden_id: ordenId,
        producto_id: it.id,
        cantidad: it.cantidad,
        precio_unitario: it.precio,
        personalizacion: it.personalizacion || ''
      });
    });

    // 4. Sincronizar catálogo
    if (typeof renderProductos === 'function') renderProductos();
    if (typeof renderAdminTabla === 'function') renderAdminTabla();

    // 5. Construir Mensaje de WhatsApp Altamente Intuitivo y Profesional
    var metodoTexto = datosOrden.metodoPago === 'pago_movil' ? 'Pago Móvil (Tasa Oficial BCV)' : (datosOrden.metodoPago === 'transferencia' ? 'Transferencia Bancaria Nacional' : 'Efectivo en Tienda ($ USD / Bs)');

    var waTexto = '✨ *SOLICITUD DE PEDIDO FORMAL — INEVAROLI JOYERÍA* ✨\n';
    waTexto += '💎 *@inveranoli2017* • Valencia, Edo. Carabobo\n';
    waTexto += '───────────────────────────\n';
    waTexto += '📋 *ORDEN WEB N°:* #' + ordenId + '\n';
    waTexto += '📅 *Fecha:* ' + fechaStr + '\n\n';

    waTexto += '👤 *DATOS DEL CLIENTE*\n';
    waTexto += '• *Nombre:* ' + datosOrden.destinatario + '\n';
    waTexto += '• *Cédula:* ' + datosOrden.cedula + '\n';
    waTexto += '• *Teléfono Móvil:* ' + datosOrden.telefono + '\n\n';

    waTexto += '📦 *MODALIDAD DE ENTREGA / DESPACHO*\n';
    if (datosOrden.tipoDespacho === 'envio') {
      waTexto += '• *Tipo:* Envío Nacional con Encomienda\n';
      waTexto += '• *Empresa:* ' + datosOrden.agenciaEnvio + '\n';
      waTexto += '• *Destino:* ' + datosOrden.ciudad + ', Estado ' + datosOrden.estadoVzla + '\n';
      waTexto += '• *Dirección / Oficina:* ' + datosOrden.direccion + '\n\n';
    } else {
      waTexto += '• *Tipo:* Retiro Personal en Tienda Física\n';
      waTexto += '• *Ubicación:* CC Gran Bazar, Av. Lara, Valencia (Planta Baja)\n\n';
    }

    waTexto += '💍 *DETALLE DE JOYAS SOLICITADAS*\n';
    items.forEach(function (it, idx) {
      waTexto += '*' + (idx + 1) + '.* ' + it.nombre + '\n';
      if (it.presentacion) waTexto += '   ▫ *Material:* ' + it.presentacion + '\n';
      waTexto += '   ▫ *Cantidad:* ' + it.cantidad + ' unidad(es) × $' + it.precio.toFixed(2) + '\n';
      if (it.personalizacion) {
        waTexto += '   ▫ ✍️ *Grabado Láser / Talla:* "' + it.personalizacion + '"\n';
      }
      waTexto += '   ▫ *Subtotal:* $' + (it.precio * it.cantidad).toFixed(2) + '\n';
    });

    waTexto += '\n───────────────────────────\n';
    waTexto += '💵 *TOTAL A PAGAR (USD):* $' + datosOrden.totalUSD.toFixed(2) + '\n';
    waTexto += '🇻🇪 *EQUIVALENTE OFICIAL (BCV):* ' + datosOrden.totalBs + '\n';
    waTexto += '💳 *Forma de Pago Seleccionada:* ' + metodoTexto + '\n';
    waTexto += '───────────────────────────\n\n';
    waTexto += '📸 *VALIDACIÓN DE PAGO:*\n';
    waTexto += 'Adjunto a continuación la captura / comprobante de mi pago para su verificación y emisión de nota de entrega.\n\n';
    waTexto += '¡Quedo atento(a) a su confirmación y comienzo de fabricación/ajuste! Muchas gracias. ✨';

    var waNum = INEVAROLI_CONFIG.whatsapp || '584125006377';
    var urlWA = 'https://wa.me/' + waNum + '?text=' + encodeURIComponent(waTexto);

    // 6. Vaciar carrito
    Cart.vaciar();
    cerrarModal();

    // 7. Abrir WhatsApp
    window.open(urlWA, '_blank');
    if (typeof Notificaciones !== 'undefined') {
      Notificaciones.alerta('¡Pedido #' + ordenId + ' registrado exitosamente en el sistema de INEVAROLI! Tu mensaje estructurado ha sido generado para WhatsApp.', '¡Pedido Confirmado!');
    } else {
      alert('¡Pedido #' + ordenId + ' registrado exitosamente en el sistema de INEVAROLI!');
    }
  }

  return {
    abrirModal: abrirModal,
    cerrarModal: cerrarModal,
    irAPaso: irAPaso,
    validarPaso2: validarPaso2,
    validarPaso3: validarPaso3,
    toggleOpcionesEnvio: toggleOpcionesEnvio,
    renderPaso3: renderPaso3,
    actualizarDetalleMetodoPago: actualizarDetalleMetodoPago,
    procesarOrdenFinal: procesarOrdenFinal
  };
})();
