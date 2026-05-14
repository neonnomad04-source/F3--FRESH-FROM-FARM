// ========================================
// F3 - Main Application JavaScript
// index.js - Firebase Auth ONLY (UI functions are in inline <script>)
// ========================================

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCzroaT4ACLvBXNUr2mVDBBL6RfPN24jFo",
  authDomain: "farming-e1126.firebaseapp.com",
  projectId: "farming-e1126",
  storageBucket: "farming-e1126.firebasestorage.app",
  messagingSenderId: "826412688061",
  appId: "1:826412688061:web:60e88600378518b7688dd4",
  measurementId: "G-PQ91GWEVT8"
};

let app, auth, db;
try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (e) {
    console.error("Firebase initialization failed:", e);
}

// ========================================
// Boot — wire up form submit + auth observer
// ========================================
function bootApp() {
    setTimeout(initAuth, 100);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootApp);
} else {
    bootApp();
}

function initAuth() {
    const authModal    = document.getElementById('auth-modal');
    const authForm     = document.getElementById('auth-form');
    const authEmail    = document.getElementById('auth-email');
    const authPassword = document.getElementById('auth-password');
    const authSubmitBtn= document.getElementById('auth-submit-btn');
    const authError    = document.getElementById('auth-error');

    if (!authForm) return;

    // ── Form Submit ──
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email    = authEmail.value.trim();
        const password = authPassword.value;
        // Read from the GLOBAL variables set by the inline script
        const selectedRole = window._selectedRole || 'customer';
        const isLoginMode  = window._isLoginMode !== false; // default true

        if (authError) authError.classList.add('hidden');
        if (authSubmitBtn) { authSubmitBtn.disabled = true; authSubmitBtn.textContent = 'Please wait...'; }

        try {
            if (!auth) throw new Error("Firebase is not configured.");

            if (isLoginMode) {
                const cred = await signInWithEmailAndPassword(auth, email, password);
                try {
                    const { getDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js");
                    const snap = await getDoc(doc(db, "users", cred.user.uid));
                    if (snap.exists() && snap.data().role) {
                        window._selectedRole = snap.data().role;
                    }
                } catch (fsErr) {
                    console.warn("Could not fetch role:", fsErr.message);
                }
            } else {
                if (!selectedRole) throw new Error("Please select Customer or Farmer.");
                const cred = await createUserWithEmailAndPassword(auth, email, password);
                const { setDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js");
                await setDoc(doc(db, "users", cred.user.uid), {
                    email, role: selectedRole, createdAt: serverTimestamp()
                });
                try { await sendEmailVerification(cred.user); } catch(_){}
                F3Toast.info('Account created! Verification email sent.');
            }

            const finalRole = window._selectedRole || 'customer';
            localStorage.setItem('userRole', finalRole);
            localStorage.setItem('userEmail', email);

            if (authModal) authModal.classList.add('hidden');
            authForm.reset();

            F3Toast.success('Welcome, ' + email + '! Signed in as ' + finalRole.toUpperCase() + ' 🎉');

            setTimeout(() => {
                window.location.href = finalRole.toLowerCase() === 'farmer' ? 'inventory.html' : 'market.html';
            }, 800);

        } catch (error) {
            console.error("Auth error:", error);
            const msg = error.code === 'auth/invalid-credential' ? 'Invalid email or password.'
                      : error.code === 'auth/email-already-in-use' ? 'Email already registered. Sign in instead.'
                      : error.code === 'auth/weak-password' ? 'Password must be at least 6 characters.'
                      : error.code === 'auth/invalid-email' ? 'Please enter a valid email address.'
                      : error.message;
            if (authError) { authError.textContent = msg; authError.classList.remove('hidden'); }
        } finally {
            if (authSubmitBtn) {
                authSubmitBtn.disabled = false;
                const isLogin = window._isLoginMode !== false;
                authSubmitBtn.textContent = isLogin ? 'Sign In' : 'Register & Enter';
            }
        }
    });

    // ── Sidebar Sign In button ──
    const oldAuthBtn = document.getElementById('auth-btn');
    if (oldAuthBtn && authModal) {
        oldAuthBtn.addEventListener('click', () => authModal.classList.remove('hidden'));
    }

    // ── Auth State Observer ──
    if (auth) {
        onAuthStateChanged(auth, (user) => {
            const savedRole  = localStorage.getItem('userRole') || '';
            const savedEmail = user?.email || '';

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
                    sidebarAuth.innerHTML = '<button id="sidebar-signin-btn" class="w-full bg-agri-gold text-agri-dark px-6 py-5 rounded-[1.5rem] text-sm font-black hover:bg-white transition-all shadow-2xl shadow-agri-gold/20 transform hover:-translate-y-1 active:scale-95">Sign In</button>';
                    document.getElementById('sidebar-signin-btn')?.addEventListener('click', () => {
                        authModal?.classList.remove('hidden');
                    });
                }
            }

            document.querySelectorAll('[data-role-req]').forEach(el => {
                const req = el.getAttribute('data-role-req').toLowerCase();
                el.classList.toggle('hidden', req !== savedRole.toLowerCase());
            });

            if (user) localStorage.setItem('userEmail', user.email);
        });
    }
}
