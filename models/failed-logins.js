const mongoose = require('mongoose')
const { bruteForcelockTime } = require('../config/compliance.config')
const { maxBFLoginAttempts } = require('../config/compliance.config')

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

// UserSchema.pre('save', function (next) {
//   var user = this

//   // only hash the password if it has been modified (or is new)
//   if (!user.isModified('password')) return next()

//   // generate a salt
//   bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
//     if (err) return next(err)

//     // hash the password along with our new salt
//     bcrypt.hash(user.password, salt, function (err, hash) {
//       if (err) return next(err)

//       // override the cleartext password with the hashed one
//       user.password = hash
//       next()
//     })
//   })
// })

// UserSchema.methods.comparePassword = function (candidatePassword, cb) {
//   bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
//     if (err) return cb(err)
//     cb(null, isMatch)
//   })
// }

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
  // lock the account if we've reached max attempts and it's not locked already
  if (this.loginAttempts + 1 >= maxBFLoginAttempts && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + bruteForcelockTime }
  }
  return this.update(updates, cb)
}

module.exports = mongoose.model('FailedLogin', FailedLoginSchema)
