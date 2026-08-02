document.getElementById('year').textContent = new Date().getFullYear();

const transition = document.createElement('div');
transition.className = 'page-transition';
transition.setAttribute('aria-hidden', 'true');
transition.setAttribute('role', 'status');
transition.innerHTML = `
  <div class="transition-brand">
    <div class="transition-lockup"><img src="/brand-icon.png" alt="" /><span><b>saia</b> <em>da teoria</em></span></div>
    <span class="transition-spinner"></span>
    <p>Opening your workspace...</p>
  </div>`;
document.body.appendChild(transition);

let navigating = false;

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
  mobileMenu.innerHTML = `
    <a href="/#features">Features</a>
    <a href="/#how-it-works">How it works</a>
    <a href="/security">Security</a>
    <a href="/privacy">Privacy</a>
    <a href="/terms">Terms</a>
    <a href="mailto:contact@saiadateoria.com?subject=Request%20access%20to%20Saia%20da%20Teoria">Request access</a>
    <a class="mobile-app-link" href="https://app.saiadateoria.com">Sign in <span>↗</span></a>`;

  const closeMenu = () => {
    navigation.classList.remove('menu-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open menu');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('mobile-menu-open');
  };

  menuButton.addEventListener('click', () => {
    const opening = menuButton.getAttribute('aria-expanded') !== 'true';
    navigation.classList.toggle('menu-open', opening);
    menuButton.setAttribute('aria-expanded', String(opening));
    menuButton.setAttribute('aria-label', opening ? 'Close menu' : 'Open menu');
    mobileMenu.setAttribute('aria-hidden', String(!opening));
    document.body.classList.toggle('mobile-menu-open', opening);
  });

  mobileMenu.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMenu();
      menuButton.focus();
    }
  });

  navigation.insertBefore(menuButton, navigation.querySelector(':scope > .button'));
  navigation.appendChild(mobileMenu);
}

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href]');
  if (!link || event.defaultPrevented || navigating) return;
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (link.target === '_blank' || link.hasAttribute('download')) return;

  const destination = new URL(link.href, window.location.href);
  if (!['http:', 'https:'].includes(destination.protocol)) return;
  if (destination.origin === window.location.origin && destination.pathname === window.location.pathname && destination.hash) return;

  const opensApp = destination.hostname === 'app.saiadateoria.com';
  const staysOnSite = destination.origin === window.location.origin;
  if (!opensApp && !staysOnSite) return;

  event.preventDefault();
  navigating = true;

  if (opensApp) {
    transition.classList.add('is-visible');
    transition.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-opening-app');
    window.requestAnimationFrame(() => window.location.assign(destination.href));
    return;
  }

  window.location.assign(destination.href);
});

window.addEventListener('pageshow', () => {
  navigating = false;
  document.body.classList.remove('is-opening-app');
  transition.classList.remove('is-visible');
  transition.setAttribute('aria-hidden', 'true');
});
