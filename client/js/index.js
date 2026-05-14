// ========================================
// F3 - Main Application JavaScript
// index.js - Firebase Auth, Registration, UI
// ========================================

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// ========================================
// Firebase Configuration
// ========================================
const firebaseConfig = {
  apiKey: "AIzaSyCzroaT4ACLvBXNUr2mVDBBL6RfPN24jFo",
  authDomain: "farming-e1126.firebaseapp.com",
  projectId: "farming-e1126",
  storageBucket: "farming-e1126.firebasestorage.app",
  messagingSenderId: "826412688061",
  appId: "1:826412688061:web:60e88600378518b7688dd4",
  measurementId: "G-PQ91GWEVT8"
};

// ========================================
// Firebase Initialization
// ========================================
let app, auth, db;
try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (e) {
    console.error("Firebase initialization failed:", e);
}

// ========================================
// Global Auth State
// ========================================
let selectedRole = localStorage.getItem('userRole') || 'customer';
let isLoginMode = true;

// ========================================
// Role Selector — called via inline onclick in HTML
// ========================================
window.selectRole = function(role) {
    selectedRole = role;
    ['customer', 'farmer'].forEach(r => {
        const btn = document.getElementById('btn-' + r);
        if (!btn) return;

        if (r === role) {
            // ★ ACTIVE — gold border, glow, checkmark
            btn.className = 'role-btn flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden group border-agri-gold bg-agri-gold/10 scale-[1.03] shadow-lg shadow-agri-gold/20';
            btn.innerHTML = `
                <div class="absolute top-2 right-2 w-5 h-5 bg-agri-gold rounded-full flex items-center justify-center text-agri-dark">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <span class="text-3xl">${r === 'customer' ? '🛒' : '🌾'}</span>
                <span class="text-[11px] font-black text-agri-gold uppercase tracking-widest">${r.charAt(0).toUpperCase() + r.slice(1)}</span>
            `;
        } else {
            // ○ INACTIVE — muted, greyed out
            btn.className = 'role-btn flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden group border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 opacity-60 hover:opacity-90 hover:border-agri-gold/30';
            btn.innerHTML = `
                <span class="text-3xl grayscale">${r === 'customer' ? '🛒' : '🌾'}</span>
                <span class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">${r.charAt(0).toUpperCase() + r.slice(1)}</span>
            `;
        }
    });

    // Update feedback text
    const fb = document.getElementById('role-feedback');
    const fbText = document.getElementById('role-feedback-text');
    if (fb) { fb.style.opacity = '1'; }
    if (fbText) { fbText.textContent = role.charAt(0).toUpperCase() + role.slice(1); }
};

// ========================================
// Toggle Login ↔ Register — called via inline onclick in HTML
// ========================================
window._toggleAuthMode = function() {
    isLoginMode = !isLoginMode;

    const modalTitle    = document.getElementById('modal-title');
    const modalDesc     = document.getElementById('modal-desc');
    const authSubmitBtn = document.getElementById('auth-submit-btn');
    const authToggleText= document.getElementById('auth-toggle-text');
    const authToggleBtn = document.getElementById('auth-toggle-btn');
    const authError     = document.getElementById('auth-error');

    if (authError) authError.classList.add('hidden');

    if (isLoginMode) {
        if (modalTitle)    modalTitle.textContent   = 'Welcome Back';
        if (modalDesc)     modalDesc.textContent    = 'Sign in to your F3 workspace';
        if (authSubmitBtn) authSubmitBtn.textContent = 'Sign In';
        if (authToggleText) authToggleText.textContent = 'New member?';
        if (authToggleBtn) authToggleBtn.textContent = 'Register Account';
    } else {
        if (modalTitle)    modalTitle.textContent   = 'Create Account';
        if (modalDesc)     modalDesc.textContent    = 'Join the F3 farming network';
        if (authSubmitBtn) authSubmitBtn.textContent = 'Register & Enter';
        if (authToggleText) authToggleText.textContent = 'Already have an account?';
        if (authToggleBtn) authToggleBtn.textContent = 'Sign In Instead';
    }
};

// ========================================
// Boot after DOM ready
// ========================================
function bootApp() {
    // Apply the default role selection visually
    window.selectRole(selectedRole);

    // Small delay to let sidebar.js inject first
    setTimeout(initAuth, 80);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootApp);
} else {
    bootApp();
}

