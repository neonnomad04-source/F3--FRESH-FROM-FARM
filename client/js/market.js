// ========================================
// F3 - Dynamic Marketplace & Cart
// ========================================

const API_BASE = '/api';
const currentUserEmail = localStorage.getItem('userEmail') || 'customer@example.com';

let cart = JSON.parse(localStorage.getItem('agriCart')) || [];
let selectedPaymentMethod = 'upi';

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();

document.addEventListener('DOMContentLoaded', () => {
    loadDynamicProducts();
    updateCartUI();
    
    // Check for direct view parameter (e.g. market.html?view=orders)
    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.get('view') === 'orders') {
        setTimeout(() => switchMarketSubView('orders'), 100);
    }
});

// ========================================
// View & Sub-view Navigation
// ========================================
function showView(viewName) {
    ['marketplace', 'details'].forEach(v => {
        const el = document.getElementById('view-' + v);
        if (el) el.classList.add('hidden');
    });

    const target = document.getElementById('view-' + viewName);
    if (target) target.classList.remove('hidden');

    if (viewName === 'marketplace') {
        switchMarketSubView('browse');
    }
    
    document.getElementById('main-scroll').scrollTop = 0;
}

function switchMarketSubView(sub) {
    const browse = document.getElementById('subview-browse');
    const orders = document.getElementById('subview-orders');
    const tabBrowse = document.getElementById('tab-browse');
    const tabOrders = document.getElementById('tab-orders');

    if(sub === 'browse') {
        browse.classList.remove('hidden');
        orders.classList.add('hidden');
        tabBrowse.className = 'px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-white dark:bg-slate-700 text-dark dark:text-white shadow-sm';
        tabOrders.className = 'px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-slate-400 hover:text-dark dark:hover:text-white';
    } else {
        orders.classList.remove('hidden');
        browse.classList.add('hidden');
        tabOrders.className = 'px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-white dark:bg-slate-700 text-dark dark:text-white shadow-sm';
        tabBrowse.className = 'px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-slate-400 hover:text-dark dark:hover:text-white';
        loadOrders();
    }
}


// ========================================
// Dynamic Product Loading
// ========================================
async function loadDynamicProducts() {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    // Fetch all products (including those without timestamps)
    db.collection('products').onSnapshot((querySnapshot) => {
        grid.innerHTML = '';
        
        const products = [];
        querySnapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });

        // Sort by createdAt if it exists, otherwise put at the end
        products.sort((a,b) => {
            const timeA = a.createdAt?.toMillis() || 0;
            const timeB = b.createdAt?.toMillis() || 0;
            return timeB - timeA;
        });
        
        if (products.length > 0) {
            products.forEach(p => {
                const card = createProductCard(p);
                grid.insertAdjacentHTML('beforeend', card);
            });
        } else {
            grid.innerHTML = '<div class="col-span-full text-center py-20 text-slate-400 font-bold">No products found in the network.</div>';
        }
    }, (err) => {
        console.error('Real-time sync failed:', err);
    });
}

function createProductCard(p) {
    return `
        <div class="product-card bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex flex-col group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300" 
             data-category="${p.category}" 
             onclick="showProductDetails('${p.name}', '${p.category}', ${p.price}, '${p.image_url}')">
            <div class="relative h-48 rounded-2xl overflow-hidden mb-4 bg-slate-100">
                <span class="absolute top-3 left-3 bg-white/90 backdrop-blur text-slate-700 text-xs font-bold px-2.5 py-1 rounded-lg z-10 shadow-sm">${p.category}</span>
                <div class="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style="background-image: url('${p.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e'}')"></div>
            </div>
            <h3 class="font-bold text-lg text-slate-800 mb-1 leading-tight">${p.name}</h3>
            <p class="text-xs text-slate-400 mb-4 line-clamp-2">${p.description || 'Fresh harvest direct from farmer.'}</p>
            <div class="mt-auto pt-4 flex flex-col gap-3">
                <div class="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between">
                    <div>
                        <p class="text-[10px] font-bold text-slate-400 uppercase">Unit Price</p>
                        <p class="font-black text-dark leading-none text-xl">₹${p.price}</p>
                    </div>
                </div>
                <button onclick="event.stopPropagation(); addToCart('${p.id}', '${p.name}', ${p.price}, '${p.image_url}', '${p.farmer_email}')" class="w-full py-2.5 bg-primary hover:bg-dark text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                    Add to Basket
                </button>
            </div>
        </div>
    `;
}

// ========================================
// Cart Logic
// ========================================
function addToCart(id, name, price, img, farmer) {
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ id, name, price, img, farmer, qty: 1 });
    }
    
    saveCart();
    updateCartUI();
    showToast(`${name} added to basket!`);
}

