/**
 * tasa-bcv.js — Módulo de Conversión Oficial Banco Central de Venezuela (BCV)
 * Garantiza la visualización de precios duales (USD referencial y Bolívares Oficiales)
 * en estricto cumplimiento con la legislación mercantil venezolana.
 */

var TasaBCV = (function () {
  'use strict';

  var TASA_PREDETERMINADA = 880.12; // Cotización referencial de contingencia
  var FECHA_PREDETERMINADA = 'Oficial BCV';

  function obtenerTasa() {
    var guardada = Api.leer('tasa_bcv_datos', null);
    if (guardada && guardada.monto && guardada.monto > 0) {
      return guardada.monto;
    }
    return TASA_PREDETERMINADA;
  }

  function obtenerFecha() {
    var guardada = Api.leer('tasa_bcv_datos', null);
    if (guardada && guardada.fecha) {
      return guardada.fecha;
    }
    return FECHA_PREDETERMINADA;
  }

  function fijarTasa(monto, fecha) {
    var num = parseFloat(monto);
    if (!isNaN(num) && num > 0) {
      Api.guardar('tasa_bcv_datos', {
        monto: num,
        fecha: fecha || new Date().toLocaleDateString('es-VE')
      });
      actualizarWidget();
      if (typeof renderProductos === 'function') renderProductos();
      if (typeof renderCarrito === 'function') renderCarrito();
    }
  }

  function convertirBs(montoUSD) {
    var tasa = obtenerTasa();
    var bs = (Number(montoUSD) || 0) * tasa;
    return 'Bs. ' + bs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function actualizarWidget() {
    var elValor = document.getElementById('bcv-valor-tasa');
    var elFecha = document.getElementById('bcv-fecha-tasa');
    if (elValor) elValor.textContent = 'Bs. ' + obtenerTasa().toFixed(2);
    if (elFecha) elFecha.textContent = obtenerFecha();
  }

  async function refrescar() {
    var btn = document.querySelector('.bcv-btn-refresh');
    if (btn) btn.classList.add('girando');

    // Simulación de consulta o petición de actualización directa
    try {
      // Intentar fetch a API pública liviana si hay internet, o fallback local
      var res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial').then(function(r) { return r.json(); }).catch(function() { return null; });
      if (res && res.promedio) {
        fijarTasa(res.promedio, 'Actualizado ' + new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }));
      } else {
        // Si no hay red (computadora offline), mantener la tasa actual
        actualizarWidget();
      }
    } catch (e) {
      actualizarWidget();
    } finally {
      if (btn) {
        setTimeout(function () {
          btn.classList.remove('girando');
        }, 600);
      }
    }
  }

  // Inicializar al cargar
  if (typeof window !== 'undefined') {
    setTimeout(actualizarWidget, 100);
  }

  return {
    obtenerTasa: obtenerTasa,
    convertirBs: convertirBs,
    fijarTasa: fijarTasa,
    refrescar: refrescar,
    actualizarWidget: actualizarWidget
  };
})();
