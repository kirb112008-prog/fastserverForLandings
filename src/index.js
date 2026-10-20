const crypto = require('crypto')
const cors = require('cors')
const express = require("express")
const app = express()

require('dotenv').config()

const DBService = require('./dbService')
const DBManager = new DBService();
DBManager.init();

const MailService = require('./mailService')
const MailManager = new MailService()

const REQ_BODY_PARAMS = ['name', 'email', 'phone', 'niche']
const MAX_LENGTH = { name: 255, email: 100, phone: 20, niche: 50 }
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const MAIL_COOLDOWN_MS = 24 * 60 * 60 * 1000

const allowedOrigins = (process.env.ALLOWED_URLS || '').split(' ').filter(Boolean)

const corsOptions = {
  origin: function(origin, callback) {
    // запросы без Origin приходят не из браузера (например, с сервера WordPress),
    // их пропускает только токен
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  }
};

app.use(cors(corsOptions))
app.use(express.json({ limit: '10kb' }))

const safeEqual = (a, b) => {
  const left = Buffer.from(String(a))
  const right = Buffer.from(String(b))

  return left.length === right.length && crypto.timingSafeEqual(left, right)
}

// ACCESS_TOKEN знает только сервер сайта, ADMIN_TOKEN — только вы; в браузер не попадает ни один
const hasToken = (req, secret) => Boolean(secret) && safeEqual(req.headers['authorization'] || '', 'Bearer ' + secret)

const parseUser = (body) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null

  const keys = Object.keys(body)

  if (keys.length !== REQ_BODY_PARAMS.length || !REQ_BODY_PARAMS.every((key, index) => keys[index] === key)) return null

  const user = {}

  for (const key of REQ_BODY_PARAMS) {
    if (typeof body[key] !== 'string') return null

    user[key] = body[key].trim()

    if (!user[key] || user[key].length > MAX_LENGTH[key]) return null
  }

  return EMAIL_PATTERN.test(user.email) ? user : null
}

const lastMail = new Map()

app.post('/postUserData', async (req, res) => {
  if (!hasToken(req, process.env.ACCESS_TOKEN)) {
    return res.status(401).json("Unauthorised")
  }

  const userData = parseUser(req.body)

  if (!userData) {
    return res.status(400).json('Uncorrect JSON body')
  }

  try {
    await DBManager.addUser(userData)
  } catch (err) {
    console.error(err)
    return res.status(500).json('Error of editing database')
  }

  // одному адресу не чаще раза в сутки, иначе форму можно использовать для рассылки спама
  const email = userData.email.toLowerCase()
  const now = Date.now()

  if (!lastMail.has(email) || now - lastMail.get(email) > MAIL_COOLDOWN_MS) {
    lastMail.set(email, now)

    MailManager.sendWelcomeMail(userData.email)
      .catch(err => console.error('Mail sending failed:', err.message))
  }

  res.status(200).send('Succes')
})

app.get('/getUsers', async (req, res) => {
  if (!hasToken(req, process.env.ADMIN_TOKEN)) {
    return res.status(401).send("Unauthorised")
  }

  try {
    await DBManager.getUsersToXlsx()
    res.status(200).sendFile(DBManager.xlsxPath)
  } catch (err) {
    console.error(err)
    res.status(500).send('Error of exporting users')
  }
})

app.listen(process.env.PORT, console.log(`Server started on ${process.env.PORT} port`))
