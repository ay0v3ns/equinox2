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

  window.addEventListener('error', function (event) {
    capture('equinox_frontend_error', {
      message: String(event?.message || 'Unknown window error').slice(0,500),
      source: String(event?.filename || '').slice(0,500),
      line: Number(event?.lineno || 0),
      column: Number(event?.colno || 0),
      phase: 'window_error'
    });
  });

  window.addEventListener('unhandledrejection', function (event) {
    const reason = event?.reason;
    capture('equinox_frontend_error', {
      message: String(reason?.message || reason || 'Unhandled promise rejection').slice(0,500),
      stack: String(reason?.stack || '').slice(0,1500),
      phase: 'unhandled_rejection'
    });
  });

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

  const originalResolveRoll = window.resolveRoll;
  if (typeof originalResolveRoll === 'function' && !window.__equinoxResolveAnalyticsInstalled) {
    window.__equinoxResolveAnalyticsInstalled = true;
    window.resolveRoll = function () {
      const result = originalResolveRoll.apply(this, arguments);
      try {
        const recent = window.state && Array.isArray(window.state.recent) ? window.state.recent[0] : null;
        if (recent && Number(recent.roll || 0) > 0) {
          capture('equinox_roll', {
            roll_number: Number(recent.roll),
            aura_name: recent.name || null,
            aura_rarity: Number(recent.rolledRarity || recent.rarity || 0),
            breakthrough: !!recent.breakthrough,
            bonus_roll: !!recent.bonus,
            biome: recent.biome || window.state?.biome || null,
            day_night: recent.time || window.state?.dayNight || null,
            luck: Number(recent.luck || 1),
            roll_speed: Number(recent.speed || 1),
            fixed_potion: !!recent.fixedPotion
          });
        }
      } catch (e) {
        console.warn('Equinox roll analytics failed', e);
      }
      return result;
    };
  }
})();
