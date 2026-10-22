/**
 * bloqueo.js — Mecanismo de Seguridad contra Ataques de Fuerza Bruta
 * Bloquea temporalmente el inicio de sesión por 3 minutos tras 5 intentos fallidos.
 */

var ControlBloqueo = (function () {
  'use strict';

  var MAX_INTENTOS = 5;
  var TIEMPO_BLOQUEO_MS = 3 * 60 * 1000; // 3 minutos

  function claveBloqueo(cedula) {
    return 'bloqueo_' + String(cedula).trim();
  }

  function obtenerEstado(cedula) {
    return Api.leer(claveBloqueo(cedula), { intentos: 0, bloqueadoHasta: 0 });
  }

  function estaBloqueado(cedula) {
    var estado = obtenerEstado(cedula);
    var ahora = Date.now();
    if (estado.bloqueadoHasta && estado.bloqueadoHasta > ahora) {
      return {
        bloqueado: true,
        restanteMs: estado.bloqueadoHasta - ahora,
        segundos: Math.ceil((estado.bloqueadoHasta - ahora) / 1000)
      };
    }
    // Si ya expiró el tiempo de castigo, reiniciar
    if (estado.bloqueadoHasta && estado.bloqueadoHasta <= ahora) {
      Api.eliminar(claveBloqueo(cedula));
    }
    return { bloqueado: false, intentos: estado.intentos || 0 };
  }

  function registrarIntentoFallido(cedula) {
    var estado = obtenerEstado(cedula);
    estado.intentos = (estado.intentos || 0) + 1;

    if (estado.intentos >= MAX_INTENTOS) {
      estado.bloqueadoHasta = Date.now() + TIEMPO_BLOQUEO_MS;
      Api.guardar(claveBloqueo(cedula), estado);
      return {
        bloqueado: true,
        mensaje: 'Has superado el límite de 5 intentos fallidos. Por tu seguridad comercial, tu acceso ha sido bloqueado por 3 minutos.'
      };
    }

    Api.guardar(claveBloqueo(cedula), estado);
    var restantes = MAX_INTENTOS - estado.intentos;
    return {
      bloqueado: false,
      mensaje: 'Cédula o contraseña incorrecta. Te quedan ' + restantes + ' intento' + (restantes === 1 ? '' : 's') + ' antes del bloqueo temporal.'
    };
  }

  function reiniciarIntentos(cedula) {
    Api.eliminar(claveBloqueo(cedula));
  }

  return {
    estaBloqueado: estaBloqueado,
    registrarIntentoFallido: registrarIntentoFallido,
    reiniciarIntentos: reiniciarIntentos
  };
})();
