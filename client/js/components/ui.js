/**
 * F3: Fresh From Farm — Toast Notification System
 * Usage: F3Toast.success('Done!') | F3Toast.error('Failed') | F3Toast.info('Note')
 */
(function () {
    let container = null;

    function ensureContainer() {
        if (!container) {
            container = document.createElement('div');
            container.id = 'f3-toast-container';
            container.style.cssText = `
                position: fixed; top: 1.5rem; right: 1.5rem; z-index: 9999;
                display: flex; flex-direction: column; gap: 0.75rem;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }
        return container;
    }

    function show(message, type = 'info', duration = 3500) {
        const c = ensureContainer();

        const colors = {
            success: { bg: '#064e3b', border: '#10b981', icon: '✅', text: '#d1fae5' },
            error:   { bg: '#450a0a', border: '#ef4444', icon: '❌', text: '#fee2e2' },
            info:    { bg: '#1e1b4b', border: '#D4A017', icon: 'ℹ️', text: '#fef3c7' },
            warning: { bg: '#422006', border: '#f59e0b', icon: '⚠️', text: '#fef3c7' },
        };
        const c2 = colors[type] || colors.info;

        const toast = document.createElement('div');
        toast.style.cssText = `
            background: ${c2.bg}; border: 1px solid ${c2.border}; color: ${c2.text};
            padding: 1rem 1.25rem; border-radius: 1rem;
            font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700;
            display: flex; align-items: center; gap: 0.75rem;
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
            pointer-events: all; cursor: pointer;
            max-width: 340px; min-width: 240px;
            transform: translateX(120%); opacity: 0;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        `;
        toast.innerHTML = `<span style="font-size:16px;flex-shrink:0">${c2.icon}</span><span>${message}</span>`;

        toast.addEventListener('click', () => dismiss(toast));
        c.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                toast.style.transform = 'translateX(0)';
                toast.style.opacity = '1';
            });
        });

        const timer = setTimeout(() => dismiss(toast), duration);
        toast._timer = timer;
    }

    function dismiss(toast) {
        clearTimeout(toast._timer);
        toast.style.transform = 'translateX(120%)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    }

    window.F3Toast = {
        success: (msg, dur) => show(msg, 'success', dur),
        error:   (msg, dur) => show(msg, 'error', dur),
        info:    (msg, dur) => show(msg, 'info', dur),
        warning: (msg, dur) => show(msg, 'warning', dur),
    };
})();

/**
 * F3: Fresh From Farm — Page Transition System
 * Smooth fade-out on navigation, fade-in on load.
 */
(function () {
    // Inject transition overlay styles
    const style = document.createElement('style');
    style.textContent = `
        #f3-page-transition {
            position: fixed; inset: 0; z-index: 99999;
            background: #2B1B0E;
            opacity: 0; pointer-events: none;
            transition: opacity 0.25s ease;
        }
        #f3-page-transition.active {
            opacity: 1; pointer-events: all;
        }
        body { opacity: 0; transition: opacity 0.3s ease; }
        body.loaded { opacity: 1; }
    `;
    document.head.appendChild(style);

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'f3-page-transition';
    document.body.appendChild(overlay);

    // Fade in on load
    window.addEventListener('load', () => {
        document.body.classList.add('loaded');
    });

    // Fade out on navigation (skip anchor links and external links)
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href]');
        if (!link) return;
        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || link.target === '_blank') return;
        if (e.ctrlKey || e.metaKey || e.shiftKey) return;

        e.preventDefault();
        overlay.classList.add('active');
        setTimeout(() => { window.location.href = href; }, 250);
    }, true);
})();
