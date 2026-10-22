/**
 * carrusel-inicio.js — Banners Dinámicos y Carruseles de Joyería
 * Banners de Colección:
 * 1. Promociones de Grado 2026 (Bachiller & Universidades)
 * 2. Anillos de Matrimonio & Alianzas Exclusivas
 * 3. Joyería en Acero Quirúrgico 316L & Plata Ley 925
 */

var CarruselInicio = (function () {
  'use strict';

  var timerHero = null;
  var indiceHero = 0;
  var slidesHero = [];

  function initHero() {
    slidesHero = document.querySelectorAll('.hero-slide');
    if (!slidesHero.length) return;

    var dotsContainer = document.getElementById('hero-dots');
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      slidesHero.forEach(function (_, i) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'hero-dot' + (i === 0 ? ' activo' : '');
        dot.setAttribute('aria-label', 'Ver banner ' + (i + 1));
        dot.onclick = function () {
          irASlideHero(i);
        };
        dotsContainer.appendChild(dot);
      });
    }

    iniciarRotacion();
  }

  function mostrarSlideHero(idx) {
    if (!slidesHero.length) return;
    slidesHero.forEach(function (s, i) {
      s.classList.toggle('activo', i === idx);
    });

    var dots = document.querySelectorAll('.hero-dot');
    dots.forEach(function (d, i) {
      d.classList.toggle('activo', i === idx);
    });

    indiceHero = idx;
  }

  function siguienteHero() {
    var nuevo = (indiceHero + 1) % slidesHero.length;
    mostrarSlideHero(nuevo);
  }

  function anteriorHero() {
    var nuevo = (indiceHero - 1 + slidesHero.length) % slidesHero.length;
    mostrarSlideHero(nuevo);
  }

  function irASlideHero(idx) {
    mostrarSlideHero(idx);
    reiniciarRotacion();
  }

  function iniciarRotacion() {
    if (timerHero) clearInterval(timerHero);
    var segundos = (typeof INEVAROLI_CONFIG !== 'undefined' && INEVAROLI_CONFIG.carruseles)
      ? INEVAROLI_CONFIG.carruseles.inicio_segundos
      : 5;
    timerHero = setInterval(siguienteHero, segundos * 1000);
  }

  function reiniciarRotacion() {
    iniciarRotacion();
  }

  // ─── Carrusel de Descuentos / Ofertas ───
  function scrollDescuentos(dir) {
    var cont = document.getElementById('carrusel-descuentos-track');
    if (cont) {
      cont.scrollBy({ left: dir * 300, behavior: 'smooth' });
    }
  }

  // ─── Carrusel de Recomendados ───
  function scrollRecomendados(dir) {
    var cont = document.getElementById('carrusel-recomendados-track');
    if (cont) {
      cont.scrollBy({ left: dir * 300, behavior: 'smooth' });
    }
  }

  return {
    initHero: initHero,
    siguienteHero: siguienteHero,
    anteriorHero: anteriorHero,
    irASlideHero: irASlideHero,
    scrollDescuentos: scrollDescuentos,
    scrollRecomendados: scrollRecomendados
  };
})();
