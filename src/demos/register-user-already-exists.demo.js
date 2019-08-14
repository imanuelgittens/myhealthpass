const mongoose = require('mongoose')
const { connectionString } = require('../config/database.config')
const AccountController = require('../controller/account')
const User = require('../models/user')

mongoose.connect(connectionString, { useNewUrlParser: true }).then(
  function () {
    const userData = {
      email: 'hello@example.com',
      firstName: 'John',
      lastName: 'Doe',
      password: 'helloH1234'
    }

    const user = new User(userData)

    const controller = new AccountController(User, {})

    controller.register(user, function (err, apiResponse) {
      if (err) throw err
      console.log(apiResponse)
      process.exit()
    })
  },
  function (err) {
    if (err) throw err
  }
)
