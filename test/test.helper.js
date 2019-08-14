// inside tests/test_helper.js
const mongoose = require('mongoose')
const { connectionString } = require('../config/database.config')
const User = require('../models/user')
// tell mongoose to use es6 implementation of promises
mongoose.Promise = global.Promise
mongoose.connect(connectionString)
mongoose.connection
  .once('open', () => console.log('Connected!'))
  .on('error', (error) => {
    console.warn('Error : ', error)
  })
// Called hooks which runs before something.
// beforeEach((done) => {
//   mongoose.connection.collections.users.drop(() => {
//     // this function runs after the drop is completed
//     const user = new User({

//     })
//     done() // go ahead everything is done now.
//   })
// })
