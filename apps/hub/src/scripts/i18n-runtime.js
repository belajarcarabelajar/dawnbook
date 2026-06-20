document.addEventListener('DOMContentLoaded', function() {
  var DEFAULT_LOCALE = "en";
  var COOKIE_NAME = "dawnbook_lang";
  
  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) return match[2];
    return null;
  }
  
  function setCookie(name, value) {
    document.cookie = name + "=" + value + "; path=/; max-age=31536000; SameSite=Lax";
  }

  var currentLocale = getCookie(COOKIE_NAME) || DEFAULT_LOCALE;
  // Ensure valid locale
  if (currentLocale !== "en" && currentLocale !== "id") {
    currentLocale = DEFAULT_LOCALE;
  }
  
  function applyLocale(locale) {
    document.documentElement.lang = locale;
    var catalog = window.I18N_CATALOGS && window.I18N_CATALOGS[locale];
    if (catalog) {
      document.querySelectorAll('[data-i18n]').forEach(function(el) {
        var key = el.getAttribute('data-i18n');
        if (catalog[key]) {
          // If the text has basic HTML we can't just textContent if it contains <strong> etc.
          // Wait, the instructions say "replace textContent of every [data-i18n="<key>"] element with the matching catalog value". 
          // So I will just use textContent as requested, or innerHTML if needed.
          // The instructions say explicitly "replace textContent of every [data-i18n="<key>"]". I will do that.
          el.textContent = catalog[key];
        }
      });
    }
  }

  function handleToggle() {
    var newLocale = currentLocale === "en" ? "id" : "en";
    setCookie(COOKIE_NAME, newLocale);
    currentLocale = newLocale;
    applyLocale(currentLocale);
  }

  applyLocale(currentLocale);
  window.applyLocale = function(locale) { applyLocale(locale || currentLocale); };

  var toggleBtns = document.querySelectorAll('.lang-toggle-btn');
  toggleBtns.forEach(function(btn) {
    btn.addEventListener('click', handleToggle);
  });
});
