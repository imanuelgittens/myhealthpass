const mongoose = require('mongoose')
const { connectionString } = require('../config/database.config')
const { maxBFLoginAttempts } = require('../config/compliance.config')
const { bruteForceLockoutTime } = require('../config/compliance.config')
const AccountController = require('../controller/account')
const User = require('../models/user')
const FailedLogin = require('../models/failed-logins')

mongoose.connect(connectionString, { useNewUrlParser: true }).then(
  function () {
    const email = 'hello@example.com'
    const password = 'Hello1234'
    const signature = 'bruteforcedemo'

    const session = {}

    const controller = new AccountController(User, session)
    mongoose.connection.collections.failedlogins.drop().then(function () {
      const failedLogin = new FailedLogin({
        reqSignature: 'bruteforcedemo',
        loginAttempts: maxBFLoginAttempts,
        lockUntil: Date.now() + bruteForceLockoutTime
      })
      failedLogin.save().then(function () {
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
