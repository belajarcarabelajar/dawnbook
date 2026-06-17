document.addEventListener('DOMContentLoaded', () => {
  const leftButtons = document.querySelector('.left-buttons');
  if (leftButtons) {
    const backBtn = document.createElement('a');
    backBtn.href = '/';
    backBtn.innerHTML = '⬅ Hub';
    backBtn.title = 'Back to Hub';
    backBtn.className = 'icon-button';
    // Match the standard mdbook button styling
    backBtn.style.padding = '0 10px';
    backBtn.style.lineHeight = '50px';
    backBtn.style.textDecoration = 'none';
    backBtn.style.color = 'var(--fg)';
    leftButtons.insertBefore(backBtn, leftButtons.firstChild);
  }
});
