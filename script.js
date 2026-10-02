document.getElementById('year').textContent = new Date().getFullYear();

document.querySelectorAll('a[href="/cdr-policy"]').forEach((link) => {
  if (link.textContent.trim() === 'CDR Policy') link.textContent = 'CDR readiness';
});

document.querySelectorAll('footer > div').forEach((column) => {
  const heading = column.querySelector('strong')?.textContent.trim();
  if (heading === 'Product') column.innerHTML = '<strong>Product</strong><a href="/features">Overview</a><a href="/net-worth">Net worth</a><a href="/cash-flow">Cash flow</a><a href="https://app.saiadateoria.com" target="_blank" rel="noopener">Sign in</a>';
  if (heading === 'Trust') column.innerHTML = '<strong>Trust</strong><a href="/security">Security</a><a href="/privacy">Privacy</a><a href="/cdr-policy">CDR readiness</a>';
  if (heading === 'Company') column.innerHTML = '<strong>Company</strong><a href="/about">About</a><a href="/contact">Contact</a><a href="/terms">Terms</a><span>GPF IT SOLUTIONS PTY LTD<br>ABN 57 638 578 140</span>';
});

const mainContent = document.querySelector('main');
if (mainContent) {
  mainContent.id = 'main-content';
  mainContent.tabIndex = -1;
  const skipLink = document.createElement('a');
  skipLink.className = 'skip-link';
  skipLink.href = '#main-content';
  skipLink.textContent = 'Skip to main content';
  document.body.prepend(skipLink);
}

const transition = document.createElement('div');
transition.className = 'page-transition';
transition.setAttribute('aria-hidden', 'true');
transition.setAttribute('role', 'status');
transition.setAttribute('aria-live', 'polite');
transition.innerHTML = `
  <div class="transition-brand">
    <div class="transition-lockup"><img src="/brand-icon.png" alt="" /><span><b>saia</b> <em>da teoria</em></span></div>
    <span class="transition-spinner"></span>
    <p>Opening your workspace...</p>
  </div>`;
document.body.appendChild(transition);

// Header is fixed (stays visible while scrolling, like PocketSmith's site) and starts
// transparent so it blends into the hero. This swaps in a solid/blurred background once
// the page has scrolled past the hero, so text stays readable over whatever content is
// underneath. Re-evaluated on every scroll tick rather than toggled once, so it can't get
// stuck in the wrong state the way a one-shot event-driven lock could.
const siteHeader = document.querySelector('.site-header');
if (siteHeader) {
  const updateHeaderBackground = () => {
    siteHeader.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  updateHeaderBackground();
  window.addEventListener('scroll', updateHeaderBackground, { passive: true });
}

const navigation = document.querySelector('.nav');
if (navigation) {
  const menuButton = document.createElement('button');
  menuButton.className = 'menu-button';
  menuButton.type = 'button';
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-controls', 'mobile-menu');
  menuButton.setAttribute('aria-label', 'Open menu');
  menuButton.innerHTML = '<span></span><span></span>';

  const mobileMenu = document.createElement('div');
  mobileMenu.id = 'mobile-menu';
  mobileMenu.className = 'mobile-menu';
  mobileMenu.setAttribute('aria-hidden', 'true');
  mobileMenu.inert = true;
  mobileMenu.innerHTML = `
    <a href="/features">Product</a>
    <a href="/security">Security</a>
    <a href="/about">About</a>
    <a href="/contact">Contact</a>
    <a href="/privacy">Privacy</a>
    <a href="/terms">Terms</a>
    <a href="/contact?subject=private-beta">Request access</a>
    <a class="mobile-app-link" href="https://app.saiadateoria.com" target="_blank" rel="noopener">Sign in <span>↗</span></a>`;

  const closeMenu = () => {
    navigation.classList.remove('menu-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open menu');
    mobileMenu.setAttribute('aria-hidden', 'true');
    mobileMenu.inert = true;
    document.body.classList.remove('mobile-menu-open');
  };

  menuButton.addEventListener('click', () => {
    const opening = menuButton.getAttribute('aria-expanded') !== 'true';
    navigation.classList.toggle('menu-open', opening);
    menuButton.setAttribute('aria-expanded', String(opening));
    menuButton.setAttribute('aria-label', opening ? 'Close menu' : 'Open menu');
    mobileMenu.setAttribute('aria-hidden', String(!opening));
    mobileMenu.inert = !opening;
    document.body.classList.toggle('mobile-menu-open', opening);
  });

  mobileMenu.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menuButton.focus();
    }
  });

  navigation.insertBefore(menuButton, navigation.querySelector(':scope > .button'));
  navigation.appendChild(mobileMenu);
}

