/* Логотип сбоку: выглядывает и предлагает позвонить */
(function () {
  'use strict';
  var KEY = 'abt-robot-closed';
  try { if (sessionStorage.getItem(KEY)) return; } catch (e) {}
  function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  ready(function () {
    var box = document.createElement('div');
    box.className = 'robo';
    box.setAttribute('role', 'complementary');
    box.setAttribute('aria-label', 'Подсказка: как связаться');
    box.innerHTML =
      '<div class="robo-bubble">' +
        '<button type="button" class="robo-close" aria-label="Закрыть подсказку">×</button>' +
        '<span class="robo-text">Хотите связаться с нами? Звоните:</span>' +
        '<a class="robo-phone" href="tel:+375445288999">+375 (44) 528-89-99</a>' +
      '</div>' +
      '<svg class="robo-head robo-logo" viewBox="0 0 100 100" role="img" aria-label="АльтерБелТех">' +
        '<defs><linearGradient id="abt-silver" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse" spreadMethod="reflect">' +
          '<stop offset="0" stop-color="#8c939b"/><stop offset=".35" stop-color="#f4f6f8"/><stop offset=".5" stop-color="#ffffff"/><stop offset=".65" stop-color="#c3c9cf"/><stop offset="1" stop-color="#7b828a"/>' +
          '<animateTransform attributeName="gradientTransform" type="translate" values="-100 -100;100 100;-100 -100" dur="4s" repeatCount="indefinite"/>' +
        '</linearGradient></defs>' +
        '<rect x="2" y="2" width="96" height="96" rx="22" fill="#141414"/>' +
        '<polygon points="50,17 86,82 14,82" fill="none" stroke="url(#abt-silver)" stroke-width="8" stroke-linejoin="miter"/>' +
        '<line x1="25" y1="66" x2="75" y2="66" stroke="url(#abt-silver)" stroke-width="6"/>' +
      '</svg>';
    document.body.appendChild(box);
    // появляется каждую минуту на 10 секунд
    var SHOW_MS = 10000, EVERY_MS = 60000, stopped = false, hideT = null, cycleT = null;
    function show() {
      if (stopped) return;
      box.classList.remove('is-quiet'); box.classList.add('is-out');
      hideT = setTimeout(function () { box.classList.remove('is-out'); }, SHOW_MS);
    }
    setTimeout(function () { show(); cycleT = setInterval(show, EVERY_MS); }, 2500);
    box.querySelector('.robo-head').addEventListener('click', function () { box.classList.toggle('is-quiet'); });
    box.querySelector('.robo-close').addEventListener('click', function () {
      stopped = true; clearTimeout(hideT); clearInterval(cycleT);
      box.classList.remove('is-out');
      try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
      setTimeout(function () { box.remove(); }, 600);
    });
  });
})();
