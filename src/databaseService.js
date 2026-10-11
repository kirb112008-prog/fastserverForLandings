const sqlite3 = require('sqlite3').verbose();
const XLSX = require('xlsx')
const DB_PATH = process.env.DB_PATH || './app.db'
const XLSX_PATH = process.env.XLSX_PATH || './src/converted/users.xlsx'

const DBParams = ["id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL",
                    "name VARCHAR(255) NOT NULL", 
                    "email VARCHAR(60) NOT NULL", 
                    "phone VARCHAR(20) NOT NULL", 
                    "niche VARCHAR(20) NOT NULL"]

class DBService {
    async init() {
        const db = new sqlite3.Database(DB_PATH);
        db.run(`CREATE TABLE IF NOT EXISTS users (${DBParams.join(', ')});`);
    }

    async addUser({ name, email, phone, niche }) {
        const db = new sqlite3.Database(DB_PATH);
        db.serialize(() => {
            const stmt = db.prepare("INSERT INTO users (name, email, phone, niche) VALUES (?, ?, ?, ?)");
            try {
                stmt.run(name, email, phone, niche);
                stmt.finalize();
            } catch {
                throw new Error('Error of editing database')
            }
            db.close();
        });
    }

    async getUsersToXlsx() {
        const db = new sqlite3.Database(DB_PATH);
        db.all('SELECT * FROM users', (err, rows) => {
            const workSheet = XLSX.utils.json_to_sheet(rows, { dense: true });
            const workBook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workBook, workSheet, 'Пользователи')
            XLSX.writeFile(workBook, XLSX_PATH)
        })
        db.close()
    }
}

module.exports = DBService;
