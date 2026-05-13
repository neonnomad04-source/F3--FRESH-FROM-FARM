const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'agricoop.db'));

try {
    console.log('Dropping old tables to force re-seed...');
    db.exec(`
        DROP TABLE IF EXISTS market_prices;
        DROP TABLE IF EXISTS products;
    `);

    console.log('Creating products table...');
    db.exec(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL DEFAULT 'Grains',
            price REAL NOT NULL,
            unit TEXT NOT NULL DEFAULT 'kg',
            stock INTEGER DEFAULT 100,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    console.log('Seeding products...');
    const insert = db.prepare('INSERT INTO products (name, category, price, unit, stock) VALUES (?, ?, ?, ?, ?)');
    const items = [
        ['Premium Basmati Rice', 'Grains', 120, 'kg', 500],
        ['Organic Whole Wheat', 'Grains', 45, 'kg', 1000],
        ['Pure Mustard Oil', 'Oils', 180, 'Litre', 200],
        ['Fresh Turmeric Powder', 'Spices', 250, 'kg', 150],
        ['Natural Forest Honey', 'Sweeteners', 450, 'kg', 80],
        ['Roasted Groundnuts', 'Snacks', 140, 'kg', 300],
        ['A2 Desi Cow Ghee', 'Dairy', 1200, 'kg', 40],
        ['Organic Jaggery Blocks', 'Sweeteners', 90, 'kg', 250],
    ];

    for (const item of items) {
        insert.run(...item);
    }
    console.log('✅ Successfully fixed database and seeded products.');

} catch (err) {
    console.error('❌ Error fixing database:', err);
} finally {
    db.close();
}
