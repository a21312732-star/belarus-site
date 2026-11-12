/* Роботик в углу: выглядывает и предлагает позвонить */
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
      '<svg class="robo-head" viewBox="0 0 120 110" aria-hidden="true">' +
        '<line x1="60" y1="8" x2="60" y2="24" stroke="#4a4a4a" stroke-width="4" stroke-linecap="round"/>' +
        '<circle class="robo-bulb" cx="60" cy="8" r="6" fill="#1f55c4"/>' +
        '<rect x="6" y="46" width="10" height="26" rx="4" fill="#9aa3ad"/>' +
        '<rect x="104" y="46" width="10" height="26" rx="4" fill="#9aa3ad"/>' +
        '<rect x="14" y="24" width="92" height="80" rx="22" fill="#e9edf2" stroke="#4a4a4a" stroke-width="3"/>' +
        '<rect x="26" y="40" width="68" height="40" rx="14" fill="#141414"/>' +
        '<g class="robo-eyes"><circle cx="46" cy="60" r="7" fill="#5fd0ff"/><circle cx="74" cy="60" r="7" fill="#5fd0ff"/></g>' +
        '<path d="M48 90 Q60 97 72 90" fill="none" stroke="#4a4a4a" stroke-width="3" stroke-linecap="round"/>' +
      '</svg>';
    document.body.appendChild(box);
    // появляется каждую минуту на 20 секунд
    var SHOW_MS = 20000, EVERY_MS = 60000, stopped = false, hideT = null, cycleT = null;
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
