const mongoose = require('mongoose')
const { maxBFLoginAttempts } = require('../config/compliance.config')
const { bruteForceLockoutTime } = require('../config/compliance.config')

const Schema = mongoose.Schema

const FailedLoginSchema = new Schema({
  reqSignature: {
    type: String,
    required: true,
    unique: true
  },
  loginAttempts: {
    type: Number,
    required: true,
    default: 0
  },
  lockUntil: {
    type: Number
  }
})

FailedLoginSchema.virtual('isLocked').get(function () {
  // check for a future lockUntil timestamp
  return !!(this.lockUntil && this.lockUntil > Date.now())
})

FailedLoginSchema.methods.incLoginAttempts = function (cb) {
  // if we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    }, cb)
  }
  // otherwise we're incrementing
  var updates = { $inc: { loginAttempts: 1 } }
  // lock the login functionality if we've reached max attempts and it's not locked already
  if (this.loginAttempts + 1 >= maxBFLoginAttempts && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + bruteForceLockoutTime }
  }
  return this.update(updates, cb)
}

module.exports = mongoose.model('FailedLogin', FailedLoginSchema)
