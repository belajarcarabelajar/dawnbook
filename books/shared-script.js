document.addEventListener('DOMContentLoaded', function() {
    const rightButtons = document.querySelector('.right-buttons');
    if (rightButtons) {
        const backToHub = document.createElement('a');
        backToHub.href = '/';
        backToHub.title = 'Back to Hub';
        backToHub.setAttribute('aria-label', 'Back to Hub');
        backToHub.style.cssText = 'color: var(--color-text); text-decoration: none; padding: 0 10px; display: inline-flex; align-items: center; justify-content: center; height: 100%; font-weight: 600; font-size: 14px;';
        backToHub.textContent = 'Back to Hub';
        rightButtons.appendChild(backToHub);
    }
});