function updateCartUI() {
    const countEl = document.getElementById('cart-count');
    const itemsEl = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    
    if (countEl) countEl.innerText = totalQty;
    if (totalEl) totalEl.innerText = `₹${totalPrice}`;
    
    if (itemsEl) {
        if (cart.length === 0) {
            itemsEl.innerHTML = `
                <div class="text-center py-20">
                    <div class="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                        <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                    </div>
                    <p class="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Your basket is empty</p>
                </div>
            `;
        } else {
            itemsEl.innerHTML = cart.map((item, idx) => `
                <div class="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div class="w-16 h-16 rounded-xl bg-cover bg-center" style="background-image: url('${item.img}')"></div>
                    <div class="flex-1">
                        <p class="font-bold text-slate-800 text-sm">${item.name}</p>
                        <p class="text-slate-400 text-xs font-medium">₹${item.price} x ${item.qty}</p>
                    </div>
                    <button onclick="removeFromCart(${idx})" class="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-red-400 hover:bg-red-50 transition-all">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            `).join('');
        }
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('agriCart', JSON.stringify(cart));
}

// ========================================
// Multi-Step Checkout Modal Logic
// ========================================
function toggleCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    if (modal.classList.contains('hidden')) {
        if (cart.length === 0) {
            F3Toast.warning('Your basket is empty! Add items first.');
            return;
        }
        modal.classList.remove('hidden');
        gotoCheckoutStep(1);
    } else {
        modal.classList.add('hidden');
    }
}

function gotoCheckoutStep(step) {
    document.getElementById('checkout-step-1').classList.add('hidden');
    document.getElementById('checkout-step-2').classList.add('hidden');
    
    // Reset indicators
    const ind1 = document.getElementById('step-indicator-1');
    const ind2 = document.getElementById('step-indicator-2');
    const progress = document.getElementById('step-progress-bar');
    
    ind1.className = 'step-bubble step-bubble-inactive';
    ind2.className = 'step-bubble step-bubble-inactive';

    document.getElementById('checkout-step-' + step).classList.remove('hidden');
    
    if (step === 1) {
        ind1.className = 'step-bubble step-bubble-active';
        progress.style.width = '0%';
    } else {
        ind1.className = 'step-bubble bg-agri-dark text-white'; // Completed state
        ind2.className = 'step-bubble step-bubble-active';
        progress.style.width = '100%';
    }
}


function setPaymentMethod(method) {
    selectedPaymentMethod = method;
    ['card', 'cod', 'upi'].forEach(m => {
        const btn = document.getElementById(`pay-${m}-btn`);
        const ctx = document.getElementById(`pay-context-upi`); // Only UPI has a context area currently
        
        if (m === method) {
            btn.classList.add('active');
            if (m === 'upi') {
                ctx.classList.remove('hidden');
            } else {
                ctx.classList.add('hidden');
            }
        } else {
            btn.classList.remove('active');
        }
    });
}


