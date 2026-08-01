document.getElementById('year').textContent = new Date().getFullYear();

const transition = document.createElement('div');
transition.className = 'page-transition';
transition.setAttribute('aria-hidden', 'true');
transition.innerHTML = `
  <div class="transition-brand">
    <div class="transition-lockup"><img src="/brand-icon.png" alt="" /><span><b>saia</b> <em>da teoria</em></span></div>
    <span class="transition-spinner"></span>
    <p>Opening your workspace...</p>
  </div>`;
document.body.appendChild(transition);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let navigating = false;

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
    window.setTimeout(() => window.location.assign(destination.href), reduceMotion.matches ? 120 : 700);
    return;
  }

  document.body.classList.add('is-leaving');
  window.setTimeout(() => window.location.assign(destination.href), reduceMotion.matches ? 0 : 180);
});

window.addEventListener('pageshow', () => {
  navigating = false;
  document.body.classList.remove('is-leaving', 'is-opening-app');
  transition.classList.remove('is-visible');
  transition.setAttribute('aria-hidden', 'true');
});
