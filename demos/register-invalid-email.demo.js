const mongoose = require('mongoose')
const { connectionString } = require('../config/database.config')
const AccountController = require('../controller/account')
const User = require('../models/user')

mongoose.connect(connectionString, { useNewUrlParser: true }).then(
  function () {
    const session = {}

    const controller = new AccountController(User, session)
    mongoose.connection.collections.users.drop().then(function () {
      const testUser = new User({
        email: 'hello',
        firstName: 'John',
        lastName: 'Doe',
        password: 'helloH1234'
      })
      const registerPromise = controller.register(testUser).catch((err) => err)
      registerPromise.then(function (result) {
        console.log(result)
        process.exit()
      })
    })
  },
  function (err) {
    if (err) throw err
  }
)
