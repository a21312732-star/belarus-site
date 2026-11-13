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
      '<span class="robo-head robo-logo" role="img" aria-label="Логотип АльтерБелТех"><span class="robo-logo-mark"></span></span>';
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
