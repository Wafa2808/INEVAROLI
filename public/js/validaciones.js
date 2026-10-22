/**
 * validaciones.js — Reglas de Negocio y Validación Estricta para INEVAROLI
 * Adaptado a la normativa comercial venezolana:
 * - Cédula de 7 u 8 dígitos numéricos
 * - Teléfono móvil con prefijos nacionales (0414, 0424, 0412, 0416, 0426) + 7 dígitos
 * - Nombres y apellidos separados (2-35 letras)
 * - Contraseña de 8 a 16 caracteres con medidor de fuerza dinámico
 */

// Permite únicamente el ingreso de caracteres numéricos en tiempo real
function soloNumeros(e) {
  var charCode = (e.which) ? e.which : e.keyCode;
  if (charCode > 31 && (charCode < 48 || charCode > 57)) {
    e.preventDefault();
    return false;
  }
  return true;
}

// Permite únicamente letras y espacios en nombres y apellidos
function soloLetras(e) {
  var char = String.fromCharCode(e.which || e.keyCode);
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]$/.test(char) && (e.which || e.keyCode) > 31) {
    e.preventDefault();
    return false;
  }
  return true;
}

// Evalúa la robustez de la contraseña y retorna puntuación y diagnóstico
function evaluarFortalezaPassword(pass) {
  var puntos = 0;
  var fallos = [];

  if (!pass) {
    return { nivel: 'vacio', texto: 'Ingresa una contraseña', puntos: 0, fallos: [] };
  }

  if (pass.length < 8) {
    fallos.push('Mínimo 8 caracteres (actual: ' + pass.length + ')');
  } else if (pass.length <= 16) {
    puntos += 1;
  }

  if (pass.length > 16) {
    fallos.push('Máximo 16 caracteres permitidos');
  }

  if (/[a-z]/.test(pass)) {
    puntos += 1;
  } else {
    fallos.push('Debe incluir al menos una letra minúscula');
  }

  if (/[A-Z]/.test(pass)) {
    puntos += 1;
  } else {
    fallos.push('Debe incluir al menos una letra mayúscula');
  }

  if (/[0-9]/.test(pass)) {
    puntos += 1;
  } else {
    fallos.push('Debe incluir al menos un número (0-9)');
  }

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass)) {
    puntos += 1;
  } else {
    fallos.push('Debe incluir al menos un símbolo especial (!@#$...)');
  }

  var nivel = 'debil';
  var texto = 'Contraseña débil';
  if (puntos === 5 && pass.length >= 8 && pass.length <= 16) {
    nivel = 'fuerte';
    texto = 'Contraseña muy segura y óptima';
  } else if (puntos >= 4) {
    nivel = 'buena';
    texto = 'Contraseña de nivel bueno';
  } else if (puntos >= 2) {
    nivel = 'media';
    texto = 'Contraseña de nivel medio';
  }

  return {
    nivel: nivel,
    texto: texto,
    puntos: puntos,
    valida: (puntos === 5 && pass.length >= 8 && pass.length <= 16),
    fallos: fallos
  };
}

// Actualiza visualmente la barra y el texto dinámico de fortaleza
function actualizarMedidorFuerza(inputPassId, barraId, textoId) {
  var input = document.getElementById(inputPassId);
  var barra = document.getElementById(barraId);
  var texto = document.getElementById(textoId);
  if (!input || !barra || !texto) return;

  var val = input.value;
  var res = evaluarFortalezaPassword(val);

  barra.className = '';
  if (res.nivel === 'vacio') {
    barra.style.width = '0%';
    texto.style.color = '#94a3b8';
    texto.textContent = 'Seguridad: 8 a 16 caracteres, mayúsculas, minúsculas, números y símbolos';
  } else if (res.nivel === 'debil') {
    barra.className = 'barra-debil';
    barra.style.width = '25%';
    texto.style.color = '#ef4444';
    texto.textContent = 'Débil: ' + (res.fallos[0] || 'faltan requisitos de seguridad');
  } else if (res.nivel === 'media') {
    barra.className = 'barra-media';
    barra.style.width = '50%';
    texto.style.color = '#f59e0b';
    texto.textContent = 'Media: ' + (res.fallos[0] || 'se recomienda agregar más variedad');
  } else if (res.nivel === 'buena') {
    barra.className = 'barra-buena';
    barra.style.width = '75%';
    texto.style.color = '#3b82f6';
    texto.textContent = 'Buena: ' + (res.fallos[0] || 'casi lista');
  } else if (res.nivel === 'fuerte') {
    barra.className = 'barra-fuerte';
    barra.style.width = '100%';
    texto.style.color = '#10b981';
    texto.textContent = '¡Excelente! Contraseña robusta y protegida.';
  }
}

// Validador estricto de cédula venezolana
function esCedulaValida(cedula) {
  return /^\d{7,8}$/.test(String(cedula).trim());
}

// Validador de teléfono venezolano (+58)
function esTelefonoValido(prefijo, numero) {
  var prefijosValidos = ['0414', '0424', '0412', '0416', '0426'];
  var numLimpio = String(numero).trim();
  return prefijosValidos.indexOf(prefijo) !== -1 && /^\d{7}$/.test(numLimpio);
}

// Validador de correo electrónico formal
function esEmailValido(email) {
  var regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(String(email).trim());
}
