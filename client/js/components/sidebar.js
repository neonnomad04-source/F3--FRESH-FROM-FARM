/**
 * F3: Fresh From Farm — Shared Sidebar Component
 * Dynamically injects the sidebar into every page.
 * Handles role-based nav, active link highlighting, and auth state.
 */
(function () {
    const PAGES = [
        { href: 'index.html', label: 'Home', icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>` },
    ];

    const CUSTOMER_PAGES = [
        { href: 'market.html', label: 'Marketplace', icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>` },
        { href: 'market.html?view=orders', label: 'My Orders', icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>` },
    ];

    const FARMER_PAGES = [
        { href: 'inventory.html', label: 'Inventory', icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>` },
        { href: 'farmer-orders.html', label: 'Orders', icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>` },
        { href: 'soil-health.html', label: 'Soil Health', icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>` },
        { href: 'crop-disease.html', label: 'Crop Disease', icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>` },
        { href: 'crop-calendar.html', label: 'Crop Calendar', icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z"/></svg>` },
        { href: 'analytics.html', label: 'Analytics', icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>` },
        { href: 'add-product.html', label: 'Add Product', icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>`, highlight: true },
    ];

    function getCurrentPage() {
        return window.location.pathname.split('/').pop() || 'index.html';
    }

    function isActive(href) {
        const current = getCurrentPage();
        return href === current || (current === '' && href === 'index.html');
    }

    function navLink(page) {
        const active = isActive(page.href);
        const highlight = page.highlight;
        let cls = 'flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all duration-200 group ';
        if (highlight) {
            cls += 'bg-agri-gold/10 text-agri-gold hover:bg-agri-gold hover:text-agri-dark border border-agri-gold/20';
        } else if (active) {
            cls += 'bg-white/10 text-white border border-white/10 shadow-xl';
        } else {
            cls += 'text-white/60 hover:text-white hover:bg-white/5';
        }
        return `<a href="${page.href}" class="${cls}" data-page-link>
            <span class="${active && !highlight ? 'text-agri-gold' : 'opacity-60 group-hover:opacity-100'}">${page.icon}</span>
            ${page.label}
        </a>`;
    }

    function buildSidebar() {
        const role = (localStorage.getItem('userRole') || '').toLowerCase();
        const email = localStorage.getItem('userEmail') || '';
        const isLoggedIn = !!email;

        const roleSection = role === 'customer'
            ? `<div class="pt-6 space-y-2">
                <p class="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 ml-4">Shopping</p>
                ${CUSTOMER_PAGES.map(navLink).join('')}
               </div>`
            : role === 'farmer'
            ? `<div class="pt-6 space-y-2">
                <p class="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 ml-4">Farmer Console</p>
                ${FARMER_PAGES.map(navLink).join('')}
               </div>`
            : '';

        const authSection = isLoggedIn
            ? `<div class="flex flex-col gap-3">
                <div class="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div class="flex items-center justify-between mb-1">
                        <div class="w-2 h-2 rounded-full bg-agri-gold animate-pulse"></div>
                        <span class="text-[9px] font-black uppercase tracking-widest text-white/40">${role || 'Member'}</span>
                    </div>
                    <span class="text-xs font-bold text-white truncate block">${email}</span>
                </div>
                <button id="sidebar-logout-btn" class="w-full text-[10px] text-red-400 font-black uppercase tracking-widest hover:text-red-300 py-2 transition-colors">Sign Out</button>
               </div>`
            : `<button id="sidebar-signin-btn" class="w-full bg-agri-gold text-agri-dark px-6 py-5 rounded-[1.5rem] text-sm font-black hover:bg-white transition-all shadow-2xl shadow-agri-gold/20 transform hover:-translate-y-1 active:scale-95">
                Sign In
               </button>`;

        return `
        <!-- Sidebar Overlay (mobile) -->
        <div id="sidebar-overlay" class="fixed inset-0 bg-black/60 z-[90] hidden md:hidden" onclick="F3Sidebar.close()"></div>

        <!-- Hamburger (mobile) -->
        <button id="hamburger-btn" onclick="F3Sidebar.toggle()" 
            class="fixed top-4 left-4 z-[110] md:hidden w-12 h-12 bg-agri-dark border border-white/10 rounded-2xl flex items-center justify-center text-white shadow-2xl">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
        </button>

        <nav id="main-sidebar" class="fixed top-0 left-0 h-screen w-72 bg-agri-dark z-[100] border-r border-white/5 flex flex-col p-8 overflow-y-auto
            transform -translate-x-full md:translate-x-0 transition-transform duration-300 ease-in-out">
            
            <!-- Brand -->
            <a href="index.html" class="flex items-center gap-4 mb-12">
                <img src="./assets/f3_logo.png" alt="F3 Logo" 
                    class="w-12 h-12 rounded-[1.25rem] shadow-2xl ring-4 ring-agri-gold/20 object-contain bg-white"
                    onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                <div class="w-12 h-12 rounded-[1.25rem] bg-agri-gold items-center justify-center text-agri-dark font-black text-xl hidden">F</div>
                <span class="text-2xl font-black text-white tracking-tighter">F3:<span class="text-agri-gold">Fresh</span></span>
            </a>

            <!-- Main Nav -->
            <div class="flex-1 space-y-2">
                <p class="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 ml-4">Command Center</p>
                ${PAGES.map(navLink).join('')}
                ${roleSection}
            </div>

            <!-- Bottom -->
            <div class="mt-auto pt-8 border-t border-white/5 space-y-4">
                <!-- Theme Toggle -->
                <button onclick="toggleTheme()" 
                    class="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all">
                    <span id="theme-toggle-text-display" class="text-[10px] font-black uppercase tracking-widest">Dark Mode</span>
                    <div id="theme-toggle-icon"></div>
                </button>

                <!-- Auth -->
                <div id="sidebar-auth">${authSection}</div>
            </div>
        </nav>`;
    }

    function inject() {
        // Only inject if placeholder exists OR auto-inject at start of body
        const placeholder = document.getElementById('f3-sidebar');
        const target = placeholder || document.body;
        const sidebarHTML = buildSidebar();

        if (placeholder) {
            placeholder.outerHTML = sidebarHTML;
        } else {
            document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
        }

        // Wire up auth buttons
        const signInBtn = document.getElementById('sidebar-signin-btn');
        const logoutBtn = document.getElementById('sidebar-logout-btn');
        const modal = document.getElementById('auth-modal');

        if (signInBtn && modal) {
            signInBtn.addEventListener('click', () => modal.classList.remove('hidden'));
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (typeof firebase !== 'undefined') firebase.auth().signOut();
                localStorage.clear();
                F3Toast.success('Signed out. See you soon! 👋');
                setTimeout(() => window.location.href = 'index.html', 1000);
            });
        }
    }

    // Mobile sidebar controls
    window.F3Sidebar = {
        open() {
            document.getElementById('main-sidebar')?.classList.remove('-translate-x-full');
            document.getElementById('sidebar-overlay')?.classList.remove('hidden');
        },
        close() {
            document.getElementById('main-sidebar')?.classList.add('-translate-x-full');
            document.getElementById('sidebar-overlay')?.classList.add('hidden');
        },
        toggle() {
            const sb = document.getElementById('main-sidebar');
            if (sb?.classList.contains('-translate-x-full')) this.open(); else this.close();
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inject);
    } else {
        inject();
    }
})();
