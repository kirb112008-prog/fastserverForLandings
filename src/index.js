const cors = require('cors')
const XLSX = require('xlsx')
const express = require("express")
const app = express()

require('dotenv').config()

const DBService = require('./dbService')
const DBManager = new DBService();
DBManager.init();

const MailService = require('./mailService')
const MailManager = new MailService()

const REQ_BODY_PARAMS = {
  name: '',
  email: '',
  phone: '',
  niche: ''
}

const allowedOrigins = process.env.ALLOWED_URLS.split(' ')


const corsOptions = {
  origin: function(origin, callback) {
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  }
};

app.use(cors(corsOptions))
app.use(express.json())


app.post('/postUserData', async (req, res) => {
  if (req.headers['authorization'] == "Bearer " + process.env.ACCESS_TOKEN) {
    const userData = req.body
    console.log(userData)

    if (!userData) {
      res.status(403).send('Uncorrect JSON body')
    }

    else if (Object.keys(userData).length != Object.keys(REQ_BODY_PARAMS).length) {
      res.status(403).json('Uncorrect JSON body')
    } else {
      for (let i = 0; i < Object.keys(REQ_BODY_PARAMS).length; i++) {
        if (Object.keys(REQ_BODY_PARAMS)[i] != Object.keys(userData)[i]) {
          res.status(403).json('Uncorrect JSON body')
        }
      }

      try {
        await DBManager.addUser(userData)
      } catch (err) {
        console.error(err)
        return res.status(500).json('Error of editing database')
      }

      MailManager.sendWelcomeMail(userData.email)
        .catch(err => console.error('Mail sending failed:', err.message))

      res.status(200).send('Succes')
    }
  } else {
    res.status(401).json("Unauthorised")
  }
})

app.get('/getUsers', async (req, res) => {
  if (req.headers['authorization'] == "Bearer " + process.env.ACCESS_TOKEN) {
    DBManager.getUsersToXlsx()

    res.status(200).sendFile(__dirname + '/converted/users.xlsx')
  } else {
    res.status(401).send("Unauthorised")
  }
})

app.listen(process.env.PORT, console.log(`Server started on ${process.env.PORT} port`))