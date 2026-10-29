/**
 * api.js — Capa de Almacenamiento y Persistencia Robusta para INVERANOLI
 * Diseñado para funcionar 100% offline, en Windows 7 y navegadores ligeros
 * sin dependencias ni servidores locales.
 */
var Api = (function () {
  'use strict';

  var PREFIX = 'inveranoli_';
  var MEMORY_CACHE = {};

  function prefixedKey(key) {
    if (key.indexOf(PREFIX) === 0) return key;
    return PREFIX + key;
  }

  function guardar(key, valor) {
    var pKey = prefixedKey(key);
    var jsonStr;
    try {
      jsonStr = JSON.stringify(valor);
    } catch (e) {
      jsonStr = String(valor);
    }

    // 1. Memoria de ejecución inmediata
    MEMORY_CACHE[pKey] = JSON.parse(jsonStr);

    // 2. localStorage
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(pKey, jsonStr);
      }
    } catch (e) {}

    // 3. sessionStorage
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(pKey, jsonStr);
      }
    } catch (e) {}

    return valor;
  }

  function leer(key, valorDefecto) {
    var pKey = prefixedKey(key);

    // 1. Verificar cache en memoria
    if (MEMORY_CACHE.hasOwnProperty(pKey)) {
      return MEMORY_CACHE[pKey];
    }

    // 1. Para sesion_actual, sessionStorage tiene máxima prioridad para aislar la sesión por ventana
    // y evitar que al refrescar cargue el último usuario ingresado en otra ventana o pestaña
    if (key === 'sesion_actual' || pKey === prefixedKey('sesion_actual')) {
      try {
        if (typeof sessionStorage !== 'undefined') {
          var rawSession = sessionStorage.getItem(pKey);
          if (rawSession !== null) {
            var parsedSession = JSON.parse(rawSession);
            MEMORY_CACHE[pKey] = parsedSession;
            return parsedSession;
          }
        }
      } catch (e) {}
    }

    // 2. Verificar localStorage
    try {
      if (typeof localStorage !== 'undefined') {
        var rawLocal = localStorage.getItem(pKey);
        if (rawLocal !== null) {
          var parsedLocal = JSON.parse(rawLocal);
          MEMORY_CACHE[pKey] = parsedLocal;
          return parsedLocal;
        }
      }
    } catch (e) {}

    // 3. Verificar sessionStorage para el resto de claves
    try {
      if (typeof sessionStorage !== 'undefined') {
        var rawSession = sessionStorage.getItem(pKey);
        if (rawSession !== null) {
          var parsedSession = JSON.parse(rawSession);
          MEMORY_CACHE[pKey] = parsedSession;
          return parsedSession;
        }
      }
    } catch (e) {}

    return valorDefecto !== undefined ? valorDefecto : null;
  }

  function eliminar(key) {
    var pKey = prefixedKey(key);
    delete MEMORY_CACHE[pKey];
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(pKey);
      }
    } catch (e) {}
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(pKey);
      }
    } catch (e) {}
  }

  function limpiarTodo() {
    MEMORY_CACHE = {};
    try {
      if (typeof localStorage !== 'undefined') {
        for (var i = localStorage.length - 1; i >= 0; i--) {
          var k = localStorage.key(i);
          if (k && k.indexOf(PREFIX) === 0) {
            localStorage.removeItem(k);
          }
        }
      }
    } catch (e) {}
  }

  return {
    guardar: guardar,
    leer: leer,
    eliminar: eliminar,
    limpiarTodo: limpiarTodo
  };
})();
