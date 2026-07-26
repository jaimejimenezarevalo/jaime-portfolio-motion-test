(() => {
  const header = document.querySelector('#motion-header');
  const logo = document.querySelector('#motion-logo');
  const identity = document.querySelector('#motion-identity');
  const divider = document.querySelector('#motion-divider');
  const links = [...document.querySelectorAll('#motion-nav a')];
  const cue = document.querySelector('#scroll-cue');
  const mobileButton = document.querySelector('.mobile-menu-button');
  const mobileNav = document.querySelector('#mobile-navigation');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 780px)');

  let ticking = false;
  let metrics = null;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const lerp = (start, end, progress) => start + (end - start) * progress;
  const ease = (t) => 1 - Math.pow(1 - t, 3);

  function measure() {
    if (mobile.matches) {
      metrics = null;
      return;
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const headerHeight = 104;
    const side = Math.max(24, vw * 0.018);

    // Logo final position.
    const logoSize = 76;
    const logoX = side;
    const logoY = (headerHeight - logoSize) / 2;

    // Identity starts centered and finishes to the right of the JJ monogram.
    const identityWidth = identity.offsetWidth;
    const identityHeight = identity.offsetHeight;
    const identityStartX = (vw - identityWidth) / 2;
    const identityStartY = Math.max(54, vh * 0.20);
    const identityFinalX = logoX + logoSize + 28;
    const identityFinalY = 27;

    // Nav starts as a vertical list slightly right of center.
    const initialNavCenterX = vw * 0.67;
    const initialNavStartY = Math.max(vh * 0.52, identityStartY + identityHeight + 150);
    const initialGap = 42;

    // Nav finishes as a horizontal row aligned to the right.
    const finalGap = clamp(vw * 0.027, 22, 45);
    const widths = links.map((link) => link.offsetWidth);
    const totalWidth = widths.reduce((sum, width) => sum + width, 0) + finalGap * (links.length - 1);
    let finalCursor = vw - side - totalWidth;

    const linkMetrics = links.map((link, index) => {
      const width = widths[index];
      const startX = initialNavCenterX - width / 2;
      const startY = initialNavStartY + index * initialGap;
      const finalX = finalCursor;
      const finalY = (headerHeight - link.offsetHeight) / 2;
      finalCursor += width + finalGap;
      return { startX, startY, finalX, finalY };
    });

    // Horizontal line becomes the vertical separator beside the identity block.
    const dividerStartWidth = Math.min(vw * 0.70, 860);
    const dividerStartX = (vw - dividerStartWidth) / 2;
    const dividerStartY = Math.max(vh * 0.42, identityStartY + identityHeight + 72);
    const dividerFinalX = identityFinalX + Math.min(identityWidth * 0.83, 455);
    const dividerFinalY = 20;

    metrics = {
      vh,
      headerHeight,
      logoX,
      logoY,
      identityStartX,
      identityStartY,
      identityFinalX,
      identityFinalY,
      dividerStartX,
      dividerStartY,
      dividerFinalX,
      dividerFinalY,
      dividerStartWidth,
      linkMetrics
    };
  }

  function render() {
    ticking = false;
    if (mobile.matches || !metrics) return;

    const raw = reduceMotion.matches ? (window.scrollY > 10 ? 1 : 0) : clamp(window.scrollY / 620, 0, 1);
    const p = ease(raw);
    const m = metrics;

    const currentHeight = lerp(m.vh, m.headerHeight, p);
    header.style.height = `${currentHeight}px`;

    logo.style.transform = `translate3d(${m.logoX}px, ${m.logoY}px, 0) scale(${lerp(.78, 1, p)})`;
    logo.style.opacity = String(clamp((p - .24) / .42, 0, 1));

    const identityScale = lerp(1, .39, p);
    const identityX = lerp(m.identityStartX, m.identityFinalX, p);
    const identityY = lerp(m.identityStartY, m.identityFinalY, p);
    identity.style.transform = `translate3d(${identityX}px, ${identityY}px, 0) scale(${identityScale})`;

    const dividerX = lerp(m.dividerStartX, m.dividerFinalX, p);
    const dividerY = lerp(m.dividerStartY, m.dividerFinalY, p);
    const dividerScaleX = lerp(1, 84 / m.dividerStartWidth, p);
    divider.style.transform = `translate3d(${dividerX}px, ${dividerY}px, 0) rotate(${lerp(0, 90, p)}deg) scaleX(${dividerScaleX})`;

    links.forEach((link, index) => {
      const item = m.linkMetrics[index];
      const x = lerp(item.startX, item.finalX, p);
      const y = lerp(item.startY, item.finalY, p);
      link.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });

    cue.style.opacity = String(clamp(1 - raw * 4, 0, 1));
    document.body.classList.toggle('intro-complete', raw >= .98);
  }

  function requestRender() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(render);
    }
  }

  function setup() {
    measure();
    render();
  }

  window.addEventListener('scroll', requestRender, { passive: true });
  window.addEventListener('resize', setup);
  reduceMotion.addEventListener?.('change', setup);
  mobile.addEventListener?.('change', setup);
  window.addEventListener('load', setup);
  document.fonts?.ready.then(setup);

  mobileButton?.addEventListener('click', () => {
    const open = mobileNav.classList.toggle('open');
    mobileButton.setAttribute('aria-expanded', String(open));
    mobileButton.textContent = open ? 'Close' : 'Menu';
  });

  document.querySelectorAll('.mobile-navigation a').forEach((link) => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      mobileButton.setAttribute('aria-expanded', 'false');
      mobileButton.textContent = 'Menu';
    });
  });

  // Highlight the section currently in view after the intro is assembled.
  const sections = [...document.querySelectorAll('main section[id], footer[id]')];
  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    links.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${visible.target.id}`));
  }, { rootMargin: '-20% 0px -60% 0px', threshold: [0.01, 0.2, 0.5] });
  sections.forEach((section) => observer.observe(section));
})();
