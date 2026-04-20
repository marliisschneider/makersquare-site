/* ══════════════════════════════════════════════════════════════════════════════
   MAKERSQUARE — Shared JS (animations, accordion, counters, nav)
   ══════════════════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── SCROLL REVEAL ──────────────────────────────────────────────────────── */
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach(el => observer.observe(el));
  }


  /* ── NAV SCROLL SHADOW ──────────────────────────────────────────────────── */
  const nav = document.querySelector('.nav');
  if (nav) {
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      nav.classList.toggle('scrolled', y > 20);
      lastScroll = y;
    }, { passive: true });
  }


  /* ── MOBILE MENU ────────────────────────────────────────────────────────── */
  const hamburger = document.querySelector('.nav-hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
      document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });
    // Close on link click
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }


  /* ── FAQ ACCORDION ──────────────────────────────────────────────────────── */
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const answer = item.querySelector('.faq-answer');
      const isOpen = item.classList.contains('open');

      // Close all
      document.querySelectorAll('.faq-item.open').forEach(openItem => {
        openItem.classList.remove('open');
        openItem.querySelector('.faq-answer').style.maxHeight = '0';
      });

      // Open clicked (if it wasn't already open)
      if (!isOpen) {
        item.classList.add('open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });


  /* ── NUMBER COUNTER ANIMATION ───────────────────────────────────────────── */
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = el.getAttribute('data-count');
          const prefix = el.getAttribute('data-prefix') || '';
          const suffix = el.getAttribute('data-suffix') || '';
          const duration = 1200;
          const start = performance.now();

          // Check if target is a number
          const numTarget = parseFloat(target);
          if (isNaN(numTarget)) {
            el.textContent = prefix + target + suffix;
            counterObserver.unobserve(el);
            return;
          }

          const step = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const ease = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(numTarget * ease);
            el.textContent = prefix + current + suffix;
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          counterObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(el => counterObserver.observe(el));
  }


  /* ── SMOOTH ANCHOR SCROLLING ────────────────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = nav ? nav.offsetHeight + 20 : 80;
        window.scrollTo({
          top: target.offsetTop - offset,
          behavior: 'smooth'
        });
      }
    });
  });

});
