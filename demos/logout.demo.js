const mongoose = require('mongoose')
const { connectionString } = require('../config/database.config')
const AccountController = require('../controller/account')
const User = require('../models/user')

mongoose.connect(connectionString, { useNewUrlParser: true }).then(
  function () {
    const controller = new AccountController(User, {})

    console.log('Creating Demo Session...\n')

    controller.session = {
      userProfileModel: {
        email: 'hello@example.com',
        firstName: 'John',
        lastName: 'Doe'
      },
      expires: 1565716577377

    }

    console.log('Session is: \n')

    console.log(controller.session)
    console.log('Logging out..')
    controller.logout()
    console.log('Session is: \n')
    console.log(controller.session)
    process.exit()
  },
  function (err) {
    if (err) throw err
  }
)
