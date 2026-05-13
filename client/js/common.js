// Shared UI logic and Firebase Initialization
const firebaseConfig = {
    apiKey: "AIzaSyCzroaT4ACLvBXNUr2mVDBBL6RfPN24jFo",
    authDomain: "farming-e1126.firebaseapp.com",
    projectId: "farming-e1126",
    storageBucket: "farming-e1126.firebasestorage.app",
    messagingSenderId: "826412688061",
    appId: "1:826412688061:web:60e88600378518b7688dd4"
};

document.addEventListener('DOMContentLoaded', () => {
    applyRoleBasedNavigation();
    initTheme();
});

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    const newTheme = isDark ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = document.getElementById('theme-toggle-icon');
    const text = document.getElementById('theme-toggle-text-display');
    if (icon) {
        icon.innerHTML = theme === 'dark' 
            ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>'
            : '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>';
    }
    if (text) {
        text.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
    }
}

// Export for use in HTML onclick handlers
window.toggleTheme = toggleTheme;

function applyRoleBasedNavigation() {
    const savedRole = localStorage.getItem('userRole');
    const currentRole = (savedRole || 'Member').toLowerCase();
    
    console.log('Applying navigation for role:', currentRole);
    
    document.querySelectorAll('[data-role-req]').forEach(el => {
        const reqRole = el.getAttribute('data-role-req').toLowerCase();
        if (reqRole === currentRole) {
            el.classList.remove('hidden');
            el.classList.add('block');
        } else {
            el.classList.add('hidden');
            el.classList.remove('block');
        }
    });

    // Update role display if element exists
    const roleDisplay = document.getElementById('user-role');
    if (roleDisplay) {
        roleDisplay.textContent = savedRole || 'Member';
    }

    const emailDisplay = document.getElementById('user-email');
    if (emailDisplay) {
        emailDisplay.textContent = localStorage.getItem('userEmail') || '';
    }
}
