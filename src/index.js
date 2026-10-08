const cors = require('cors')
const XLSX = require('xlsx')
const express = require("express")
const app = express()

require('dotenv').config()

const DBService = require('./databaseService')
const DBManager = new DBService();

const REQ_BODY_PARAMS = {
  name: '',
  email: '',
  phone: '',
  niche: ''
}

let corsOptions = {
  origin: process.env.URL + process.env.PORT,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions))
app.use(express.json())


app.post('/postUserData', async (req, res) => {
  const userData = req.body

  if (!userData) {
     res.status(403).send('Uncorrect JSON body')
  }

  else if (Object.keys(userData).length != Object.keys(REQ_BODY_PARAMS).length) {
    res.status(403).json()
  } else {
    for (let i = 0; i < Object.keys(REQ_BODY_PARAMS).length; i++) {
      if (Object.keys(REQ_BODY_PARAMS)[i] != Object.keys(userData)[i]) {
        res.status(403).json()
      }
    }

    DBManager.addUser(userData)

    res.status(200).send('Succes')
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