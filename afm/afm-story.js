(function () {
  'use strict';
  var section = document.querySelector('.afm-story');
  if (!section || !window.gsap || !window.ScrollTrigger || !window.matchMedia) return;
  var media = window.matchMedia('(min-width: 750px) and (prefers-reduced-motion: no-preference)');
  var screen = section.querySelector('.afm-story__screen');
  var visual = section.querySelector('.afm-story__visual');
  var paper = section.querySelector('.afm-story__paper');
  var values = Array.from(section.querySelectorAll('.afm-story__value'));
  var full = values.map(function (el) { return el.textContent; });
  var checks = Array.from(section.querySelectorAll('.afm-story__documents path'));
  var signature = section.querySelector('.afm-story__sign path');
  var stamp = section.querySelector('.afm-story__stamp');
  var pen = section.querySelector('.afm-story__pen');
  var status = Array.from(section.querySelectorAll('.afm-story__status i'));
  var bars = Array.from(section.querySelectorAll('.afm-story__status b'));
  var email = section.querySelector('.afm-story__email');
  var sentences = Array.from(section.querySelectorAll('.afm-story__sentences li'));
  var dots = Array.from(section.querySelectorAll('.afm-story__dots i'));
  var number = section.querySelector('.afm-story__number');
  var trigger, timer, points = [], current = 0, target = 0, active = false;
  var clamp = function (n) { return Math.max(0, Math.min(1, n)); };
  var part = function (t, a, b) { return clamp((t - a) / (b - a)); };
  var paths = checks.concat(signature);
  /* path lengths are fixed: measure once. The dash array is set again in setup(), because stop() clears the styles */
  var lens = paths.map(function (path) { return path.getTotalLength(); });
  function dashes() { paths.forEach(function (path, i) { path.style.strokeDasharray = lens[i]; }); }
  var shown = -1;
  function header() {
    var el = document.querySelector('#site-header');
    section.style.setProperty('--site-h', Math.max(0, el ? el.getBoundingClientRect().bottom : 0) + 'px');
  }
  function measure() {
    if (!active) return;
    values.forEach(function (el, i) { el.textContent = full[i]; });
    var zoom = parseFloat(getComputedStyle(visual).zoom) || 1;
    var base = paper.getBoundingClientRect();
    function point(el, end) {
      var rect = el.getBoundingClientRect();
      return { x: ((end ? rect.right : rect.left) - base.left) / zoom, y: (rect.bottom - base.top) / zoom };
    }
    points = values.map(function (el) { return [point(el, false), point(el, true)]; });
    checks.forEach(function (el) { points.push([point(el, false), point(el, true)]); });
    points.push([point(signature, false), point(signature, true)]);
    render(current);
  }
  function render(t) {
    var step = Math.min(3, Math.floor(t));
    sentences.forEach(function (el, i) { el.classList.toggle('is-active', i === step); });
    dots.forEach(function (el, i) { el.style.backgroundColor = i <= step ? 'var(--mark)' : 'rgba(var(--fg-rgb),.25)'; });
    number.textContent = '0' + (step + 1);
    values.forEach(function (el, i) { el.textContent = full[i].slice(0, Math.floor(full[i].length * part(t, i * .1, (i + 1) * .1))); });
    checks.forEach(function (el, i) { el.style.strokeDashoffset = lens[i] * (1 - part(t, .6 + i * .1, .7 + i * .1)); });
    signature.style.strokeDashoffset = lens[lens.length - 1] * (1 - part(t, 1, 1.5));
    var impact = part(t, 1.55, 1.85);
    stamp.style.opacity = impact;
    stamp.style.transform = 'rotate(-9deg) scale(' + (1.8 - .8 * impact) + ')';
    status.forEach(function (el, i) { el.style.backgroundColor = t >= 2 + i * .33 ? '#c49c31' : '#d5cdc2'; });
    bars.forEach(function (el, i) { el.style.transform = 'scaleX(' + part(t, 2 + i * .33, 2.33 + i * .33) + ')'; });
    var reveal = part(t, 3, 3.45);
    email.style.opacity = reveal;
    email.style.transform = 'translateY(' + (30 * (1 - reveal)) + 'px)';
    var index = t < .6 ? Math.min(5, Math.floor(t / .1)) : t < 1 ? Math.min(9, 6 + Math.floor((t - .6) / .1)) : 10;
    var fraction = t < 1 ? (t < .6 ? part(t, index * .1, (index + 1) * .1) : part(t, .6 + (index - 6) * .1, .7 + (index - 6) * .1)) : part(t, 1, 1.5);
    if (points[index]) {
      var pair = points[index];
      var x = pair[0].x + (pair[1].x - pair[0].x) * fraction;
      if (index < values.length) {
        var zoom = parseFloat(getComputedStyle(visual).zoom) || 1;
        x = (values[index].getBoundingClientRect().right - paper.getBoundingClientRect().left) / zoom;
      }
      /* the icon's tip is its bottom left corner: put it at the end of the text, just above the line */
      pen.style.left = (x + 1) + 'px';
      pen.style.top = (pair[0].y + (pair[1].y - pair[0].y) * fraction - 25) + 'px';
    }
    pen.style.opacity = t < 1.5 ? '1' : '0';
    shown = t;
  }
  function tick() {
    current += (target - current) * .12;
    if (Math.abs(target - current) < .0001) current = target;
    if (current !== shown) render(current);   /* nothing to draw while the page is not scrolling */
  }
  function stop() {
    if (trigger) { trigger.kill(); trigger = null; }
    gsap.ticker.remove(tick);
    active = false;
    section.classList.remove('is-anim');
    visual.style.removeProperty('--story-zoom');
    values.forEach(function (el, i) { el.textContent = full[i]; });
    paths.concat([stamp, pen, email]).concat(status, bars, dots).forEach(function (el) { el.removeAttribute('style'); });
    sentences.forEach(function (el) { el.classList.remove('is-active'); });
  }
  function setup() {
    stop();
    if (!media.matches) { ScrollTrigger.refresh(); return; }
    header();
    section.classList.add('is-anim');
    visual.style.setProperty('--story-zoom', '1');
    var available = screen.clientHeight - (parseFloat(getComputedStyle(screen).paddingTop) || 0) - 12;
    var size = visual.getBoundingClientRect();
    var zoom = Math.min(1, available / size.height, visual.parentElement.clientWidth / size.width);
    if (!isFinite(zoom) || zoom < .7 || available <= 0) { stop(); ScrollTrigger.refresh(); return; }
    visual.style.setProperty('--story-zoom', String(zoom));
    dashes();
    active = true;
    current = target = 0;
    measure();
    trigger = ScrollTrigger.create({ trigger: section, start: 'top top', end: 'bottom bottom', onUpdate: function (self) { target = self.progress * 4; } });
    current = target = trigger.progress * 4;
    render(current);
    gsap.ticker.add(tick);
    ScrollTrigger.refresh();
  }
  ScrollTrigger.addEventListener('refreshInit', header);
  ScrollTrigger.addEventListener('refresh', measure);
  window.addEventListener('resize', function () { clearTimeout(timer); timer = setTimeout(setup, 200); });
  if (media.addEventListener) media.addEventListener('change', setup);
  else media.addListener(setup);
  setup();
}());
