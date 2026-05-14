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
    // Use existing app if already initialized (avoids duplicate-app crash)
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (e) {
    console.error("Firebase initialization failed:", e);
}

// ========================================
// Role Selector Logic (available globally for onclick)
// ========================================
let selectedRole = localStorage.getItem('userRole') || 'customer';

window.selectRole = function(role) {
    selectedRole = role;
    ['customer', 'farmer'].forEach(r => {
        const btn = document.getElementById('btn-' + r);
        if (!btn) return;
        if (r === role) {
            // Active state — gold highlight
            btn.style.border = '2px solid #D4A017';
            btn.style.background = 'rgba(212, 160, 23, 0.12)';
            btn.style.transform = 'translateY(-4px) scale(1.05)';
            btn.style.boxShadow = '0 0 25px rgba(212,160,23,0.3), 0 10px 40px -10px rgba(212,160,23,0.4)';
            btn.style.transition = 'all 0.3s ease';
            // Gold text on label
            const label = btn.querySelector('span:last-child');
            if (label) label.style.color = '#D4A017';
        } else {
            // Inactive state
            btn.style.border = '2px solid rgba(255,255,255,0.1)';
            btn.style.background = 'rgba(255,255,255,0.05)';
            btn.style.transform = '';
            btn.style.boxShadow = '';
            btn.style.transition = 'all 0.3s ease';
            const label = btn.querySelector('span:last-child');
            if (label) label.style.color = '';
        }
    });
};

// ========================================
// Boot everything after DOM + sidebar are ready
// ========================================
function bootApp() {
    // Highlight the saved/default role
    window.selectRole(selectedRole);

    // Wait a tick for sidebar.js to inject its HTML, then wire up auth
    setTimeout(initAuth, 50);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootApp);
} else {
    bootApp();
}

function initAuth() {
    const authModal   = document.getElementById('auth-modal');
    const authForm    = document.getElementById('auth-form');
    const authEmail   = document.getElementById('auth-email');
    const authPassword= document.getElementById('auth-password');
    const authToggleBtn = document.getElementById('auth-toggle-btn');
    const modalTitle  = document.getElementById('modal-title');
    const modalDesc   = document.getElementById('modal-desc');
    const authSubmitBtn = document.getElementById('auth-submit-btn');
    const authToggleText= document.getElementById('auth-toggle-text');
    const authError   = document.getElementById('auth-error');

    if (!authForm) return; // not on a page with auth modal

    let isLoginMode = true;

    // ── Toggle Login / Register ──────────────────────────────
    if (authToggleBtn) {
        authToggleBtn.addEventListener('click', () => {
            isLoginMode = !isLoginMode;
            authError?.classList.add('hidden');
            if (isLoginMode) {
                if (modalTitle)   modalTitle.textContent  = 'Welcome Back';
                if (modalDesc)    modalDesc.textContent   = 'Sign in to your F3 account';
                if (authSubmitBtn)authSubmitBtn.textContent = 'Sign In';
                if (authToggleText) authToggleText.textContent = "Don't have an account?";
                authToggleBtn.textContent = 'Register now';
            } else {
                if (modalTitle)   modalTitle.textContent  = 'Create Account';
                if (modalDesc)    modalDesc.textContent   = 'Join the F3 network';
                if (authSubmitBtn)authSubmitBtn.textContent = 'Register';
                if (authToggleText) authToggleText.textContent = 'Already have an account?';
                authToggleBtn.textContent = 'Sign in';
            }
        });
    }

    // ── Form Submit ──────────────────────────────────────────
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email    = authEmail.value.trim();
        const password = authPassword.value;
        if (authError) authError.classList.add('hidden');
        if (authSubmitBtn) { authSubmitBtn.disabled = true; authSubmitBtn.style.opacity = '0.7'; }

        try {
            // Only require role selection if registering
            if (!isLoginMode && !selectedRole) throw new Error("Please select Customer or Farmer to register.");
            if (!auth)         throw new Error("Firebase is not configured correctly.");

            if (isLoginMode) {
                const cred = await signInWithEmailAndPassword(auth, email, password);
                // Try to load role from Firestore (non-fatal — fall back to selected role or default)
                try {
                    const { getDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js");
                    const snap = await getDoc(doc(db, "users", cred.user.uid));
                    if (snap.exists() && snap.data().role) {
                        selectedRole = snap.data().role;
                    } else if (!selectedRole) {
                        selectedRole = 'customer'; // safe default if missing
                    }
                } catch (fsErr) {
                    console.warn("Could not fetch role from Firestore, using selected role:", fsErr.message);
                    if (!selectedRole) selectedRole = 'customer';
                }

            } else {
                const cred = await createUserWithEmailAndPassword(auth, email, password);
                const { setDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js");
                await setDoc(doc(db, "users", cred.user.uid), {
                    email, role: selectedRole, createdAt: serverTimestamp()
                });
                await sendEmailVerification(cred.user);
                F3Toast.info('Verification email sent! Check your inbox.');
            }

            localStorage.setItem('userRole', selectedRole);
            localStorage.setItem('userEmail', email);

            if (authModal) authModal.classList.add('hidden');
            authForm.reset();

            F3Toast.success(`Welcome! Signed in as ${selectedRole} 🎉`);

            // Redirect based on role
            setTimeout(() => {
                window.location.href = selectedRole === 'farmer' ? 'farmer-orders.html' : 'market.html';
            }, 800);

        } catch (error) {
            console.error("Auth error:", error);
            const msg = error.code === 'auth/invalid-credential' ? 'Invalid email or password.'
                      : error.code === 'auth/email-already-in-use' ? 'Email already registered. Sign in instead.'
                      : error.code === 'auth/weak-password' ? 'Password must be at least 6 characters.'
                      : error.message;
            if (authError) { authError.textContent = msg; authError.classList.remove('hidden'); }
        } finally {
            if (authSubmitBtn) { authSubmitBtn.disabled = false; authSubmitBtn.style.opacity = '1'; }
        }
    });

    // ── Sign In button in old sidebar (non-injected pages) ──
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
