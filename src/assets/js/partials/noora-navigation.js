// Add keyboard/focus semantics to Raed's existing mmenu drawer, without replacing it.
export default function enhanceNooraDrawer(menu, drawer) {
  const trigger = document.querySelector('.nl-menu-toggle');
  if (!trigger) return;
  const content = drawer.content;
  const label = salla.lang.get('noora.menu');
  let previousFocus;
  let wasOpen = false;
  const focusable = () => [...content.querySelectorAll('a[href], button, [tabindex="0"]')]
    .filter(node => node.getClientRects().length && !node.disabled);
  menu.setAttribute('aria-label', label);
  menu.querySelectorAll('.close-mobile-menu').forEach(button => button.setAttribute('aria-label', salla.lang.get('noora.close')));
  // The drawer library renders expandable submenu labels as spans.
  menu.querySelectorAll('li > span').forEach(label => {
    if (!label.parentElement.querySelector(':scope > ul')) return;
    label.tabIndex = 0;
    label.setAttribute('role', 'button');
    const syncExpanded = () => label.setAttribute('aria-expanded', String(label.parentElement.querySelector(':scope > ul').classList.contains('mm-spn--open')));
    label.addEventListener('click', () => queueMicrotask(syncExpanded));
    syncExpanded();
    label.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); label.click(); }
    });
  });
  const sync = () => {
    const open = drawer.wrapper.classList.contains('mm-ocd--open');
    trigger.setAttribute('aria-expanded', String(open));
    if (open) {
      content.setAttribute('role', 'dialog');
      content.setAttribute('aria-modal', 'true');
      content.setAttribute('aria-label', label);
      if (!wasOpen) {
        previousFocus = document.activeElement === document.body ? trigger : document.activeElement;
        (focusable()[0] || trigger).focus();
      }
    } else {
      content.removeAttribute('role');
      content.removeAttribute('aria-modal');
      document.body.classList.remove('menu-opened');
      if (wasOpen && previousFocus?.isConnected && previousFocus.getClientRects().length) previousFocus.focus();
    }
    wasOpen = open;
  };
  new MutationObserver(sync).observe(drawer.wrapper, {attributes: true, attributeFilter: ['class']});
  content.addEventListener('keydown', event => {
    if (!drawer.wrapper.classList.contains('mm-ocd--open')) return;
    if (event.key === 'Escape') { event.preventDefault(); drawer.close(); return; }
    if (event.key !== 'Tab') return;
    const controls = focusable(), first = controls[0], last = controls.at(-1);
    if (!first) { event.preventDefault(); return; }
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  sync();
}