// ========================================
// Core Auth Wiring
// ========================================
function initAuth() {
    const authModal    = document.getElementById('auth-modal');
    const authForm     = document.getElementById('auth-form');
    const authEmail    = document.getElementById('auth-email');
    const authPassword = document.getElementById('auth-password');
    const authSubmitBtn= document.getElementById('auth-submit-btn');
    const authError    = document.getElementById('auth-error');

    if (!authForm) return; // not on a page with the auth modal

    // ── Form Submit ──────────────────────────────────────────
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email    = authEmail.value.trim();
        const password = authPassword.value;
        if (authError) authError.classList.add('hidden');
        if (authSubmitBtn) { authSubmitBtn.disabled = true; authSubmitBtn.textContent = 'Please wait...'; }

        try {
            if (!selectedRole) throw new Error("Please select Customer or Farmer first.");
            if (!auth) throw new Error("Firebase is not configured correctly.");

            if (isLoginMode) {
                // ── SIGN IN ──
                const cred = await signInWithEmailAndPassword(auth, email, password);
                // Fetch role from Firestore
                try {
                    const { getDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js");
                    const snap = await getDoc(doc(db, "users", cred.user.uid));
                    if (snap.exists() && snap.data().role) {
                        selectedRole = snap.data().role;
                    }
                } catch (fsErr) {
                    console.warn("Could not fetch role from Firestore:", fsErr.message);
                }

            } else {
                // ── REGISTER ──
                if (!selectedRole) throw new Error("Please select Customer or Farmer to register.");
                const cred = await createUserWithEmailAndPassword(auth, email, password);
                const { setDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js");
                await setDoc(doc(db, "users", cred.user.uid), {
                    email, role: selectedRole, createdAt: serverTimestamp()
                });
                try { await sendEmailVerification(cred.user); } catch(_){}
                F3Toast.info('Account created! Verification email sent.');
            }

            // Persist auth state
            localStorage.setItem('userRole', selectedRole);
            localStorage.setItem('userEmail', email);

            // Close modal
            if (authModal) authModal.classList.add('hidden');
            authForm.reset();

            F3Toast.success(`Welcome, ${email}! Signed in as ${selectedRole.toUpperCase()} 🎉`);

            // Redirect based on role
            setTimeout(() => {
                const r = (selectedRole || '').toLowerCase();
                window.location.href = r === 'farmer' ? 'inventory.html' : 'market.html';
            }, 800);

        } catch (error) {
            console.error("Auth error:", error);
            const msg = error.code === 'auth/invalid-credential' ? 'Invalid email or password. Please try again.'
                      : error.code === 'auth/email-already-in-use' ? 'This email is already registered. Try signing in instead.'
                      : error.code === 'auth/weak-password' ? 'Password must be at least 6 characters.'
                      : error.code === 'auth/invalid-email' ? 'Please enter a valid email address.'
                      : error.message;
            if (authError) { authError.textContent = msg; authError.classList.remove('hidden'); }
        } finally {
            if (authSubmitBtn) {
                authSubmitBtn.disabled = false;
                authSubmitBtn.textContent = isLoginMode ? 'Sign In' : 'Register & Enter';
            }
        }
    });

    // ── Sidebar Sign In button (non-injected pages) ──
    const oldAuthBtn = document.getElementById('auth-btn');
    if (oldAuthBtn && authModal) {
        oldAuthBtn.addEventListener('click', () => authModal.classList.remove('hidden'));
    }

    // ── Auth State Observer ──────────────────────────────────
    if (auth) {
        onAuthStateChanged(auth, (user) => {
            const savedRole  = localStorage.getItem('userRole') || '';
            const savedEmail = user?.email || '';

            // Update sidebar auth section if sidebar.js has rendered it
            const sidebarAuth = document.getElementById('sidebar-auth');
            if (sidebarAuth) {
                if (user) {
                    sidebarAuth.innerHTML = `
                        <div class="flex flex-col gap-3">
                            <div class="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <div class="flex items-center justify-between mb-1">
                                    <div class="w-2 h-2 rounded-full bg-agri-gold animate-pulse"></div>
                                    <span class="text-[9px] font-black uppercase tracking-widest text-white/40">${savedRole}</span>
                                </div>
                                <span class="text-xs font-bold text-white truncate block">${savedEmail}</span>
                            </div>
                            <button id="sidebar-logout-btn" class="w-full text-[10px] text-red-400 font-black uppercase tracking-widest hover:text-red-300 py-2 transition-colors">Sign Out</button>
                        </div>`;

                    document.getElementById('sidebar-logout-btn')?.addEventListener('click', async () => {
                        await signOut(auth);
                        localStorage.clear();
                        F3Toast.success('Signed out. See you soon! 👋');
                        setTimeout(() => window.location.href = 'index.html', 800);
                    });
                } else {
                    sidebarAuth.innerHTML = `<button id="sidebar-signin-btn" class="w-full bg-agri-gold text-agri-dark px-6 py-5 rounded-[1.5rem] text-sm font-black hover:bg-white transition-all shadow-2xl shadow-agri-gold/20 transform hover:-translate-y-1 active:scale-95">Sign In</button>`;
                    document.getElementById('sidebar-signin-btn')?.addEventListener('click', () => {
                        authModal?.classList.remove('hidden');
                    });
                }
            }

            // Apply role-based nav
            document.querySelectorAll('[data-role-req]').forEach(el => {
                const req = el.getAttribute('data-role-req').toLowerCase();
                el.classList.toggle('hidden', req !== savedRole.toLowerCase());
            });

            if (user) localStorage.setItem('userEmail', user.email);
        });
    }
}
