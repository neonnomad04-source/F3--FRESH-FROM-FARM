const Database = require('better-sqlite3');
const db = new Database('agricoop.db');
console.log(db.prepare("PRAGMA table_info(registrations)").all());
