/* Only a root-relative path or an absolute URL on this origin is kept;
   anything else becomes "/". */
function safeNext(redirectUrl, origin) {
  var raw = String(redirectUrl || '');
  if (raw.charAt(0) !== '/' && raw !== origin && raw.indexOf(origin + '/') !== 0 &&
      raw.indexOf(origin + '?') !== 0 && raw.indexOf(origin + '#') !== 0) {
    return '/';
  }
  try {
    var u = new URL(raw, origin);
    if (u.origin !== origin || u.pathname.charAt(1) === '/') return '/';
    return u.pathname + u.search + u.hash;
  } catch (e) {
    return '/';
  }
}
function bcbSignInHref(redirectUrl, origin) {
  var next = '/';
  try {
    var u = new URL(redirectUrl, origin);
    if (u.origin === origin && u.pathname.charAt(1) !== '/') {
      next = u.pathname + u.search;
    }
  } catch (e) {}
  return '/api/auth/bcb/start?next=' + encodeURIComponent(next);
}
(function() {
  var params = new URLSearchParams(window.location.search);
  var redirectUrl = safeNext(params.get('redirect_url') || '/', window.location.origin);
  var err = params.get('error');
  /* The sign-up page is the sign-in page with the button id renamed, so look
     the button up by a marker both pages keep. */
  var btn = document.querySelector('[data-google-auth]');
  var errEl = document.getElementById('signin-error');
  var bcbBtn = document.getElementById('bcb-signin-btn');

  /* The shared catalogs in i18n/ hold no sign-in SSO strings, so this page
     adds its own before the i18n runtime applies the locale. */
  var catalogs = window.I18N_CATALOGS || {};
  var extra = {
    en: {
      'signin.bcb.cta': 'Sign in with your belajarcarabelajar.com account',
      'signin.bcb.hint': 'Use this if your purchase email is not a Google account.',
      'signin.error.sso_invalid': 'The sign-in link expired or is invalid. Please try again.',
      'signin.error.sso_unavailable': 'Signing in with belajarcarabelajar.com is unavailable right now. Please try again later.',
      'signin.error.account_conflict': 'This email is already linked to another Google account. Sign in with that Google account.',
      'signin.error.email_unverified': 'Your Google email address is not verified. Verify it with Google, or sign in with your belajarcarabelajar.com account.'
    },
    id: {
      'signin.bcb.cta': 'Masuk lewat akun belajarcarabelajar.com',
      'signin.bcb.hint': 'Pakai ini kalau email pembelianmu bukan akun Google.',
      'signin.error.sso_invalid': 'Tautan masuk sudah kedaluwarsa atau tidak sah. Coba lagi.',
      'signin.error.sso_unavailable': 'Masuk lewat belajarcarabelajar.com sedang tidak tersedia. Coba lagi nanti.',
      'signin.error.account_conflict': 'Email ini sudah terhubung ke akun Google lain. Masuk dengan akun Google tersebut.',
      'signin.error.email_unverified': 'Email Google kamu belum terverifikasi. Verifikasi dulu di Google, atau masuk lewat akun belajarcarabelajar.com.'
    }
  };
  for (var loc in extra) {
    if (!catalogs[loc]) continue;
    for (var key in extra[loc]) catalogs[loc][key] = extra[loc][key];
  }

  if (bcbBtn) {
    bcbBtn.href = bcbSignInHref(redirectUrl, window.location.origin);
  }

  if (err) {
    var messages = {
      missing_params: 'Sign-in was started incorrectly. Please try again.',
      state_mismatch: 'Your sign-in session expired. Please try again.',
      config: 'Sign-in is not configured. Please contact support.',
      google_exchange: 'Google rejected the sign-in. Please try again.',
      server: 'Something went wrong on our end. Please try again shortly.',
      bot_detected: 'Security verification failed or expired. Please complete the captcha and try again.',
      sso_invalid: 'The sign-in link expired or is invalid. Please try again.',
      sso_unavailable: 'Signing in with belajarcarabelajar.com is unavailable right now. Please try again later.',
      account_conflict: 'This email is already linked to another Google account. Sign in with that Google account.',
      email_unverified: 'Your Google email address is not verified. Verify it with Google, or sign in with your belajarcarabelajar.com account.'
    };
    errEl.textContent = messages[err] || ('Sign-in failed (' + err + ').');
    if (extra.id['signin.error.' + err]) {
      errEl.setAttribute('data-i18n', 'signin.error.' + err);
    }
    errEl.style.display = 'block';
  }

  fetch('/api/auth/me', { credentials: 'same-origin' })
    .then(function(r) { return r.ok ? r.json() : null; })
    .then(function(user) {
      if (user && user.id) {
        window.location.href = redirectUrl;
      }
    })
    .catch(function() {});

  btn.addEventListener('click', function(e) {
    e.preventDefault();
    var turnstileToken = '';
    if (window.turnstile && typeof window.turnstile.getResponse === 'function') {
      turnstileToken = window.turnstile.getResponse() || '';
    }
    
    var url = '/api/auth/login?redirect_url=' + encodeURIComponent(redirectUrl);
    if (turnstileToken) {
      url += '&cf-turnstile-response=' + encodeURIComponent(turnstileToken);
    }
    window.location.href = url;
  });
})();
