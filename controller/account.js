
const AccountController = function (userModel, session) {
  this.bcrypt = require('bcryptjs')
  //  this.uuid = require('node-uuid')
  this.ApiResponse = require('../models/api-response.js')
  this.ApiMessages = require('../models/api-messages.js')
  this.UserProfileModel = require('../models/user-profile.js')
  this.userModel = userModel
  this.session = session
  //   this.mailer = mailer
}

AccountController.prototype.getSession = function () {
  return this.session
}
AccountController.prototype.setSession = function (session) {
  this.session = session
}

AccountController.prototype.hashPassword = function (password, salt, callback) {
  this.bcrypt.hashSync(password, salt, callback)
}

AccountController.prototype.login = function (email, password, callback) {
  const me = this
  me.userModel.findOne({ email: email }, function (err, user) {
    if (err) {
      return callback(err, new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.DB_ERROR } }))
    }
    if (user) {
      me.hashPassword(password, 10, function (err, passwordHash) {
        if (this.bcrypt.compareSync(passwordHash, user.passwordHash)) {
          const userProfileModel = new me.UserProfileModel({
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
          })
          me.session.userProfileModel = userProfileModel
          return callback(err, new me.ApiResponse({
            success: true,
            extras: {
              userProfileModel: userProfileModel
            }
          }))
        } else {
          return callback(err, new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.INVALID_PWD } }))
        }
      })
    } else {
      return callback(err, new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.EMAIL_NOT_FOUND } }))
    }
  })
}

AccountController.prototype.logout = function () {
  if (this.session.userProfileModel) delete this.session.userProfileModel
}

AccountController.prototype.register = function (newUser, callback) {
  var me = this
  me.userModel.findOne({ email: newUser.email }, function (err, user) {
    if (err) {
      return callback(err, new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.DB_ERROR } }))
    }
    if (user) {
      return callback(err, new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.EMAIL_ALREADY_EXISTS } }))
    } else {
      newUser.save(function (err, user, numberAffected) {
        if (err) {
          return callback(err, new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.DB_ERROR } }))
        }
        if (numberAffected === 1) {
          var userProfileModel = new me.UserProfileModel({
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
          })
          return callback(err, new me.ApiResponse({
            success: true,
            extras: {
              userProfileModel: userProfileModel
            }
          }))
        } else {
          return callback(err, new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.COULD_NOT_CREATE_USER } }))
        }
      })
    }
  })
}

module.exports = AccountController
