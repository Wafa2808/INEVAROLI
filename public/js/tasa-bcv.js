/**
 * tasa-bcv.js — Módulo de Conversión Oficial Banco Central de Venezuela (BCV)
 * Obtiene la tasa en vivo directamente de la página oficial del BCV (https://www.bcv.org.ve/)
 * a través de la API del servidor o endpoints oficiales en tiempo real.
 * Sin tasas predeterminadas ni ficticias.
 */

var TasaBCV = (function () {
  'use strict';

  var tasaCargada = null;
  var fechaCargada = null;
  var consultando = false;

  function obtenerTasa() {
    if (tasaCargada && tasaCargada > 0) {
      return tasaCargada;
    }
    var guardada = Api.leer('tasa_bcv_datos', null);
    if (guardada && guardada.monto && guardada.monto > 0) {
      tasaCargada = guardada.monto;
      fechaCargada = guardada.fecha;
      return guardada.monto;
    }
    return 0;
  }

  function obtenerFecha() {
    if (fechaCargada) return fechaCargada;
    var guardada = Api.leer('tasa_bcv_datos', null);
    if (guardada && guardada.fecha) {
      fechaCargada = guardada.fecha;
      return guardada.fecha;
    }
    return 'Consultando...';
  }

  function fijarTasa(monto, fecha) {
    var num = parseFloat(monto);
    if (!isNaN(num) && num > 0) {
      tasaCargada = num;
      fechaCargada = fecha || ('BCV Oficial ' + new Date().toLocaleDateString('es-VE'));
      Api.guardar('tasa_bcv_datos', {
        monto: num,
        fecha: fechaCargada
      });
      actualizarWidget();
      if (typeof renderProductos === 'function') renderProductos();
      if (typeof renderCarrito === 'function') renderCarrito();
    }
  }

  function convertirBs(montoUSD) {
    var tasa = obtenerTasa();
    if (!tasa || tasa <= 0) {
      return 'Bs. --';
    }
    var bs = (Number(montoUSD) || 0) * tasa;
    return 'Bs. ' + bs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function actualizarWidget() {
    var elValor = document.getElementById('bcv-valor-tasa');
    var elFecha = document.getElementById('bcv-fecha-tasa');
    var tasa = obtenerTasa();

    if (elValor) {
      if (tasa > 0) {
        elValor.textContent = 'Bs. ' + tasa.toFixed(2);
      } else {
        elValor.textContent = 'Cargando...';
      }
    }
    if (elFecha) {
      elFecha.textContent = obtenerFecha();
    }
  }

  // Consulta en vivo a la página oficial del BCV a través del backend o API pública
  async function refrescar() {
    if (consultando) return;
    consultando = true;

    var btn = document.querySelector('.amz-bcv-refresh') || document.querySelector('.bcv-btn-refresh');
    if (btn) btn.classList.add('girando');

    // Endpoints candidatos en orden de prioridad para obtener la tasa oficial real del BCV
    var endpoints = [
      '/api/bcv',
      'http://localhost:3001/api/bcv',
      'http://127.0.0.1:3001/api/bcv',
      'http://localhost:3000/api/bcv',
      'https://ve.dolarapi.com/v1/dolares/oficial'
    ];

    var exito = false;

    for (var i = 0; i < endpoints.length; i++) {
      var url = endpoints[i];
      try {
        var controller = new AbortController();
        var timeoutId = setTimeout(function () { controller.abort(); }, 4000);

        var resp = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (resp.ok) {
          var data = await resp.json();
          // Formato propio de /api/bcv (scraping directo de https://www.bcv.org.ve/)
          if (data && data.monto && data.monto > 0) {
            fijarTasa(data.monto, data.fecha || 'Oficial www.bcv.org.ve');
            exito = true;
            break;
          }
          // Formato alternativo oficial (dolarapi de respaldo)
          if (data && data.promedio && data.promedio > 0) {
            var f = data.fechaActualizacion ? new Date(data.fechaActualizacion).toLocaleDateString('es-VE') : 'Oficial BCV';
            fijarTasa(data.promedio, f);
            exito = true;
            break;
          }
        }
      } catch (err) {
        // Continuar con el siguiente endpoint
      }
    }

    if (!exito) {
      actualizarWidget();
    }

    consultando = false;
    if (btn) {
      setTimeout(function () {
        btn.classList.remove('girando');
      }, 500);
    }
  }

  // Inicializar y consultar tasa oficial en tiempo real al arrancar
  if (typeof window !== 'undefined') {
    setTimeout(function () {
      actualizarWidget();
      refrescar();
    }, 150);
  }

  return {
    obtenerTasa: obtenerTasa,
    obtenerFecha: obtenerFecha,
    convertirBs: convertirBs,
    fijarTasa: fijarTasa,
    refrescar: refrescar,
    actualizarWidget: actualizarWidget
  };
})();
