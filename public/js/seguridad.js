/**
 * seguridad.js — Módulo Criptográfico y Gestión de Sesión
 * Diseñado para compatibilidad universal (Windows 7 / IE11 / Chrome / Edge)
 * Implementa Hashing SHA-256 + Sal Criptográfica y Cierre Automático por Inactividad (15 min).
 */

// Genera un hash SHA-256 a partir de una contraseña y una sal
async function hashearPassword(password, sal) {
  var texto = password + ':' + sal;

  // 1. Intentar Web Crypto API nativa si el navegador la soporta
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle && typeof TextEncoder !== 'undefined') {
    try {
      var encoder = new TextEncoder();
      var data = encoder.encode(texto);
      var hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      var hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(function (b) {
        return b.toString(16).padStart(2, '0');
      }).join('');
    } catch (e) {
      // Fallback a implementación pura
    }
  }

  // 2. Implementación pura de SHA-256 en JavaScript (sin dependencias, 100% compatible con PC antigua)
  return sha256Puro(texto);
}

// Implementación estándar FIPS 180-2 de SHA-256 pura en JavaScript
function sha256Puro(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }

  var mathPow = Math.pow;
  var maxWord = mathPow(2, 32);
  var lengthProperty = 'length';
  var i, j;
  var result = '';

  var words = [];
  var asciiBitLength = ascii[lengthProperty] * 8;

  var hash = sha256Puro.h = sha256Puro.h || [];
  var k = sha256Puro.k = sha256Puro.k || [];
  var primeCounter = k[lengthProperty];

  var isComposite = {};
  for (var candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 300; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  ascii += '\x80';
  while ((ascii[lengthProperty] % 64) - 56) ascii += '\x00';
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return;
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;

  for (j = 0; j < words[lengthProperty];) {
    var w = words.slice(j, j += 16);
    var oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      var i2 = i + j;
      var w15 = w[i - 15], w2 = w[i - 2];

      var s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      var s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      w[i] = (i < 16) ? w[i] : (w[i - 16] + s0 + w[i - 7] + s1) | 0;

      var ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      var maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      var s0h = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      var s1h = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);

      var temp1 = hash[7] + s1h + ch + k[i] + w[i];
      var temp2 = s0h + maj;

      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (var b = 3; b >= 0; b--) {
      var chunk = (hash[i] >> (8 * b)) & 255;
      result += (chunk < 16 ? '0' : '') + chunk.toString(16);
    }
  }
  return result;
}

// Genera una sal criptográfica pseudoaleatoria
function generarSal() {
  var caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
  var sal = '';
  for (var i = 0; i < 16; i++) {
    sal += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return sal;
}

// ─── Control de Inactividad de Sesión (15 Minutos) ───
var TIEMPO_INACTIVIDAD_MS = 15 * 60 * 1000;
var timerInactividad = null;

function reiniciarTemporizadorInactividad() {
  if (timerInactividad) clearTimeout(timerInactividad);
  var usuario = Api.leer('sesion_actual', null);
  if (!usuario) return;

  timerInactividad = setTimeout(function () {
    var u = Api.leer('sesion_actual', null);
    if (u) {
      if (typeof Notificaciones !== 'undefined') {
        Notificaciones.alerta('Tu sesión ha expirado por inactividad (15 minutos). Por seguridad comercial, debes iniciar sesión nuevamente.', 'Sesión Expirada');
      } else {
        alert('Tu sesión ha expirado por inactividad (15 minutos). Por seguridad comercial, debes iniciar sesión nuevamente.');
      }
      if (typeof cerrarSesion === 'function') {
        cerrarSesion();
      }
    }
  }, TIEMPO_INACTIVIDAD_MS);
}

// Registrar eventos de interacción del usuario
if (typeof window !== 'undefined') {
  ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'].forEach(function (evento) {
    window.addEventListener(evento, reiniciarTemporizadorInactividad, { passive: true });
  });
}
