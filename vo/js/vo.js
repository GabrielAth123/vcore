/* VCORE Virtual Office: effects (GSAP + Lenis, same settings as montarville.ca) */
(function () {
  var html = document.documentElement;
  function setSiteH() { var sh = document.getElementById('site-header'); html.style.setProperty('--site-h', (sh ? sh.offsetHeight : 0) + 'px'); }
  setSiteH(); window.addEventListener('resize', setSiteH);
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(hover: none)').matches;
  var isPhone = window.matchMedia('(max-width: 749px)').matches;

  // tap to open the persona cards on touch screens (montarville: .--is-open)
  document.querySelectorAll('.tcard').forEach(function (c) {
    c.addEventListener('click', function (e) { if (e.target.closest('a')) return; c.classList.toggle('is-open'); });
  });

  function showAll() { html.classList.add('ready'); html.classList.remove('intro-anim-playing'); }
  if (!window.gsap || reduce) { showAll(); return; }

  gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, CustomEase);
  // montarville's own custom eases
  CustomEase.create('ff_expo_out', 'M0,0,C0.084,0.61,0.214,0.802,0.28,0.856,0.356,0.918,0.374,1,1,1');
  CustomEase.create('ff_expo_in_out', 'M0,0,C0.25,0,0.294,0.023,0.335,0.05,0.428,0.11,0.466,0.292,0.498,0.502,0.532,0.73,0.586,0.88,0.64,0.928,0.679,0.962,0.698,1,1,1');

  // smooth scroll: Lenis with montarville's settings
  var lenis = new Lenis({ duration: 1.3, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, wheelMultiplier: 1.1 });
  gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
  gsap.ticker.lagSmoothing(0);
  lenis.on('scroll', ScrollTrigger.update);
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href'); if (id.length < 2) return; e.preventDefault();
      lenis.scrollTo(id === '#top' ? 0 : id, { offset: -70, duration: 1.2, easing: function (x) { return x < .5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2; } });
    });
  });

  document.fonts.ready.then(function () {
    html.classList.add('ready');

    // ---------- 1. intro, same timeline as montarville's "introduction" ----------
    var logo = document.querySelector('.vo-intro__logo');
    var letters = logo.querySelectorAll('.letter, .point');
    var image = document.querySelector('.vo-intro__image');
    var circles = document.querySelectorAll('.vo-intro__circles circle');
    var titleSplit = SplitText.create('.vo-intro__title', { type: 'lines, words' });
    var vh = window.innerHeight;
    // make the giant word span the full width, like montarville's logo
    function fitLogo() {
      var target = logo.clientWidth, w;
      logo.style.fontSize = '100px';
      if (isPhone) {
        w = Math.max.apply(null, Array.prototype.map.call(logo.querySelectorAll('.word'), function (x) { return x.getBoundingClientRect().width; }));
      } else {
        var range = document.createRange(); range.selectNodeContents(logo); w = range.getBoundingClientRect().width;
      }
      logo.style.fontSize = (100 * target / w * .995) + 'px';
    }
    fitLogo();
    window.addEventListener('resize', function () { if (!html.classList.contains('intro-anim-playing')) { gsap.set(logo, { clearProps: 'transform' }); fitLogo(); ScrollTrigger.refresh(); } });
    gsap.set(logo, { scale: isPhone ? .5 : .25 });
    var r = logo.getBoundingClientRect();
    gsap.set(logo, { y: vh / 2 - (r.top + r.height / 2) });

    var tl = gsap.timeline({
      defaults: { duration: .6, ease: 'ff_expo_out' },
      onStart: function () { lenis.stop(); html.classList.add('intro-anim-playing'); },
      onComplete: function () { lenis.start(); html.classList.remove('intro-anim-playing'); titleSplit.revert(); }
    });
    tl.fromTo(circles, { drawSVG: '0%' }, { duration: 1, drawSVG: '100%', stagger: .02, ease: 'power2.out' })
      .fromTo(letters, { y: 200, opacity: 0 }, { duration: 1, y: 0, opacity: 1, stagger: .01, ease: 'power2.inOut' }, '<-0.4')
      .to(logo, { y: 0, scale: 1, duration: 1, ease: 'power4.inOut' }, '<+1')
      .from(image, { clipPath: 'inset(100% 0 0 0)', duration: 1, ease: 'power4.inOut' }, '<')
      .fromTo(image, { opacity: 0 }, { opacity: 1, duration: 2, ease: 'power2.out' }, '<+0.05')
      .from(titleSplit.words, { yPercent: 120, duration: .9, ease: 'expo.out', opacity: 0, stagger: .01 }, '<+0.4')
      .add(wysiwyg(document.querySelector('.vo-intro__text')), '<+0.1')
      .fromTo('.vo-intro__ctas .cta', { y: '1rem', opacity: 0 }, { y: 0, opacity: 1, duration: .9, stagger: .02, ease: 'expo.out', clearProps: 'transform' }, '<+0.2');

    // circles drift down while the intro scrolls away
    if (!isTouch) gsap.timeline({ scrollTrigger: { trigger: '.vo-intro', endTrigger: '.vo-intro__circles', start: 'top top', end: 'bottom top', scrub: true } })
      .to('.vo-intro__circles', { yPercent: 16, ease: 'none' }); /* the box moves, not the svg: transform on the big svg counted as layout shift */

    // ---------- montarville's "wysiwyg" block animation ----------
    function wysiwyg(el) {
      var t = gsap.timeline({ defaults: { ease: 'ff_expo_out', duration: 1.2 } });
      var kids = el.querySelectorAll('.surtitle, h1, h2, h3, h4, p, .cta-ctn, ul, ol');
      if (!kids.length) kids = [el];
      kids.forEach(function (o) {
        if (o.classList.contains('proj__title')) {
          // two-part title (left / right): split each part on its own so the layout stays
          var w = [];
          Array.prototype.forEach.call(o.children, function (c) { w = w.concat(SplitText.create(c, { type: 'words', mask: 'words', aria: 'none' }).words); });
          t.from(w, { yPercent: 110, stagger: { amount: .15 }, duration: 1.2, ease: 'ff_expo_out' }, '<+0.15');
        } else if (/^H[1-4]$/.test(o.tagName)) {
          var s = SplitText.create(o, { type: 'lines, words', mask: 'lines', autoSplit: true });
          t.from(s.words, { yPercent: 110, stagger: { amount: .15 }, duration: 1.2, ease: 'ff_expo_out' }, '<+0.15');
        } else {
          t.from(o, { opacity: 0, y: '4rem', filter: 'blur(3px)', willChange: 'opacity, filter', clearProps: 'all' }, '<+0.15');
        }
      });
      return t;
    }
    document.querySelectorAll('[data-anim-wysiwyg]').forEach(function (el) {
      gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 90%' } }).add(wysiwyg(el));
    });

    // ---------- image parallax (data-image-parallax) ----------
    if (!isTouch) document.querySelectorAll('[data-image-parallax]').forEach(function (box) {
      var img = box.querySelector('img');
      gsap.set(box, { overflow: 'hidden' }); gsap.set(img, { height: '125%' });
      gsap.timeline({ scrollTrigger: { trigger: box, start: 'top bottom', end: 'bottom 0', scrub: .3 } })
        .fromTo(img, { yPercent: -25 }, { yPercent: 0, ease: 'none' });
    });

    // ---------- 3. target cards (c-home-target__slider) ----------
    (function () {
      var cards = document.querySelectorAll('.tcard');
      var s = SplitText.create('.tcard__title', { type: 'lines' });
      var t = gsap.timeline({ defaults: { stagger: .15 }, scrollTrigger: { trigger: '.target__cards', start: 'top 95%' }, onComplete: function () { s.revert(); } });
      t.set(cards, { pointerEvents: 'none' })
        .from('.target__sep', { scaleX: 0, duration: 2, ease: 'ff_expo_out' })
        .from('.tcard .c-image', { clipPath: 'inset(100% 0 0 0)', duration: 1.2, ease: 'ff_expo_out', clearProps: 'clipPath' }, '<')
        .from(s.lines, { opacity: 0, yPercent: 100, duration: 1, ease: 'ff_expo_out', stagger: .05 }, '<+0.2')
        .from('.tcard .ibtn', { opacity: 0, duration: 1, ease: 'ff_expo_out' }, '<+=0.4')
        .set(cards, { pointerEvents: 'all' }, '<');
    })();

    // ---------- 3b. cost: 100 squares fill up with a month of office costs, then the rest fall away and the gold ones (VCORE) gather ----------
    (function () {
      var sec = document.querySelector('.vo-cost'); if (!sec) return;
      var grid = sec.querySelector('.vo-cost__grid'), track = sec.querySelector('.vo-cost__track'), now = sec.querySelector('.vo-cost__now');
      var rows = sec.querySelectorAll('.vo-cost__row'), costRows = [].slice.call(rows, 0, rows.length - 2), totalRow = rows[rows.length - 2], vRow = rows[rows.length - 1];
      var total = +totalRow.dataset.v, vcore = +vRow.dataset.v, shown = Math.floor((1 - vcore / total) * 10) * 10; // 91.75% is shown as 90%+
      var cells = [].slice.call(grid.children), kept = cells.filter(function (c) { return c.classList.contains('--keep'); }), gone = cells.filter(function (c) { return !c.classList.contains('--keep'); });
      var counter = sec.querySelector('.vo-cost__counter'), num = counter.querySelector('.num'), unit = counter.querySelector('small');
      var pct = sec.querySelector('.vo-cost__pct'), pctNum = pct.querySelector('.vo-cost__pct-num'), pctCap = pct.querySelector('.vo-cost__pct-cap'), year = sec.querySelector('.vo-cost__year');
      var fmt = function (v) { return Math.round(v).toLocaleString('el-GR'); };
      // the gold squares gather in a centred block (4 per row) in the lower part of the grid
      var bCols = Math.min(4, kept.length), bRows = Math.ceil(kept.length / bCols);
      function gather(axis) {
        return function (i, el) {
          var W = grid.clientWidth, H = grid.clientHeight, cs = el.offsetWidth, g = (W - 10 * cs) / 9;
          var bw = bCols * cs + (bCols - 1) * g, bh = bRows * cs + (bRows - 1) * g;
          return axis === 'x' ? (W - bw) / 2 + (i % bCols) * (cs + g) - el.offsetLeft : H * .78 - bh / 2 + Math.floor(i / bCols) * (cs + g) - el.offsetTop;
        };
      }
      // start state (the html and css show the end state)
      gsap.set(cells, { scale: 0, opacity: 0 });
      gsap.set(kept, { backgroundColor: function (i, el) { return el.style.getPropertyValue('--c'); }, boxShadow: '0 0 0px rgba(245,203,92,0)' });
      gsap.set(sec.querySelectorAll('.vo-cost__row .strike'), { scaleX: 0 });
      gsap.set([].concat(costRows, totalRow), { opacity: 0, y: 8 }); gsap.set(vRow, { opacity: 0, y: 10 });
      gsap.set(counter, { color: '#F5F1ED' }); num.textContent = '0'; unit.textContent = 'τον μήνα';
      gsap.set(pct, { opacity: 0, y: 30, scale: .92 }); gsap.set(pctCap, { opacity: 0, y: 8 }); pctNum.textContent = '0%';
      gsap.set(year, { opacity: 0 });
      var st = { v: 0 }, ps = { v: 0 }, sum = 0;
      var tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
      costRows.forEach(function (row, i) {
        sum += +row.dataset.v; var to = sum, mine = cells.filter(function (c) { return +c.dataset.c === i; });
        tl.addLabel('c' + i)
          .to(row, { opacity: 1, y: 0, duration: .3 }, 'c' + i)
          .fromTo(row.querySelector('.amt'), { color: '#F5CB5C' }, { color: '#F5F1ED', duration: .8, ease: 'none', immediateRender: false }, 'c' + i + '+=.1')
          .to(mine, { scale: 1, opacity: 1, duration: .45, ease: 'back.out(2.2)', stagger: { each: Math.min(.012, .55 / mine.length) } }, 'c' + i)
          .to(st, { v: to, duration: .5, ease: 'none', onUpdate: function () { num.textContent = fmt(st.v); } }, 'c' + i);
      });
      tl.addLabel('tot').to(totalRow, { opacity: 1, y: 0, duration: .3 })
        .to({}, { duration: .2, onUpdate: function () { num.textContent = fmt(total) + (this.progress() > .5 ? '+' : ''); } }) // the plus: office costs start at this amount
        .to({}, { duration: .4 })
        .addLabel('cut')
        .to(sec.querySelectorAll('.vo-cost__row .strike'), { scaleX: 1, duration: .45, stagger: .06, ease: 'power2.inOut' }, 'cut')
        .to([].concat(costRows, totalRow), { opacity: .6, duration: .4 }, 'cut+=.35')
        // the office squares collapse, top rows first, like a wall coming down
        .to(gone, { y: function () { return gsap.utils.random(160, 320); }, x: function () { return gsap.utils.random(-24, 24); }, rotation: function () { return gsap.utils.random(-70, 70); }, opacity: 0, duration: .9, ease: 'power2.in',
          stagger: function (i, el) { return Math.floor(cells.indexOf(el) / 10) * .05 + Math.random() * .05; } }, 'cut')
        .to(kept, { backgroundColor: '#F5CB5C', boxShadow: '0 0 22px rgba(245,203,92,.6)', duration: .45, stagger: .04 }, 'cut+=.6')
        .to(kept, { x: gather('x'), y: gather('y'), duration: .9, ease: 'expo.inOut', stagger: .03 }, 'cut+=1.1')
        .to(st, { v: vcore, duration: 1.2, ease: 'power3.inOut', onUpdate: function () { num.textContent = fmt(st.v); unit.textContent = this.progress() > .62 ? '+ ΦΠΑ τον μήνα' : 'τον μήνα'; } }, 'cut+=.35')
        .to(counter, { color: '#F5CB5C', duration: .4 }, 'cut+=1.1')
        .to(vRow, { opacity: 1, y: 0, duration: .5 }, 'cut+=1.1')
        .to(pct, { opacity: 1, y: 0, scale: 1, duration: .9, ease: 'expo.out' }, 'cut+=1.6')
        .to(ps, { v: shown, duration: .9, ease: 'power3.out', onUpdate: function () { pctNum.textContent = Math.round(ps.v) + '%' + (ps.v > shown - .5 ? '+' : ''); } }, 'cut+=1.6')
        .to(pctCap, { opacity: .85, y: 0, duration: .5 }, 'cut+=2.2')
        .to(year, { opacity: 1, duration: .5 }, 'cut+=2.2')
        .to({}, { duration: .5 });
      // phones: one line under the counter names the cost that is filling, then the VCORE price (same words as the list)
      var line = function (row, gold) { return '<span' + (gold ? ' class="--gold"' : '') + '>' + row.querySelector('.lbl').textContent + '<span class="amt">' + row.querySelector('.amt').textContent + '</span></span>'; };
      var steps = costRows.map(function (row, i) { return { t: tl.labels['c' + i], html: line(row) }; }).concat([{ t: tl.labels.tot, html: line(totalRow) }, { t: tl.labels.cut + 1.1, html: line(vRow, true) }]);
      if (now) tl.eventCallback('onUpdate', function () { var t = tl.time(), h = ''; steps.forEach(function (s) { if (t >= s.t) h = s.html; }); if (now.innerHTML !== h) now.innerHTML = h; });
      // the story follows the scroll everywhere (same media queries as the css): desktop, the whole screen is sticky in the tall section;
      // phones, the squares and the counter are sticky in their tall track, so nobody scrolls past them
      if (window.matchMedia('(min-width: 981px)').matches) ScrollTrigger.create({ trigger: sec, start: 'top top', end: 'bottom bottom', scrub: .7, animation: tl, invalidateOnRefresh: true });
      else ScrollTrigger.create({ trigger: track, start: 'top top', end: 'bottom bottom', scrub: .5, animation: tl, invalidateOnRefresh: true });
    })();

    // ---------- 4. numbered cards: one by one, with a gold line from each arrow to the next number ----------
    (function () {
      var list = document.querySelector('.exp__list');
      if (!list) return;
      var wraps = Array.prototype.slice.call(list.querySelectorAll('.ecard-wrap'));
      var NS = 'http://www.w3.org/2000/svg';
      var svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('class', 'exp__line');
      svg.setAttribute('aria-hidden', 'true');
      list.appendChild(svg);
      var lines = [];
      for (var k = 0; k < wraps.length - 1; k++) {
        var p = document.createElementNS(NS, 'path'); p.setAttribute('class', 'exp__line-path');
        var hd = document.createElementNS(NS, 'path'); hd.setAttribute('class', 'exp__line-head');
        svg.appendChild(p); svg.appendChild(hd);
        lines.push({ p: p, h: hd });
      }
      // positions from offsets, so the cards' own slide-in transform does not move the line
      function off(el) { var x = 0, y = 0; while (el && el !== list) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; } return { x: x, y: y }; }
      function textBox(el) {
        var r = document.createRange(); r.selectNodeContents(el);
        var t = r.getBoundingClientRect(), e = el.getBoundingClientRect(), o = off(el);
        return { l: o.x + (t.left - e.left), r: o.x + (t.right - e.left), m: o.y + (t.top - e.top) + t.height / 2, top: o.y + (t.top - e.top) };
      }
      function layout() {
        svg.setAttribute('width', list.offsetWidth);
        svg.setAttribute('height', list.offsetHeight);
        var narrow = innerWidth < 750;
        lines.forEach(function (ln, k) {
          var card = wraps[k].querySelector('.ecard'), btn = wraps[k].querySelector('.ibtn');
          var co = off(card), bo = off(btn);
          var num = wraps[k + 1].querySelector('.ecard__num'), nb = textBox(num);
          var d, h;
          if (narrow) {
            var x = nb.l + 6, y1 = co.y + card.offsetHeight + 8, y2 = nb.top - 8;
            d = 'M' + x + ',' + y1 + ' L' + x + ',' + y2;
            h = 'M' + (x - 5) + ',' + (y2 - 7) + ' L' + x + ',' + y2 + ' L' + (x + 5) + ',' + (y2 - 7);
          } else {
            var x1 = bo.x + btn.offsetWidth / 2, y1b = co.y + card.offsetHeight + 6;
            var toRight = getComputedStyle(num).textAlign === 'right';
            var ex = toRight ? nb.l - 14 : nb.r + 14, ey = nb.m, dir = ex > x1 ? 1 : -1;
            d = 'M' + x1 + ',' + y1b + ' C' + x1 + ',' + ey + ' ' + x1 + ',' + ey + ' ' + (x1 + dir * 30) + ',' + ey + ' L' + ex + ',' + ey;
            h = 'M' + (ex - dir * 8) + ',' + (ey - 5) + ' L' + ex + ',' + ey + ' L' + (ex - dir * 8) + ',' + (ey + 5);
          }
          ln.p.setAttribute('d', d);
          ln.h.setAttribute('d', h);
        });
      }
      layout();
      gsap.set(lines.map(function (l) { return l.h; }), { opacity: 0 });
      wraps.forEach(function (w, i) {
        var o = w.querySelector('.ecard'), num = w.querySelector('.ecard__num');
        var right = getComputedStyle(num).textAlign === 'right', narrow = innerWidth < 750;
        var title = SplitText.create(o.querySelector('.ecard__title'), { type: 'lines, words' });
        var desc = SplitText.create(o.querySelector('.ecard__desc'), { type: 'lines', mask: 'lines', aria: 'none' });
        var a = gsap.timeline({ defaults: { ease: 'ff_expo_out' }, scrollTrigger: { trigger: w, start: 'top 82%', once: true } });
        a.fromTo(num, { opacity: 0 }, { opacity: 1, duration: .8 })
          .fromTo(o, { opacity: 0, x: narrow ? 0 : (right ? 90 : -90), y: narrow ? 40 : 0 }, { opacity: 1, x: 0, y: 0, duration: 1.3, clearProps: 'transform' }, '<')
          .from(title.words, { yPercent: 100, opacity: 0, duration: 1, stagger: .03 }, '<+0.15')
          .from(desc.lines, { yPercent: 110, stagger: .05, duration: 1.2 }, '<+0.2')
          .fromTo(o.querySelectorAll('svg.deco path, svg.deco line, svg.deco circle, svg.deco ellipse'), { drawSVG: '0%' }, { duration: 1.4, drawSVG: '100%', stagger: .15, ease: 'power3.out' }, '<+0.2')
          .fromTo(o.querySelector('.ibtn'), { opacity: 0, scale: .6 }, { opacity: 1, scale: 1, duration: .8, ease: 'back.out(2)' }, '<+0.3');
        if (i < lines.length) {
          var ln = lines[i];
          gsap.timeline({ scrollTrigger: { trigger: wraps[i + 1], start: 'top 104%', end: 'top 84%', scrub: .6 } })
            .fromTo(ln.p, { drawSVG: '0%' }, { drawSVG: '100%', ease: 'none', duration: 1 })
            .to(ln.h, { opacity: 1, duration: .12 }, '>-0.04');
        }
      });
      window.addEventListener('resize', layout);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { layout(); ScrollTrigger.refresh(); });
    })();

    // ---------- 4b. "Μέσα στη VCORE": fixed photo, cards with a window, snap, 01 to 04 ----------
    (function () {
      var slots = Array.prototype.slice.call(document.querySelectorAll('.proj__slot'));
      var imgs = Array.prototype.slice.call(document.querySelectorAll('.proj__img'));
      var navs = Array.prototype.slice.call(document.querySelectorAll('.proj__nav button'));
      function setActive(i) {
        imgs.forEach(function (el, k) { el.classList.toggle('is-active', k === i); });
        navs.forEach(function (el, k) { el.classList.toggle('is-active', k === i); });
      }
      setActive(0);
      slots.forEach(function (slot, i) {
        ScrollTrigger.create({ trigger: slot, start: 'top 75%', end: 'bottom 25%', onEnter: function () { setActive(i); }, onEnterBack: function () { setActive(i); } });
        gsap.timeline({ scrollTrigger: { trigger: slot, start: 'top bottom', end: 'bottom top', scrub: .5 } })
          .from(imgs[i].querySelector('img'), { scale: 1.2 });
      });
      var n = slots.length;
      ScrollTrigger.create({
        trigger: '.proj__cards', start: 'top top', end: 'bottom bottom',
        snap: { snapTo: slots.map(function (s, i) { return i / (n - 1); }), delay: .2, duration: { min: .2, max: 2 }, ease: 'power3.inOut' }
      });
      navs.forEach(function (b, i) {
        b.addEventListener('click', function () { lenis.scrollTo(slots[i], { duration: 1.2 }); });
      });
    })();

    // closing circles
    gsap.fromTo('.closing__circles circle', { drawSVG: '0%' }, { duration: 1.2, drawSVG: '100%', stagger: .02, ease: 'power2.out', scrollTrigger: { trigger: '.closing', start: 'top 80%' } });

    ScrollTrigger.refresh();
  });
})();
