/* Site header behaviour, copied from el/index.html so the header works the same as on every other page */
(function () {
    // =====================================================
    // HEADER SCROLL HIDE/SHOW
    // =====================================================
    let lastScroll = 0;
    const header = document.querySelector('#site-header');
    const scrollThreshold = 100;

    if (header) {
      window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        if (currentScroll <= scrollThreshold) { header.style.transform = 'translateY(0)'; return; }
        if (currentScroll > lastScroll && currentScroll > scrollThreshold) {
          header.style.transform = 'translateY(-100%)';
        } else if (currentScroll < lastScroll) {
          header.style.transform = 'translateY(0)';
        }
        lastScroll = currentScroll;
      });
    }

    // =====================================================
    // HAMBURGER MENU
    // =====================================================
    const hamburger = document.getElementById('hamburger-btn');
    const mobileNav = document.getElementById('mobile-nav');

    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      hamburger.setAttribute('aria-expanded', String(hamburger.classList.contains('active')));
      mobileNav.classList.toggle('active');
      document.body.classList.toggle('nav-open');
    });

    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        mobileNav.classList.remove('active');
        document.body.classList.remove('nav-open');
      });
    });

})();
