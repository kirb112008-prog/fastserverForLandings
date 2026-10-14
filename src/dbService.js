const { createClient } = require('@libsql/client')
const XLSX = require('xlsx')
const XLSX_PATH = process.env.XLSX_PATH || './src/converted/users.xlsx'

const DBParams = ["id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL",
                    "name VARCHAR(255) NOT NULL",
                    "email VARCHAR(60) NOT NULL",
                    "phone VARCHAR(20) NOT NULL",
                    "niche VARCHAR(20) NOT NULL"]


class TursoService {
    constructor() {
        this.db = createClient({
            url: process.env.TURSO_DATABASE_URL,
            authToken: process.env.TURSO_AUTH_TOKEN
        })
    }

    async init() {
        await this.db.execute(`CREATE TABLE IF NOT EXISTS users (${DBParams.join(', ')});`)
    }

    async addUser({ name, email, phone, niche }) {
        try {
            await this.db.execute({
                sql: "INSERT INTO users (name, email, phone, niche) VALUES (?, ?, ?, ?)",
                args: [name, email, phone, niche]
            })
        } catch {
            throw new Error('Error of editing database')
        }
    }

    async getUsersToXlsx() {
        const { rows } = await this.db.execute('SELECT * FROM users')
        const workSheet = XLSX.utils.json_to_sheet(rows.map(row => ({ ...row })), { dense: true })
        const workBook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workBook, workSheet, 'Пользователи')
        XLSX.writeFile(workBook, XLSX_PATH)
    }
}

module.exports = TursoService
