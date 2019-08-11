const mongoose = require('mongoose')
// const { complianceConfig } = require('../config/compliance.config')

const Schema = mongoose.Schema

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    require: true
  },
  lastName: {
    type: String,
    require: true
  },
  passwordHash: {
    type: String,
    require: true
  }
})

module.exports = mongoose.model('User', UserSchema)
