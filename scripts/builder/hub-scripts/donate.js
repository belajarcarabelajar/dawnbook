function copyAccountNumber() {
  var text = document.getElementById('bank-account-number').textContent;
  navigator.clipboard.writeText(text).then(function() {
    var btn = document.getElementById('copy-btn');
    var originalText = btn.textContent;
    btn.textContent = '✓';
    btn.style.background = '#22c55e';
    setTimeout(function() {
      btn.textContent = originalText;
      btn.style.background = 'var(--color-primary)';
    }, 2000);
  });
}
