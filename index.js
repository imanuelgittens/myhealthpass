const mongoose = require('mongoose')
const { connectionString } = require('./config/database.config')
const AccountController = require('./controller/account')
const User = require('./models/user')

// const User = require('./models/user')

// mongoose.connect(connectionString, { useNewUrlParser: true }, function (err) {
//   if (err) throw err
//   console.log('Successful connection')
// })

mongoose.connect(connectionString, { useNewUrlParser: true }).then(
  function () {
    const userData = {
      //  email: `hello@example${Math.floor(Math.random() * 1000)}.com`, // add random number in email because it should be unique
      email: 'hello@example89.com',
      firstName: 'John',
      lastName: 'Doe',
      password: 'Hello1234'
    }

    const user = new User(userData)

    const controller = new AccountController(User, 'test')

    console.log(userData)
    controller.register(user, function (err, apiResponse) {
      if (err) throw err
      console.log(apiResponse)
    })
  },
  function (err) {
    if (err) throw err
  }
)
