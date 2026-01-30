const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.resolve(__dirname, '..', 'workout.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Could not connect to database', err.message);
        process.exit(1);
    } else {
        console.log('Connected to SQLite database');
    }
});

db.serialize(() => {
    db.run("PRAGMA foreign_keys = ON;");
});

module.exports = db;