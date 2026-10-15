/* Efeitos opcionais: o conteúdo continua disponível sem JavaScript. */
(function () {
  'use strict';
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const canObserve = 'IntersectionObserver' in window;

  function onceVisible(elements, callback, options) {
    if (!canObserve || motion.matches) {
      elements.forEach(callback);
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        callback(entry.target);
        observer.unobserve(entry.target);
      });
    }, options);
    elements.forEach(el => observer.observe(el));
  }

  const reveals = document.querySelectorAll('.reveal');
  if (canObserve && !motion.matches) {
    reveals.forEach(el => el.classList.add('is-pending'));
  }
  onceVisible(reveals, el => el.classList.add('visible'), { threshold: 0.1 });

  const gauge = document.querySelector('.hero__gauge-fill');
  if (gauge && canObserve && !motion.matches) {
    gauge.style.strokeDashoffset = '251';
    onceVisible([gauge], el => { el.style.strokeDashoffset = '75.3'; }, { threshold: 0.1 });
  }

  const barHeights = [35, 55, 42, 70, 60, 78, 65, 48, 82, 70];
  document.querySelectorAll('.hero__bar').forEach((bar, i) => {
    bar.style.height = `${barHeights[i] ?? 50}%`;
  });

  function animateCounter(el) {
    const target = Number.parseFloat(el.dataset.target ?? el.textContent);
    if (!Number.isFinite(target)) return;
    const suffix = el.dataset.suffix ?? '';
    const decimals = Math.min(20, Math.max(0, Number.parseInt(el.dataset.decimals, 10) || 0));
    const finalText = target.toFixed(decimals) + suffix;
    if (motion.matches || !canObserve) { el.textContent = finalText; return; }
    const start = performance.now();
    function step(now) {
      const progress = Math.min((now - start) / 1800, 1);
      if (motion.matches || progress === 1) { el.textContent = finalText; return; }
      el.textContent = (target * (1 - Math.pow(1 - progress, 3))).toFixed(decimals) + suffix;
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  onceVisible(document.querySelectorAll('[data-counter]'), animateCounter, { threshold: 0.1 });

  const glows = document.querySelectorAll('.hero__glow-1, .hero__glow-2');
  function parallax(event) {
    if (motion.matches) return;
    const x = (event.clientX / window.innerWidth - 0.5) * 20;
    const y = (event.clientY / window.innerHeight - 0.5) * 20;
    glows.forEach((glow, i) => {
      const factor = i === 0 ? 1 : -0.5;
      glow.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
    });
  }
  if (glows.length) window.addEventListener('mousemove', parallax, { passive: true });
  motion.addEventListener('change', () => {
    if (!motion.matches) return;
    reveals.forEach(el => el.classList.add('visible'));
    glows.forEach(el => { el.style.transform = ''; });
    if (gauge) gauge.style.strokeDashoffset = '75.3';
  });
})();
