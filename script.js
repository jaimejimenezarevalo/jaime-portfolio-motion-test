(() => {
  const header = document.querySelector('#motion-header');
  const logo = document.querySelector('#motion-logo');
  const identity = document.querySelector('#motion-identity');
  const identityName = identity.querySelector('strong');
  const identityTitle = identity.querySelector('small');
  const horizontalDivider = document.querySelector('#motion-divider');
  const verticalDivider = document.querySelector('#motion-divider-vertical');
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

  function resetDesktopStyles() {
    identityName.style.fontSize = '';
    identityTitle.style.fontSize = '';
    identity.style.transform = '';
    horizontalDivider.style.transform = '';
    horizontalDivider.style.opacity = '';
    verticalDivider.style.transform = '';
    verticalDivider.style.opacity = '';
  }

  function measure() {
    if (mobile.matches) {
      metrics = null;
      return;
    }

    resetDesktopStyles();

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const headerHeight = 104;
    const side = Math.max(24, vw * 0.018);

    const logoSize = 76;
    const logoX = side;
    const logoY = (headerHeight - logoSize) / 2;

    const startNameSize = parseFloat(getComputedStyle(identityName).fontSize);
    const startTitleSize = parseFloat(getComputedStyle(identityTitle).fontSize);
    const finalNameSize = clamp(vw * 0.02, 16.8, 23.2);
    const finalTitleSize = 13.3;

    const identityWidth = identity.offsetWidth;
    const identityHeight = identity.offsetHeight;
    const identityStartX = (vw - identityWidth) / 2;
    const identityStartY = Math.max(54, vh * 0.18);
    const identityFinalX = logoX + logoSize + 28;
    const identityFinalY = 25;

    // Approximate final text width from the measured opening width.
    const finalIdentityWidth = identityWidth * (finalNameSize / startNameSize);

    // The intro navigation is now perfectly centered under the title and rule.
    const initialNavCenterX = vw / 2;
    const initialNavStartY = Math.max(vh * 0.50, identityStartY + identityHeight + 125);
    const initialGap = 42;

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

    const dividerStartWidth = Math.min(vw * 0.70, 860);
    const dividerStartX = (vw - dividerStartWidth) / 2;
    const dividerStartY = Math.max(vh * 0.40, identityStartY + identityHeight + 68);

    // Put the final separator directly after the compact identity block,
    // matching the original header rather than landing among the nav links.
    const dividerFinalX = identityFinalX + finalIdentityWidth + 28;
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
      startNameSize,
      startTitleSize,
      finalNameSize,
      finalTitleSize,
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

    header.style.height = `${lerp(m.vh, m.headerHeight, p)}px`;

    logo.style.transform = `translate3d(${m.logoX}px, ${m.logoY}px, 0) scale(${lerp(.78, 1, p)})`;
    logo.style.opacity = String(clamp((p - .24) / .42, 0, 1));

    identityName.style.fontSize = `${lerp(m.startNameSize, m.finalNameSize, p)}px`;
    identityTitle.style.fontSize = `${lerp(m.startTitleSize, m.finalTitleSize, p)}px`;
    identity.style.transform = `translate3d(${lerp(m.identityStartX, m.identityFinalX, p)}px, ${lerp(m.identityStartY, m.identityFinalY, p)}px, 0)`;

    // A cross-fade between two rules creates a clean visual morph without
    // rotating a long bar through the navigation.
    const horizontalProgress = clamp(p / .68, 0, 1);
    const horizontalWidth = lerp(m.dividerStartWidth, m.dividerStartWidth * .18, horizontalProgress);
    const horizontalX = (window.innerWidth - horizontalWidth) / 2;
    horizontalDivider.style.width = `${horizontalWidth}px`;
    horizontalDivider.style.transform = `translate3d(${horizontalX}px, ${lerp(m.dividerStartY, m.dividerStartY - 15, horizontalProgress)}px, 0)`;
    horizontalDivider.style.opacity = String(clamp(1 - p * 1.65, 0, 1));

    // Keep the compact divider completely out of sight during the move.
    // It appears only once the identity has essentially reached its final position.
    verticalDivider.style.transform = `translate3d(${m.dividerFinalX}px, ${m.dividerFinalY}px, 0) scaleY(1)`;
    verticalDivider.style.opacity = String(clamp((raw - .94) / .06, 0, 1));

    links.forEach((link, index) => {
      const item = m.linkMetrics[index];
      link.style.transform = `translate3d(${lerp(item.startX, item.finalX, p)}px, ${lerp(item.startY, item.finalY, p)}px, 0)`;
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
