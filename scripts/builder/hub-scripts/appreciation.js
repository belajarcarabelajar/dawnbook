var badgeColors = {
  Gold: { bg: '#fbbf24', border: '#f59e0b', text: '#78350f', fill: '#fcd34d' },
  Silver: { bg: '#d1d5db', border: '#9ca3af', text: '#1f2937', fill: '#e5e7eb' },
  Bronze: { bg: '#d97706', border: '#b45309', text: '#451a03', fill: '#fbbf24' }
};

function escapeClientHtml(unsafe) {
  if (!unsafe) return "";
  return unsafe.toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderBadge(tierName, userName, message) {
  var c = badgeColors[tierName] || badgeColors.Bronze;
  var safeUserName = escapeClientHtml(userName);
  var safeTierName = escapeClientHtml(tierName);
  var safeMessage = escapeClientHtml(message);
  return '<div style="animation: fadeSlideUp 0.6s ease forwards;">' +
    '<svg width="160" height="160" viewBox="0 0 160 160" style="margin-bottom: 24px;">' +
      '<circle cx="80" cy="80" r="72" fill="' + c.bg + '" stroke="' + c.border + '" stroke-width="4"/>' +
      '<circle cx="80" cy="80" r="60" fill="' + c.fill + '" opacity="0.3"/>' +
      '<text x="80" y="70" text-anchor="middle" font-size="40" fill="' + c.text + '">&#9733;</text>' +
      '<text x="80" y="100" text-anchor="middle" font-size="13" font-weight="700" fill="' + c.text + '">' + safeTierName.toUpperCase() + '</text>' +
      '<text x="80" y="118" text-anchor="middle" font-size="10" fill="' + c.text + '" opacity="0.8">PATRON</text>' +
    '</svg>' +
    '<h3 style="color: var(--color-primary); margin: 0 0 8px 0; font-size: 1.4rem;">' + safeUserName + '</h3>' +
    '<p data-i18n="badge.' + safeTierName.toLowerCase() + '" style="color: var(--color-primary); font-weight: 700; font-size: 1.1rem; margin-bottom: 16px;">' + safeTierName + ' Patron</p>' +
    '<p data-i18n="appreciation.' + safeTierName.toLowerCase() + '.msg" style="color: var(--color-text-muted); line-height: 1.7; max-width: 450px; margin: 0 auto;">' + safeMessage + '</p>' +
  '</div>';
}

function renderNoBadge() {
  return '<div style="animation: fadeSlideUp 0.6s ease forwards;">' +
    '<svg width="120" height="120" viewBox="0 0 120 120" style="margin-bottom: 24px; opacity: 0.3;">' +
      '<circle cx="60" cy="60" r="54" fill="none" stroke="var(--color-secondary)" stroke-width="3" stroke-dasharray="8 4"/>' +
      '<text x="60" y="68" text-anchor="middle" font-size="36" fill="var(--color-text-muted)">?</text>' +
    '</svg>' +
    '<h3 data-i18n="appreciation.nobadge.title" style="color: var(--color-primary); margin: 0 0 8px 0;">No Badge Yet</h3>' +
    '<p data-i18n="appreciation.nobadge.desc" style="color: var(--color-text-muted); margin-bottom: 24px; line-height: 1.7;">You haven\'t made a donation yet. Support Dawnbook and earn your badge!</p>' +
    '<a href="/donate" class="btn-primary" style="animation: none; opacity: 1; transform: none;" data-i18n="appreciation.nobadge.cta">Donate Now</a>' +
  '</div>';
}

function renderSignInPrompt() {
  return '<div style="animation: fadeSlideUp 0.6s ease forwards;">' +
    '<p style="color: var(--color-text-muted); margin-bottom: 16px;" data-i18n="signin.body">Create a free account or sign in to access the full book content.</p>' +
    '<a href="/sign-in?redirect_url=/appreciation" class="btn-primary" style="animation: none; opacity: 1; transform: none;" data-i18n="hub.signin">Sign In</a>' +
  '</div>';
}

(function() {
  var container = document.getElementById('appreciation-content');

  function doRender(user) {
    if (!user || !user.id) {
      container.innerHTML = renderSignInPrompt();
    } else if (user.donation_badge && badgeColors[user.donation_badge]) {
      var tier = user.donation_badge;
      var message;
      if (tier === 'Gold') {
        message = 'Your extraordinary generosity fuels Dawnbook\'s mission to make education accessible to everyone.';
      } else if (tier === 'Silver') {
        message = 'Your meaningful contribution helps keep Dawnbook running for learners everywhere.';
      } else {
        message = 'Your kind support keeps the lights on and the chapters flowing.';
      }
      container.innerHTML = renderBadge(tier, user.name || user.email || 'Supporter', message);
    } else {
      container.innerHTML = renderNoBadge();
    }
    if (window.applyLocale) window.applyLocale();
  }

  function boot() {
    fetch('/api/auth/me', { credentials: 'same-origin', cache: 'no-store' })
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(user) { doRender(user); })
      .catch(function() { doRender(null); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
