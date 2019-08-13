const mongoose = require('mongoose')
const { connectionString } = require('../config/database.config')
const AccountController = require('../controller/account')
const User = require('../models/user')

mongoose.connect(connectionString, { useNewUrlParser: true }).then(
  function () {
    const userLoginData = {
      email: 'hello@example.com',
      password: 'Hello1234'
    }

    const user1 = new User(userLoginData)

    const controller = new AccountController(User, {})

    controller.login(user1.email, user1.password, 'requestSignature', function (err, apiResponse) {
      if (err) throw err
      console.log('Login Success! \n')
      console.log(apiResponse)
      console.log(`my session is ${controller.session.userProfileModel} \n`)
      process.exit()
    })
  },
  function (err) {
    if (err) throw err
  }
)
