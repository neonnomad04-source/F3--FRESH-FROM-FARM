import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import aiRouter from './routes/ai.js';
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, getDoc, query, orderBy, where, serverTimestamp } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3005;

// Middleware
app.use(cors());
app.use(express.json());

// AI Routes (Groq proxy — key stays server-side)
app.use('/api/ai', aiRouter);

// Firebase Configuration & Initialization
const firebaseConfig = {
  apiKey: "AIzaSyCzroaT4ACLvBXNUr2mVDBBL6RfPN24jFo",
  authDomain: "farming-e1126.firebaseapp.com",
  projectId: "farming-e1126",
  storageBucket: "farming-e1126.firebasestorage.app",
  messagingSenderId: "826412688061",
  appId: "1:826412688061:web:60e88600378518b7688dd4"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Serve welcome.html as the immersive landing page at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'welcome.html'));
});

// Serve all static client files (HTML, CSS, JS, assets) with no caching in dev
app.use(express.static(path.join(__dirname, '..', 'client'), {
    etag: false,
    lastModified: false,
    setHeaders: (res) => {
        res.setHeader('Cache-Control', 'no-store');
    }
}));

// ========================================
// Product Routes
// ========================================
app.post('/api/products', async (req, res) => {
    const { name, category, quantity, price, image_url, farmer_email, description } = req.body;
    try {
        const docRef = await addDoc(collection(db, "products"), {
            name, category, 
            quantity: Number(quantity), 
            price: Number(price), 
            image_url, farmer_email, description,
            created_at: serverTimestamp()
        });
        res.status(200).json({ success: true, id: docRef.id });
    } catch (err) {
        console.error('Product creation error:', err);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

app.get('/api/products', async (req, res) => {
    try {
        const q = query(collection(db, "products"));
        const querySnapshot = await getDocs(q);
        const rows = [];
        querySnapshot.forEach((doc) => {
            rows.push({ id: doc.id, ...doc.data() });
        });
        rows.sort((a,b) => (b.created_at?.toMillis() || 0) - (a.created_at?.toMillis() || 0));
        res.status(200).json(rows);
    } catch (err) {
        console.error('Products fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// ========================================
// Registration Routes
// ========================================
app.post('/api/register', async (req, res) => {
    const { first_name, last_name, farm_location, crop_type, email, farm_size } = req.body;
    try {
        const docRef = await addDoc(collection(db, "registrations"), {
            first_name, last_name, farm_location, crop_type, email, farm_size: Number(farm_size),
            created_at: serverTimestamp()
        });
        console.log(`New farm registered: ${first_name} ${last_name} (${email})`);
        res.status(200).json({ success: true, id: docRef.id });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Database insertion failed' });
    }
});

app.get('/api/registrations', async (req, res) => {
    try {
        const q = query(collection(db, "registrations"));
        const querySnapshot = await getDocs(q);
        const rows = [];
        querySnapshot.forEach((doc) => {
            rows.push({ id: doc.id, ...doc.data() });
        });
        rows.sort((a,b) => (b.created_at?.toMillis() || 0) - (a.created_at?.toMillis() || 0));
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch registrations' });
    }
});

// ========================================
// Auth Notification Routes
// ========================================
app.post('/api/login-notify', async (req, res) => {
    const { email } = req.body;
    console.log(`Login notification for: ${email}`);
    res.status(200).json({ success: true, message: 'Notification logged' });
});

// ========================================
// Order Routes (Marketplace)
// ========================================
app.post('/api/orders', async (req, res) => {
    const { user_email, product_name, category, quantity, price, farmer_name, phone, address, payment_method } = req.body;

    if (!user_email || !product_name) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    try {
        const docRef = await addDoc(collection(db, "orders"), {
            user_email, product_name, 
            category: category || '', 
            quantity: Number(quantity || 1), 
            price: Number(price || 0), 
            farmer_name: farmer_name || '', 
            phone: phone || '', 
            address: address || '', 
            payment_method: payment_method || 'UPI',
            status: 'Processing',
            created_at: serverTimestamp()
        });

        console.log(`New order placed: ${product_name} by ${user_email}`);
        res.status(200).json({ success: true, id: docRef.id });
    } catch (err) {
        console.error('Order error:', err);
        res.status(500).json({ success: false, message: 'Failed to place order' });
    }
});

app.get('/api/orders/:email', async (req, res) => {
    const { email } = req.params;
    try {
        // Simple filter query
        const q = query(collection(db, "orders"), where("user_email", "==", email));
        const querySnapshot = await getDocs(q);
        const rows = [];
        querySnapshot.forEach((doc) => {
            rows.push({ id: doc.id, ...doc.data() });
        });
        
        // Client-side sort fallback since compound index might be missing
        rows.sort((a,b) => (b.created_at?.toMillis() || 0) - (a.created_at?.toMillis() || 0));

        res.status(200).json({ success: true, data: rows });
    } catch (err) {
        console.error('Fetch orders error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch orders' });
    }
});

// ========================================
// Update Order Status
// ========================================
app.patch('/api/orders/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    try {
        const orderRef = doc(db, "orders", id);
        await updateDoc(orderRef, { status });

        if (status === 'Delivered') {
            const orderSnap = await getDoc(orderRef);
            if(orderSnap.exists()) {
                const orderData = orderSnap.data();
                if (orderData.quantity) {
                    // Reduce Stock
                    const q = query(collection(db, "products"), where("name", "==", orderData.product_name), where("farmer_email", "==", orderData.farmer_name));
                    const prodSnapshot = await getDocs(q);
                    
                    prodSnapshot.forEach(async (prodDoc) => {
                        const newQuantity = Math.max(0, prodDoc.data().quantity - orderData.quantity);
                        await updateDoc(doc(db, "products", prodDoc.id), { quantity: newQuantity });
                    });
                }
            }
        }
        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Order update error:', err);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

app.get('/api/orders', async (req, res) => {
    try {
        const q = query(collection(db, "orders"));
        const querySnapshot = await getDocs(q);
        const rows = [];
        querySnapshot.forEach((doc) => {
            rows.push({ id: doc.id, ...doc.data() });
        });
        
        // Manual sort to avoid index requirements in dev
        rows.sort((a,b) => (b.created_at?.toMillis() || 0) - (a.created_at?.toMillis() || 0));
        
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// ========================================
// Start Server (local dev) or export for Vercel serverless
// ========================================
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`✅ F3: Fresh From Farm server running at http://localhost:${port}`);
    });
}

export default app;
