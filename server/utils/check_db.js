const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'agricoop.db'));

try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Tables:', tables.map(t => t.name));

    if (tables.some(t => t.name === 'products')) {
        const products = db.prepare('SELECT * FROM products').all();
        console.log('Products count:', products.length);
    } else {
        console.log('Table "products" does not exist!');
    }
} catch (err) {
    console.error('Error:', err);
} finally {
    db.close();
}
