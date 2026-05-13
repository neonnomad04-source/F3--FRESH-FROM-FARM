const db = require('better-sqlite3')('AgriCoop.db');
['phone TEXT', 'address TEXT', 'payment_method TEXT'].forEach(col => {
    try {
        db.exec("ALTER TABLE orders ADD COLUMN " + col);
        console.log('Added ' + col);
    } catch(e) {
        console.log('Skipped ' + col, e.message);
    }
});
