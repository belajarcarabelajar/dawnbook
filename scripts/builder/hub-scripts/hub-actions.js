(function () {
  var actions = {
    "toggle-theme": function () {
      window.toggleTheme();
    },
    "toggle-menu": function () {
      window.toggleMenu();
    },
    "copy-account": function () {
      window.copyAccountNumber();
    },
    reload: function () {
      window.location.reload();
    },
  };

  // Capture phase on the document, so a pin click is stopped before the card
  // link and the document-level menu closer in hub-runtime see it, as the old
  // inline handler on the button did.
  document.addEventListener(
    "click",
    function (event) {
      var target = event.target;
      if (!target || typeof target.closest !== "function") return;
      var pin = target.closest("[data-pin]");
      if (pin) {
        event.preventDefault();
        window.togglePin(event, pin.getAttribute("data-pin"));
        return;
      }
      var el = target.closest("[data-action]");
      if (!el) return;
      // Other widgets (Turnstile) use data-action for their own values.
      var name = el.getAttribute("data-action");
      if (Object.prototype.hasOwnProperty.call(actions, name)) actions[name]();
    },
    true,
  );

  // A stylesheet loaded with media="print" so it does not block rendering
  // switches to its real media once loaded, or at once if it already has.
  var links = document.querySelectorAll("link[data-swap-media]");
  for (var i = 0; i < links.length; i++) {
    (function (link) {
      var media = link.getAttribute("data-swap-media");
      if (link.sheet) {
        link.media = media;
        return;
      }
      link.addEventListener("load", function () {
        link.media = media;
      });
    })(links[i]);
  }
})();
