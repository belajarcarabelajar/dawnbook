(function() {
  var loadingEl = document.getElementById('stats-loading');
  var errorEl = document.getElementById('stats-error');
  var contentEl = document.getElementById('stats-content');

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatNumber(n) {
    if (n == null || isNaN(n)) return '0';
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function formatDateRange(firstIso, lastIso) {
    if (!firstIso && !lastIso) return '—';
    function shortDate(iso) {
      var d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return months[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
    }
    if (firstIso === lastIso) return shortDate(firstIso);
    return shortDate(firstIso) + ' — ' + shortDate(lastIso);
  }

  function renderBySubject(items) {
    var container = document.getElementById('stat-by-subject');
    if (!container) return;
    if (!items || items.length === 0) {
      container.innerHTML = '<div class="stats-empty">—</div>';
      return;
    }
    var max = items.reduce(function(m, x) { return Math.max(m, x.count); }, 0) || 1;
    container.innerHTML = items.map(function(x) {
      var pct = Math.max(2, Math.round((x.count / max) * 100));
      return '<div class="stat-bar-row">' +
        '<span class="stat-bar-label">' + esc(x.label) + '</span>' +
        '<span class="stat-bar-track"><span class="stat-bar-fill" style="width:' + pct + '%"></span></span>' +
        '<span class="stat-bar-count">' + formatNumber(x.count) + '</span>' +
      '</div>';
    }).join('');
  }

  function renderTimeline(months) {
    var container = document.getElementById('stat-timeline');
    if (!container) return;
    if (!months || months.length === 0) {
      container.innerHTML = '<div class="stats-empty">—</div>';
      return;
    }
    var max = months.reduce(function(m, x) { return Math.max(m, x.count); }, 0);
    var W = 600, H = 160, padL = 32, padR = 12, padT = 12, padB = 28;
    var innerW = W - padL - padR;
    var innerH = H - padT - padB;
    var n = months.length;
    var stepX = n > 1 ? innerW / (n - 1) : 0;
    var barW = Math.max(8, Math.min(28, innerW / n - 4));
    var yScale = max > 0 ? innerH / max : 0;
    function y(v) { return padT + innerH - v * yScale; }
    function x(i) { return padL + (n > 1 ? i * stepX : innerW / 2); }
    var rects = months.map(function(m, i) {
      var cx = x(i) - barW / 2;
      var h = max > 0 ? m.count * yScale : 0;
      var yy = padT + innerH - h;
      return '<rect x="' + cx.toFixed(1) + '" y="' + yy.toFixed(1) + '" width="' + barW.toFixed(1) + '" height="' + Math.max(0, h).toFixed(1) + '" rx="3" fill="var(--color-primary)" opacity="0.85"></rect>' +
             '<text x="' + x(i).toFixed(1) + '" y="' + (H - 8).toFixed(1) + '" text-anchor="middle" font-size="10" fill="var(--color-text-muted)">' + esc(m.month.slice(2)) + '</text>' +
             (m.count > 0 ? '<text x="' + x(i).toFixed(1) + '" y="' + (yy - 4).toFixed(1) + '" text-anchor="middle" font-size="10" font-weight="700" fill="var(--color-text)">' + m.count + '</text>' : '');
    }).join('');
    var yAxis = '';
    var steps = 4;
    for (var s = 0; s <= steps; s++) {
      var v = Math.round((max * s) / steps);
      var yy = padT + innerH - v * yScale;
      yAxis += '<line x1="' + padL + '" y1="' + yy.toFixed(1) + '" x2="' + (W - padR) + '" y2="' + yy.toFixed(1) + '" stroke="var(--color-secondary)" stroke-width="0.5" opacity="0.4"></line>' +
               '<text x="' + (padL - 6) + '" y="' + (yy + 3).toFixed(1) + '" text-anchor="end" font-size="10" fill="var(--color-text-muted)">' + v + '</text>';
    }
    container.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet" width="100%" height="160" role="img" aria-label="Publication timeline">' +
      yAxis + rects +
    '</svg>';
  }

  function renderTopContributors(top) {
    var container = document.getElementById('stat-contributors-top');
    if (!container) return;
    if (!top || top.length === 0) {
      container.innerHTML = '<li class="stats-empty">—</li>';
      return;
    }
    var lang = (document.documentElement.lang || 'en');
    var booksLabel = (window.I18N_CATALOGS && window.I18N_CATALOGS[lang] && (window.I18N_CATALOGS[lang]['statistics.contributors.books'] || window.I18N_CATALOGS[lang]['statistics.contributors.commits'])) || 'books';
    container.innerHTML = top.map(function(c) {
      return '<li><span class="stats-top-name">' + esc(c.name) + '</span><span class="stats-top-count">' + formatNumber(c.books) + ' ' + esc(booksLabel) + '</span></li>';
    }).join('');
  }

  function renderError() {
    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) errorEl.style.display = 'block';
  }

  function renderStats(data) {
    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) errorEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'block';

    setText('stat-total-books', formatNumber(data.content.total_books));
    setText('stat-total-chapters', formatNumber(data.content.total_chapters));
    setText('stat-avg-chapters', String(data.content.avg_chapters_per_book));
    renderBySubject(data.content.by_subject);

    setText('stat-total-views', formatNumber(data.engagement.total_views));
    setText('stat-this-month', formatNumber(data.engagement.published_this_month));
    setText('stat-release-range', formatDateRange(data.engagement.first_release, data.engagement.last_release));
    renderTimeline(data.engagement.monthly_timeline);

    setText('stat-donations-gold', formatNumber(data.donations.gold));
    setText('stat-donations-silver', formatNumber(data.donations.silver));
    setText('stat-donations-bronze', formatNumber(data.donations.bronze));
    setText('stat-donations-total', formatNumber(data.donations.total_badge_holders));

    setText('stat-contributors-total', formatNumber(data.contributors.total));
    renderTopContributors(data.contributors.top);

    if (window.applyLocale) window.applyLocale();
  }

  function boot() {
    fetch('/api/stats', { credentials: 'same-origin' })
      .then(function(r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(renderStats)
      .catch(renderError);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
