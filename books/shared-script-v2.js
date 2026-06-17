document.addEventListener('DOMContentLoaded', function() {
    const rightButtons = document.querySelector('.right-buttons');
    if (rightButtons) {
        const backToHub = document.createElement('a');
        backToHub.href = '/';
        backToHub.className = 'back-to-hub-link';
        backToHub.title = 'Back to Hub';
        backToHub.setAttribute('aria-label', 'Back to Hub');
        backToHub.innerHTML = `
            <span class="hub-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></span>
            <span class="hub-text">Back to Hub</span>
        `;
        rightButtons.appendChild(backToHub);
    }
});
