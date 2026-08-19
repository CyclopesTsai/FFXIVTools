(function () {
    const trigger = document.getElementById('credit-trigger');
    const overlay = document.getElementById('credit-modal-overlay');
    const closeBtn = document.getElementById('credit-modal-close');
    if (!trigger || !overlay || !closeBtn) return;

    trigger.addEventListener('click', () => overlay.classList.add('open'));
    closeBtn.addEventListener('click', () => overlay.classList.remove('open'));
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('open');
    });
})();
