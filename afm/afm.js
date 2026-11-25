/* AFM page motion: reveals, line drawings, the dotted rail between the steps. GSAP + ScrollTrigger + DrawSVG + SplitText (same files as vo). */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.gsap || !window.ScrollTrigger) { document.documentElement.classList.remove('afm-js'); return; }
  gsap.registerPlugin(ScrollTrigger);
  if (window.DrawSVGPlugin) gsap.registerPlugin(DrawSVGPlugin);
  if (window.SplitText) gsap.registerPlugin(SplitText);

  // smooth scroll as on vo
  if (window.Lenis && !reduce) {
    var lenis = new Lenis({ lerp: 0.12 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href'); if (id.length < 2) return;
        var el = document.querySelector(id); if (!el) return;
        e.preventDefault(); lenis.scrollTo(el, { offset: -20 });
      });
    });
  }

  if (reduce) { document.documentElement.classList.remove('afm-js'); return; }

  // hero title: line by line from below
  document.fonts.ready.then(function () {
    var title = document.querySelector('[data-split]');
    if (title && window.SplitText) {
      var split = new SplitText(title, { type: 'lines', linesClass: 'line' });
      var inner = split.lines.map(function (l) { l.innerHTML = '<span style="display:block">' + l.innerHTML + '</span>'; return l.firstChild; });
      gsap.from(inner, { yPercent: 105, duration: 1.1, ease: 'expo.out', stagger: 0.09, delay: 0.15 });
    }
  });

  // generic reveal
  gsap.utils.toArray('[data-reveal]').forEach(function (el) {
    gsap.to(el, { opacity: 1, y: 0, duration: 1, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' } });
  });
  window.afmRevealReady = true; // the inline check in the page shows all content if this line was never reached

  // step cards: card rises, its drawing is drawn line by line
  gsap.utils.toArray('.afm-steps .ecard-wrap').forEach(function (wrap) {
    var paths = wrap.querySelectorAll('.afm-icon > *');
    var tl = gsap.timeline({ scrollTrigger: { trigger: wrap, start: 'top 82%', toggleActions: 'play none none reverse' } });
    tl.from(wrap, { y: 60, opacity: 0, duration: 1, ease: 'expo.out' });
    if (window.DrawSVGPlugin) tl.from(paths, { drawSVG: 0, duration: 1.1, ease: 'power2.inOut', stagger: 0.12 }, 0.25);
  });

  // dotted gold rail from each card's number to the next one, drawn with the scroll
  var list = document.querySelector('.afm-steps__list');
  var rail = document.querySelector('.afm-steps__rail-path');
  function buildRail() {
    if (!list || !rail || getComputedStyle(rail.parentNode).display === 'none') return;
    var box = list.getBoundingClientRect();
    var nums = list.querySelectorAll('.ecard');
    // from the bottom centre of each card to the top of the next card's number, an S curve through the gap
    var d = '';
    for (var i = 0; i < nums.length - 1; i++) {
      var r1 = nums[i].getBoundingClientRect();
      var r2 = nums[i + 1].parentNode.getBoundingClientRect();
      var ax = r1.left + r1.width / 2 - box.left, ay = r1.bottom - box.top;
      var bx = r2.left + r2.width / 2 - box.left, by = r2.top - box.top - 6;
      var my = (ay + by) / 2;
      d += 'M' + ax + ' ' + ay + ' C ' + ax + ' ' + my + ' ' + bx + ' ' + my + ' ' + bx + ' ' + by + ' ';
    }
    rail.setAttribute('d', d);
  }
  buildRail();
  if (rail && window.DrawSVGPlugin) {
    gsap.fromTo(rail, { drawSVG: '0%' }, { drawSVG: '100%', ease: 'none',
      scrollTrigger: { trigger: list, start: 'top 60%', end: 'bottom 70%', scrub: 0.6 } });
  }
  // one rebuild per resize burst, not one per resize event
  var railTimer;
  window.addEventListener('resize', function () { clearTimeout(railTimer); railTimer = setTimeout(function () { buildRail(); ScrollTrigger.refresh(); }, 200); });

  // side drawings in the personal and company sections
  if (window.DrawSVGPlugin) gsap.utils.toArray('.afm-split__art').forEach(function (svg) {
    gsap.from(svg.children, { drawSVG: 0, duration: 1.4, ease: 'power2.inOut', stagger: 0.08,
      scrollTrigger: { trigger: svg, start: 'top 85%', toggleActions: 'play none none reverse' } });
  });

  // document checklists: ticks one after another
  gsap.utils.toArray('.afm-checks').forEach(function (ul) {
    gsap.to(ul.children, { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out', stagger: 0.08,
      scrollTrigger: { trigger: ul, start: 'top 85%', toggleActions: 'play none none reverse' } });
  });

  // big "3": counts up from 0
  var num = document.querySelector('.afm-time__num');
  if (num) {
    var o = { v: 0 };
    gsap.to(o, { v: 3, duration: 1.4, ease: 'power2.out', onUpdate: function () { num.textContent = Math.round(o.v); },
      scrollTrigger: { trigger: num, start: 'top 85%', toggleActions: 'play none none reverse' } });
  }
  if (window.DrawSVGPlugin) gsap.utils.toArray('.afm-time__ico, .afm-doc__ico').forEach(function (svg) {
    gsap.from(svg.children, { drawSVG: 0, duration: 1.2, ease: 'power2.inOut', stagger: 0.1,
      scrollTrigger: { trigger: svg, start: 'top 88%', toggleActions: 'play none none reverse' } });
  });

  // question rows: smooth open and close. The outer box clips (overflow hidden) and only its height moves;
  // spacing lives on the inner box, so nothing jumps at the end. One ScrollTrigger refresh after the move.
  document.querySelectorAll('.afm-q').forEach(function (d) {
    var s = d.querySelector('summary'), body = d.querySelector('.afm-q__body'), busy = false;
    s.addEventListener('click', function (e) {
      e.preventDefault();
      if (busy) return; busy = true;
      var done = function () { busy = false; gsap.set(body, { clearProps: 'height' }); ScrollTrigger.refresh(); };
      if (d.open) {
        gsap.fromTo(body, { height: body.offsetHeight }, { height: 0, duration: 0.4, ease: 'power2.inOut', onComplete: function () { d.open = false; done(); } });
      } else {
        d.open = true;
        var h = body.scrollHeight;
        gsap.fromTo(body, { height: 0 }, { height: h, duration: 0.45, ease: 'power2.out', onComplete: done });
      }
    });
  });

  // circles in the hero drift a little with the scroll
  gsap.to('.afm-hero__circles', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.afm-hero', start: 'top top', end: 'bottom top', scrub: true } });
})();
