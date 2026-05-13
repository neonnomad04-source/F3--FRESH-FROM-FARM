// ========================================
// F3 - Main Application JavaScript
// index.js - Firebase Auth, Registration, UI
// ========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-analytics.js";
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
let app, auth, analytics, db;
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    analytics = getAnalytics(app);
    db = getFirestore(app);
} catch (e) {
    console.warn("Firebase not properly configured:", e);
}

// ========================================
// DOM Element References
// ========================================
let isLoginMode = true;
const authBtn = document.getElementById('auth-btn');
const userProfile = document.getElementById('user-profile');
const userEmailSpan = document.getElementById('user-email');
const userRoleSpan = document.getElementById('user-role');
const logoutBtn = document.getElementById('logout-btn');
const authModal = document.getElementById('auth-modal');
const authForm = document.getElementById('auth-form');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const authToggleBtn = document.getElementById('auth-toggle-btn');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-desc');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authToggleText = document.getElementById('auth-toggle-text');
const authError = document.getElementById('auth-error');

// ========================================
// Role Selector Logic
// ========================================
let selectedRole = 'customer'; // Default to customer

window.selectRole = function(role) {
    selectedRole = role;
    const customerBtn = document.getElementById('btn-customer');
    const farmerBtn = document.getElementById('btn-farmer');
    
    if (customerBtn) customerBtn.classList.remove('active');
    if (farmerBtn) farmerBtn.classList.remove('active');
    
    const selectedBtn = document.getElementById('btn-' + role);
    if (selectedBtn) selectedBtn.classList.add('active');
    console.log("Role selected:", selectedRole);
};

// Initialize default UI state
document.addEventListener('DOMContentLoaded', () => {
    // Only highlight if no role is saved, otherwise show saved role
    const saved = localStorage.getItem('userRole');
    if (saved) {
        window.selectRole(saved);
    } else {
        window.selectRole('customer');
    }
});

// ========================================
// Auth Mode Toggle (Login / Register)
// ========================================
authToggleBtn.addEventListener('click', () => {
    isLoginMode = !isLoginMode;
    authError.classList.add('hidden');
    if (isLoginMode) {
        modalTitle.textContent = 'Welcome Back';
        modalDesc.textContent = 'Sign in to your F3 account';
        authSubmitBtn.textContent = 'Sign In';
        authToggleText.textContent = "Don't have an account?";
        authToggleBtn.textContent = 'Register now';
    } else {
        modalTitle.textContent = 'Create Account';
        modalDesc.textContent = 'Join the F3 network';
        authSubmitBtn.textContent = 'Register';
        authToggleText.textContent = "Already have an account?";
        authToggleBtn.textContent = 'Sign in';
    }
});

// ========================================
// Auth Form Submission (Login / Register)
// ========================================
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = authEmail.value;
    const password = authPassword.value;
    authError.classList.add('hidden');
    authSubmitBtn.disabled = true;
    authSubmitBtn.style.opacity = '0.7';

    try {
        if (!selectedRole) {
            throw new Error("Please select your role (Customer or Farmer) to proceed.");
        }

        if (!auth || firebaseConfig.apiKey === "YOUR_API_KEY") {
            throw new Error("Please replace the Firebase Config in the source code with your actual credentials.");
        }
        if (isLoginMode) {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Fetch real role from Firestore
            const { getDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js");
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                selectedRole = userDoc.data().role;
            }
            
            localStorage.setItem('userRole', selectedRole);
        } else {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Save role to Firestore
            const { setDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js");
            await setDoc(doc(db, "users", user.uid), {
                email: email,
                role: selectedRole,
                createdAt: serverTimestamp()
            });
            
            localStorage.setItem('userRole', selectedRole);
            await sendEmailVerification(user);
            alert("Verification email sent! Please check your inbox.");
        }
        // Immediate Redirect based on role
        if (selectedRole === 'farmer') {
            window.location.href = 'farmer-orders.html';
        } else {
            window.location.href = 'market.html';
        }

        authModal.classList.add('hidden');
        authForm.reset();
        // Reset role buttons
        document.getElementById('btn-customer').classList.remove('active');
        document.getElementById('btn-farmer').classList.remove('active');
        selectedRole = null;
    } catch (error) {
        authError.textContent = error.message;
        authError.classList.remove('hidden');
    } finally {
        authSubmitBtn.disabled = false;
        authSubmitBtn.style.opacity = '1';
    }
});

// ========================================
// Logout Handler
// ========================================
logoutBtn.addEventListener('click', async () => {
    if (auth) await signOut(auth);
});

// ========================================
// Auth State Observer
// ========================================
if (auth) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            authBtn.classList.add('hidden');
            userProfile.classList.remove('hidden');
            userProfile.classList.add('flex');
            
            // ONLY save role if we are currently in the middle of a login/reg flow
            // Otherwise, keep the existing saved role
            if (selectedRole && !localStorage.getItem('userRole')) {
                localStorage.setItem('userRole', selectedRole);
            }
            userEmailSpan.textContent = user.email;
            let savedRole = localStorage.getItem('userRole');
            
            if (userRoleSpan) {
                // If no role found (old session), default to 'Member' or just show nothing if preferred
                // But user wants to see it, so let's ensure it's not empty if we show it
                userRoleSpan.textContent = savedRole || 'Member';
                userRoleSpan.classList.remove('hidden');
            }
            
            // Handle role-based navigation
            const currentRole = (savedRole || 'Member').toLowerCase();
            console.log("Setting up view for:", currentRole);
            
            document.querySelectorAll('[data-role-req]').forEach(el => {
                const req = el.getAttribute('data-role-req').toLowerCase();
                if (req === currentRole) {
                    el.classList.remove('hidden');
                } else {
                    el.classList.add('hidden');
                }
            });
            
            localStorage.setItem('userEmail', user.email);
        } else {
            authBtn.classList.remove('hidden');
            userProfile.classList.add('hidden');
            userProfile.classList.remove('flex');
            userEmailSpan.textContent = '';
            if (userRoleSpan) {
                userRoleSpan.textContent = '';
                userRoleSpan.classList.add('hidden');
            }
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userRole');
        }
    });
}


