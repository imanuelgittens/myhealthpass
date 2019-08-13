const mongoose = require('mongoose')
const { connectionString } = require('../config/database.config')
const AccountController = require('../controller/account')
const User = require('../models/user')

mongoose.connect(connectionString, { useNewUrlParser: true }).then(
  function () {
    const userData = {
      email: `hello@example${Math.floor(Math.random() * 1000)}.com`, // add random number in email because it should be unique
      firstName: 'John',
      lastName: 'Doe',
      password: 'hello'
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