// Shows the "Opening your workspace..." transition when a link heads to the
// app, without ever intercepting the click - the browser's own navigation
// still runs normally no matter what happens here. An earlier version called
// preventDefault() and navigated manually behind a single global "navigating"
// lock that only reset on the pageshow event; anything that stopped that
// reset from firing left the lock stuck true, which made the click handler
// silently ignore every further link on the site (menu included) until a
// full reload. Letting the browser handle navigation natively removes that
// failure mode entirely.
document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href]');
  if (!link || event.defaultPrevented) return;
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (link.target === '_blank' || link.hasAttribute('download')) return;

  let destination;
  try {
    destination = new URL(link.href, window.location.href);
  } catch {
    return;
  }
  if (destination.hostname !== 'app.saiadateoria.com') return;

  transition.classList.add('is-visible');
  transition.setAttribute('aria-hidden', 'false');
  document.body.classList.add('is-opening-app');
});

window.addEventListener('pageshow', () => {
  document.body.classList.remove('is-opening-app');
  transition.classList.remove('is-visible');
  transition.setAttribute('aria-hidden', 'true');
});

// Contact form: posts to the /api/contact serverless function, which forwards it to
// Resend. The "hp_field" input is a honeypot checked server-side - it stays visually
// hidden and out of tab order, so only a bot filling every field blind would trip it.
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  // "Request access" buttons across the site link here with ?subject=<slug> instead of a
  // mailto: - this pre-selects the matching option so the one piece of context those
  // buttons used to carry (the mailto subject line) isn't lost.
  const subjectSlugs = { 'private-beta': 'Private beta', 'product-support': 'Product support', 'privacy-security': 'Privacy or security' };
  const requestedSubject = subjectSlugs[new URLSearchParams(location.search).get('subject')];
  if (requestedSubject) {
    const subjectSelect = document.getElementById('cf-subject');
    if (subjectSelect) subjectSelect.value = requestedSubject;
    document.getElementById('cf-name')?.focus();
  }

  const statusEl = document.getElementById('cf-status');
  const turnstileEl = document.querySelector('.cf-turnstile');
  const resetTurnstile = () => window.turnstile?.reset(turnstileEl);

  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (contactForm.classList.contains('is-submitting')) return;

    const data = Object.fromEntries(new FormData(contactForm).entries());
    statusEl.textContent = '';
    statusEl.removeAttribute('data-state');

    // Turnstile's token is a form field named "cf-turnstile-response", already picked up
    // by FormData above since the widget lives inside the <form>. Checked here too so a
    // visitor who hasn't completed it yet gets a clear message instead of a server 400.
    if (!data['cf-turnstile-response']) {
      statusEl.textContent = 'Please complete the verification above before sending.';
      statusEl.setAttribute('data-state', 'error');
      return;
    }

    contactForm.classList.add('is-submitting');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || 'Something went wrong. Please try again.');
      }

      contactForm.reset();
      statusEl.textContent = "Message sent. We'll get back to you by email.";
      statusEl.setAttribute('data-state', 'success');
    } catch (err) {
      statusEl.textContent = err.message === 'Failed to fetch'
        ? "Could not reach the server. Please try again, or email contact@saiadateoria.com directly."
        : (err.message || 'Something went wrong. Please try again.');
      statusEl.setAttribute('data-state', 'error');
    } finally {
      contactForm.classList.remove('is-submitting');
      resetTurnstile();
    }
  });
}
