import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  getLoggedInAthleteId,
  createButton,
  kudoAllHandler,
  buttonAlreadyInjected,
  init,
} from '../src/kudoall.js';

beforeEach(() => {
  document.body.innerHTML = '';
});

// Builds a feed DOM with a logged-in athlete and a list of feed entries.
// Each activity has one owner and a kudos button (optionally unfilled).
function buildFeed(ownerId, activities) {
  const entries = activities
    .map(
      ({ athleteId, hasUnfilledKudos }) => `
      <div data-testid="web-feed-entry">
        <div data-testid="entry-header">
          <div>
            <a data-testid="owners-name" href="https://www.strava.com/athletes/${athleteId}">Athlete</a>
            <div data-testid="kudos_button">
              ${hasUnfilledKudos ? '<svg data-testid="unfilled_kudos"></svg>' : ''}
            </div>
          </div>
        </div>
      </div>
    `,
    )
    .join('');

  return `
    <a data-testid="avatar-wrapper" href="https://www.strava.com/athletes/${ownerId}"></a>
    ${entries}
  `;
}

describe('getLoggedInAthleteId', () => {
  it('returns the athlete id from the avatar link', () => {
    document.body.innerHTML = `<a data-testid="avatar-wrapper" href="https://www.strava.com/athletes/123456"></a>`;
    expect(getLoggedInAthleteId()).toBe(123456);
  });

  it('returns null when no avatar element is present', () => {
    expect(getLoggedInAthleteId()).toBeNull();
  });

  it('returns null when the href does not contain a valid id', () => {
    document.body.innerHTML = `<a data-testid="avatar-wrapper" href="https://www.strava.com/athletes/abc"></a>`;
    expect(getLoggedInAthleteId()).toBeNull();
  });
});


describe('createButton', () => {
  it('creates a wrapper with class ka-button', () => {
    expect(createButton().classList.contains('ka-button')).toBe(true);
  });

  it('contains a button element', () => {
    expect(createButton().querySelector('button')).not.toBeNull();
  });

  it('is positioned fixed', () => {
    expect(createButton().style.position).toBe('fixed');
  });

  it('contains a .ka-progress element', () => {
    expect(createButton().querySelector('.ka-progress')).not.toBeNull();
  });
});

describe('buttonAlreadyInjected', () => {
  it('returns false when no button is present', () => {
    expect(buttonAlreadyInjected()).toBe(false);
  });

  it('returns true when .ka-button exists in the DOM', () => {
    document.body.innerHTML = `<div class="ka-button"></div>`;
    expect(buttonAlreadyInjected()).toBe(true);
  });
});

describe('kudoAllHandler', () => {
  it('clicks unfilled kudos button for other athletes', () => {
    document.body.innerHTML = buildFeed(1, [{ athleteId: 2, hasUnfilledKudos: true }]);
    const btn = document.querySelector("[data-testid='kudos_button']");
    const spy = jest.spyOn(btn, 'click');
    kudoAllHandler();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('skips own activities', () => {
    document.body.innerHTML = buildFeed(1, [{ athleteId: 1, hasUnfilledKudos: true }]);
    const btn = document.querySelector("[data-testid='kudos_button']");
    const spy = jest.spyOn(btn, 'click');
    kudoAllHandler();
    expect(spy).not.toHaveBeenCalled();
  });

  it('skips activities that already have kudos', () => {
    document.body.innerHTML = buildFeed(1, [{ athleteId: 2, hasUnfilledKudos: false }]);
    const btn = document.querySelector("[data-testid='kudos_button']");
    const spy = jest.spyOn(btn, 'click');
    kudoAllHandler();
    expect(spy).not.toHaveBeenCalled();
  });

  it('handles a mixed feed correctly', () => {
    document.body.innerHTML = buildFeed(1, [
      { athleteId: 2, hasUnfilledKudos: true },  // should click
      { athleteId: 1, hasUnfilledKudos: true },  // own — skip
      { athleteId: 3, hasUnfilledKudos: true },  // should click
      { athleteId: 4, hasUnfilledKudos: false }, // already kudoed — skip
    ]);
    const buttons = Array.from(document.querySelectorAll("[data-testid='kudos_button']"));
    const spies = buttons.map((btn) => jest.spyOn(btn, 'click'));
    kudoAllHandler();
    expect(spies[0]).toHaveBeenCalledTimes(1);
    expect(spies[1]).not.toHaveBeenCalled();
    expect(spies[2]).toHaveBeenCalledTimes(1);
    expect(spies[3]).not.toHaveBeenCalled();
  });

  it('does nothing when the feed is empty', () => {
    document.body.innerHTML = `<a data-testid="avatar-wrapper" href="https://www.strava.com/athletes/1"></a>`;
    expect(() => kudoAllHandler()).not.toThrow();
  });

  it('returns the number of kudos clicked', () => {
    document.body.innerHTML = buildFeed(1, [
      { athleteId: 2, hasUnfilledKudos: true },
      { athleteId: 3, hasUnfilledKudos: true },
      { athleteId: 4, hasUnfilledKudos: false },
    ]);
    expect(kudoAllHandler()).toBe(2);
  });

  it('returns 0 when no kudos are given', () => {
    document.body.innerHTML = buildFeed(1, [{ athleteId: 1, hasUnfilledKudos: true }]);
    expect(kudoAllHandler()).toBe(0);
  });
});

describe('init', () => {
  const mockObserver = { observe: jest.fn() };
  beforeEach(() => {
    global.MutationObserver = jest.fn(() => mockObserver);
    mockObserver.observe.mockClear();
  });

  it('injects the button into document.body', () => {
    init();
    expect(document.querySelector('.ka-button')).not.toBeNull();
    expect(mockObserver.observe).toHaveBeenCalledWith(document.body, {
      childList: true,
      subtree: true,
    });
  });

  it('does not inject the button twice when called twice', () => {
    document.body.innerHTML = `<div class="feed-header"></div>`;
    init();
    init();
    expect(document.querySelectorAll('.ka-button').length).toBe(1);
  });

  it('starts observing the DOM', () => {
    init();
    expect(mockObserver.observe).toHaveBeenCalled();
  });
});