// ========================================
// Final Checkout Submission
// ========================================
async function checkout() {
    const phone = document.getElementById('ship-phone').value;
    const address = document.getElementById('ship-address').value;

    if (!phone || !address) {
        F3Toast.warning('Please fill in your shipping details.');
        return gotoCheckoutStep(1);
    }

    const btn = document.getElementById('final-checkout-btn');
    btn.disabled = true;
    btn.innerText = 'Syncing with Firebase...';

    try {
        const orderPromises = cart.map(item => {
            return db.collection('orders').add({
                user_email: currentUserEmail,
                product_id: item.id,
                product_name: item.name,
                category: 'Marketplace',
                quantity: item.qty,
                price: item.price * item.qty,
                farmer_name: item.farmer,
                phone: phone,
                address: address,
                payment_method: selectedPaymentMethod,
                status: 'Processing',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });

        await Promise.all(orderPromises);
        F3Toast.success('Order placed! 🎉 Check My Orders for status.');
        cart = [];
        saveCart();
        updateCartUI();
        toggleCheckoutModal();
        toggleCartModal();
        switchMarketSubView('orders');
        // Generate dynamic QR for UPI if selected
        if (selectedPaymentMethod === 'upi') {
            const total = cart.reduce ? 0 : 0; // cart already cleared, total shown before
            generateQR(total);
        }
    } catch (err) {
        console.error('Firebase Checkout Error:', err);
        F3Toast.error('Checkout failed. Please check your network connection.');
    } finally {
        btn.disabled = false;
        btn.innerText = 'Order Now';
    }
}

// ========================================
// Modal & Utility Functions
// ========================================
function toggleCartModal() {
    const modal = document.getElementById('cart-modal');
    const panel = document.getElementById('cart-panel');
    
    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        setTimeout(() => panel.classList.remove('translate-x-full'), 10);
    } else {
        panel.classList.add('translate-x-full');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
}

function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'fixed top-12 left-1/2 -translate-x-1/2 z-[300] bg-agri-dark text-white px-8 py-4 rounded-2xl font-bold shadow-2xl animate-slide-up border border-white/10';
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ========================================
// Order Tracking (Enhanced)
// ========================================
async function loadOrders() {
    const list = document.getElementById('dynamic-orders-list');
    if (!list) return;
    
    list.innerHTML = `
        <div class="text-center py-20">
            <div class="w-16 h-16 border-4 border-agri-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p class="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing with Firebase Cloud...</p>
        </div>
    `;
    
    try {
        const querySnapshot = await db.collection('orders')
            .where('user_email', '==', currentUserEmail)
            .get();
        
        const myOrders = [];
        querySnapshot.forEach(doc => {
            myOrders.push({ id: doc.id, ...doc.data() });
        });

        // Manual sort by createdAt
        myOrders.sort((a,b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        
        if (myOrders.length > 0) {
            list.innerHTML = myOrders.map(o => `
                <div class="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-white/5 shadow-sm flex flex-col md:flex-row items-center gap-8 group hover:shadow-md transition-all">
                    <div class="w-24 h-24 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 flex-shrink-0">
                        <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                    </div>
                    <div class="flex-1 text-center md:text-left">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Transaction ID: #${o.id.slice(0,8)}</p>
                        <h4 class="text-xl font-extrabold text-slate-800 dark:text-white mb-1">${o.product_name}</h4>
                        <p class="text-sm font-medium text-slate-500">From: <span class="text-agri-green-light font-bold">${o.farmer_name || 'F3 Direct'}</span></p>
                    </div>
                    <div class="px-8 border-x border-slate-100 dark:border-white/5 text-center flex-shrink-0">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Paid</p>
                        <p class="text-2xl font-black text-dark dark:text-agri-gold">₹${o.price}</p>
                    </div>
                    <div class="flex-shrink-0 w-full md:w-64 text-left">
                         <div class="flex justify-between text-[10px] font-black uppercase tracking-widest mb-3">
                            <span class="${o.status !== 'Delivered' ? 'text-agri-gold' : 'text-slate-300'}">In Transit</span>
                            <span class="${o.status === 'Delivered' ? 'text-agri-green' : 'text-slate-300'}">Delivered</span>
                        </div>
                        <div class="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                            <div class="h-full bg-agri-gold transition-all duration-1000" style="width: ${o.status === 'Delivered' ? '100%' : '50%'}"></div>
                        </div>
                        <p class="text-[9px] text-slate-400 mt-2 font-bold uppercase">Placed on ${o.createdAt ? new Date(o.createdAt.toMillis()).toLocaleDateString() : 'Pending'}</p>
                    </div>
                </div>
            `).join('');
        } else {
            list.innerHTML = `
                <div class="text-center py-20 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-white/5">
                    <p class="text-slate-400 font-bold uppercase tracking-widest text-xs">No active orders found in Firebase</p>
                    <button onclick="switchMarketSubView('browse')" class="mt-4 text-agri-green font-black text-xs uppercase tracking-widest hover:underline">Go Shopping →</button>
                </div>
            `;
        }
    } catch (err) {
        console.error('Firebase Order Fetch Error:', err);
        list.innerHTML = `<div class="text-center py-20 text-red-400 font-bold">Failed to sync with Firebase Cloud.</div>`;
    }
}

// Global Exports
window.showView = showView;
window.switchMarketSubView = switchMarketSubView;
window.toggleCartModal = toggleCartModal;
window.toggleCheckoutModal = toggleCheckoutModal;
window.gotoCheckoutStep = gotoCheckoutStep;
window.setPaymentMethod = setPaymentMethod;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.checkout = checkout;

// ========================================
// Dynamic QR Code Generator (UPI)
// ========================================
function generateQR(amount = 0) {
    const canvas = document.getElementById('upi-qr-canvas');
    if (!canvas) return;
    const upiId = 'f3freshfromfarm@upi';
    const name = 'F3 Fresh From Farm';
    const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`;
    if (typeof QRCode !== 'undefined') {
        QRCode.toCanvas(canvas, upiString, { width: 180, margin: 2, color: { dark: '#2B1B0E', light: '#FFFDF7' } });
    }
}

// Generate QR when UPI payment selected
document.addEventListener('DOMContentLoaded', () => {
    const upiBtn = document.getElementById('pay-upi-btn');
    if (upiBtn) {
        upiBtn.addEventListener('click', () => {
            const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
            setTimeout(() => generateQR(total), 100);
        });
    }
});

window.generateQR = generateQR;
window.loadOrders = loadOrders;
window.showProductDetails = (name, cat, price, img) => {
    document.getElementById('detail-title').innerText = name;
    document.getElementById('detail-img').src = img;
    showView('details');
};
window.hideProductDetails = () => showView('marketplace');
