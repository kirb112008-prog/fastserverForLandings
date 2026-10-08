const sqlite3 = require('sqlite3').verbose();
const XLSX = require('xlsx')

class DBService {
    async init() {
        db.run("CREATE TABLE IF NOT EXISTS users (id INT AUTOINCREMENTAL PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(60) NOT NULL, phone VARCHAR(20) NOT NULL, niche VARCHAR(10) NOT NULL);");
    }

    async addUser({ name, email, phone, niche }) {
        const db = new sqlite3.Database('./app.db');
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
        const db = new sqlite3.Database('./app.db');
        db.all('SELECT * FROM users', (err, rows) => {
            const workSheet = XLSX.utils.json_to_sheet(rows, { dense: true });
            const workBook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workBook, workSheet, 'Пользователи')
            XLSX.writeFile(workBook, './src/converted/users.xlsx')
        })
        db.close()
    }
}

module.exports = DBService;
