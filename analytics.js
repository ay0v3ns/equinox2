/* Equinox analytics bridge — PostHog */
(function () {
  const POSTHOG_TOKEN = 'phc_C94vT6vohKuvjDzxWL8f8Lu8qqxywECWgpDsRJFubC4N';
  const POSTHOG_HOST = 'https://us.i.posthog.com';

  function ready() {
    return typeof window.posthog !== 'undefined' && typeof window.posthog.capture === 'function';
  }

  function capture(event, properties) {
    try {
      if (ready()) window.posthog.capture(event, properties || {});
    } catch (e) {
      console.warn('Equinox analytics capture failed', e);
    }
  }

  window.equinoxAnalytics = { capture };

  if (!ready()) {
    console.warn('Equinox analytics: PostHog SDK was not available.');
    return;
  }

  window.posthog.init(POSTHOG_TOKEN, {
    api_host: POSTHOG_HOST,
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: false,
    capture_console_log: false,
    persistence: 'localStorage'
  });

  capture('equinox_app_loaded', {
    app_version: 'cloudflare-static',
    viewport: window.innerWidth + 'x' + window.innerHeight,
    mobile: window.matchMedia('(max-width: 700px)').matches
  });

  const originalRoll = window.roll;
  if (typeof originalRoll === 'function' && !window.__equinoxRollAnalyticsInstalled) {
    window.__equinoxRollAnalyticsInstalled = true;
    window.roll = function () {
      const before = window.state && Number(window.state.rolls || 0);
      const result = originalRoll.apply(this, arguments);
      try {
        const after = window.state && Number(window.state.rolls || 0);
        const recent = window.state && Array.isArray(window.state.recent) ? window.state.recent[0] : null;
        if (after > before) {
          capture('equinox_roll', {
            roll_number: after,
            aura_name: recent?.name || null,
            aura_rarity: Number(recent?.rolledRarity || recent?.rarity || 0),
            breakthrough: !!recent?.breakthrough,
            bonus_roll: !!recent?.bonus,
            biome: recent?.biome || window.state?.biome || null,
            day_night: recent?.time || window.state?.dayNight || null,
            luck: Number(recent?.luck || 1),
            roll_speed: Number(recent?.speed || 1)
          });
        }
      } catch (e) {
        console.warn('Equinox roll analytics failed', e);
      }
      return result;
    };
  }
})();
