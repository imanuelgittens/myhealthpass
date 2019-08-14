const mongoose = require('mongoose')
const { connectionString } = require('../config/database.config')
const AccountController = require('../controller/account')
const { permanentLockTime } = require('../config/compliance.config')
const { maxLoginAttempts } = require('../config/compliance.config')
const User = require('../models/user')

mongoose.connect(connectionString, { useNewUrlParser: true }).then(
  function () {
    const email = 'locked@example.com'
    const password = 'Hello1234'
    const signature = 'demorequestSignature'

    const session = {}

    const controller = new AccountController(User, session)
    mongoose.connection.collections.users.drop().then(function () {
      const testLockedUser = new User({
        email: `locked@example.com`,
        firstName: 'John',
        lastName: 'Doe',
        password: 'Hello1234',
        loginAttempts: maxLoginAttempts,
        lockUntil: Date.now() + permanentLockTime
      })
      testLockedUser.save().then(function () {
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
