/* Главная v2: меню, появление блоков, параллакс */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // меню на телефоне
  var burger = document.querySelector('.nav-burger');
  var links = document.getElementById('nav-links');
  if (burger && links) {
    burger.addEventListener('click', function () {
      var open = !links.classList.contains('open');
      links.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
    });
    links.addEventListener('click', function (e) {
      if (e.target.closest('a')) { links.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
    });
  }

  // появление при прокрутке
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  if (reduce) return;
  var word = document.querySelector('.hero-word');
  var front = document.querySelector('.hero-front');
  var scat = Array.prototype.slice.call(document.querySelectorAll('.sc'));
  var scatter = document.querySelector('.scatter');
  var banner = document.querySelector('.banner');
  var ticking = false;
  function update() {
    ticking = false;
    var y = window.pageYOffset, vh = window.innerHeight;
    // надпись уходит вверх медленнее здания — эффект глубины
    if (word) word.style.setProperty('--word-y', (y * 0.35) + 'px');
    if (front) front.style.setProperty('--front-s', (1 + Math.min(y, vh) / vh * 0.06).toFixed(4));
    if (scatter) {
      var r = scatter.getBoundingClientRect(), c = (r.top + r.height / 2 - vh / 2);
      scat.forEach(function (el) {
        var s = parseFloat(el.getAttribute('data-speed')) || 0;
        el.style.transform = 'translateY(' + (c * s).toFixed(1) + 'px)';
      });
    }
    if (banner) {
      var b = banner.getBoundingClientRect(), k = 1 - Math.max(0, Math.min(1, (b.top + b.height) / (vh + b.height)));
      banner.style.setProperty('--banner-s', (1.12 - k * 0.12).toFixed(4));
    }
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
