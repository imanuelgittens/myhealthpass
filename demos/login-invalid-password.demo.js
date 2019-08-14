const mongoose = require('mongoose')
const { connectionString } = require('../config/database.config')
const AccountController = require('../controller/account')
const User = require('../models/user')

mongoose.connect(connectionString, { useNewUrlParser: true }).then(
  function () {
    const email = 'hello@example.com'
    const password = 'invalidpassword'
    const signature = 'demorequestSignature'

    const session = {}

    const controller = new AccountController(User, session)
    mongoose.connection.collections.users.drop().then(function () {
      const testUser = new User({
        email: `hello@example.com`,
        firstName: 'John',
        lastName: 'Doe',
        password: 'Hello1234'
      })
      testUser.save().then(function () {
        const loginPromise = controller.login(email, password, signature).catch((err) => err)
        loginPromise.then(function (result) {
          console.log(result)
          process.exit()
        })
      })
    })
  },
  function (err) {
    if (err) throw err
  }
)
