const SELECTORS = {
  FEED_HEADER: '.feed-header',
  FEED_UI: '.feed-ui',
  FEATURE_FEED: '.feature-feed',
  FEED_FORM: 'form',
  FEED_ENTRY: "[data-testid='web-feed-entry']",
  ENTRY_HEADER: "[data-testid='entry-header']",
  OWNER_LINK: "a[data-testid='owners-name']",
  KUDOS_BUTTON: "[data-testid='kudos_button']",
  UNFILLED_KUDOS: "svg[data-testid='unfilled_kudos']",
  AVATAR: "a[data-testid='avatar-wrapper']",
};

export function getLoggedInAthleteId() {
  const avatar = document.querySelector(SELECTORS.AVATAR);
  if (!avatar?.href) return null;
  const id = Number.parseInt(avatar.href.split('/').pop(), 10);
  return Number.isNaN(id) ? null : id;
}

function animateCount(el, total) {
  const btn = el.closest('button');
  if (btn) btn.disabled = true;

  let current = 0;
  el.textContent = `0 / ${total}`;

  const tick = () => {
    current++;
    el.textContent = `${current} / ${total}`;
    if (current < total) {
      setTimeout(tick, 60);
    } else {
      setTimeout(() => {
        el.textContent = 'Kudo All';
        if (btn) btn.disabled = false;
      }, 2000);
    }
  };

  setTimeout(tick, 60);
}

export function createButton() {
  const wrapper = document.createElement('div');
  wrapper.classList.add('ka-button');
  Object.assign(wrapper.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: '9999',
  });
  wrapper.innerHTML = `
    <button type="button" class="btn btn-primary btn-sm" style="border-radius:24px;padding:10px 18px;display:flex;align-items:center;gap:8px;box-shadow:0 4px 14px rgba(0,0,0,0.25);cursor:pointer;">
      <div class="app-icon icon-kudo icon-white"></div>
      <span class="ka-progress">Kudo All</span>
    </button>
  `.trim();
  wrapper.addEventListener('click', (event) => {
    const count = kudoAllHandler(event);
    const progress = wrapper.querySelector('.ka-progress');
    if (count > 0 && progress) animateCount(progress, count);
  });
  return wrapper;
}

export function kudoAllHandler(event) {
  event?.preventDefault();

  const athleteId = getLoggedInAthleteId();
  let count = 0;

  document.querySelectorAll(SELECTORS.FEED_ENTRY).forEach((entry) => {
    entry.querySelectorAll(SELECTORS.ENTRY_HEADER).forEach((entryHeader) => {
      const activity = entryHeader.parentElement;
      if (!activity) return;

      activity.querySelectorAll(SELECTORS.OWNER_LINK).forEach((link) => {
        if (!link?.href) return;

        const feedAthleteId = Number.parseInt(link.href.split('/').pop(), 10);
        if (feedAthleteId === athleteId) return;

        const btn = activity.querySelector(SELECTORS.KUDOS_BUTTON);
        if (!btn) return;

        if (!btn.querySelector(SELECTORS.UNFILLED_KUDOS)) return;

        btn.click();
        count++;
      });
    });
  });

  return count;
}

export function buttonAlreadyInjected() {
  return !!document.querySelector('.ka-button');
}

export function init() {
  const tryInject = () => {
    if (buttonAlreadyInjected()) return;
    document.body.append(createButton());
  };

  tryInject();

  const observer = new MutationObserver(tryInject);
  observer.observe(document.body, { childList: true, subtree: true });
}
