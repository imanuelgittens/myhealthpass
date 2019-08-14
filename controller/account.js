const AccountController = function (userModel, session) {
  this.bcrypt = require('bcryptjs')
  this.ApiResponse = require('../models/api-response.js')
  this.ApiMessages = require('../models/api-messages.js')
  this.UserProfileModel = require('../models/user-profile.js')
  this.userModel = userModel
  this.compliance = require('../config/compliance.config')
  this.validator = require('validator')
  this.failedLoginModel = require('../models/failed-logins')
  this.session = session
}

AccountController.prototype.getSession = function () {
  return this.session
}
AccountController.prototype.setSession = function (session) {
  this.session = session
}

AccountController.prototype.checkBruteForce = async function (requestSignature) {
  const me = this
  try {
    const signature = await me.failedLoginModel.findOne({ reqSignature: requestSignature })
    if (signature) {
      if (signature.isLocked) {
        return true
      } else {
        try {
          signature.incLoginAttempts()
          return false
        } catch (err) {
          return new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.DB_ERROR } })
        }
      }
    } else {
      try {
        const failedLogin = new me.failedLoginModel({
          reqSignature: requestSignature,
          loginAttempts: 1
        })
        await failedLogin.save()
        return new me.ApiResponse({
          success: true,
          extras: {
            failedLogin: failedLogin
          }
        })
      } catch (err) {
        return new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.DB_ERROR } })
      }
    }
  } catch (err) {
    return new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.DB_ERROR } })
  }
}

AccountController.prototype.login = async function (email, password, requestSignature) {
  const me = this

  try {
    const checkBruteForce = await me.checkBruteForce(requestSignature)
    if (checkBruteForce === true) {
      return new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.LOGIN_PREVENTED } })
    } else {
      try {
        const user = await me.userModel.findOne({ email: email })
        if (user) {
          try {
            const isMatch = await user.comparePassword(password)
            if (isMatch) {
              const userProfileModel = new me.UserProfileModel({
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
              })
              me.session.userProfileModel = userProfileModel
              me.session.expires = Date.now() + me.compliance.sessionInactivityLength
              return new me.ApiResponse({
                success: true,
                extras: {
                  userProfileModel: userProfileModel
                }
              })
            } else {
              return new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.INVALID_PWD } })
            }
          } catch (err) {
            return new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.DB_ERROR } })
          }
        } else {
          return new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.EMAIL_NOT_FOUND } })
        }
      } catch (err) {
        return new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.DB_ERROR } })
      }
    }
  } catch (err) {
    return new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.DB_ERROR } })
  }
}

AccountController.prototype.validateEmail = function (user) {
  const me = this
  return me.validator.isEmail(user.email)
}

AccountController.prototype.validatePassword = function (user) {
  const me = this
  const requiredComplexity = new RegExp(me.compliance.passwordComplexity)
  return me.validator.isLength(user.password, { min: 8 }) && requiredComplexity.test(user.password)
}

AccountController.prototype.logout = function () {
  if (this.session.userProfileModel) delete this.session.userProfileModel
  if (this.session.expires) delete this.session.expires
}

AccountController.prototype.register = async function (newUser) {
  var me = this

  try {
    const userExists = await me.userModel.findOne({ email: newUser.email })
    if (userExists) {
      return new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.EMAIL_ALREADY_EXISTS } })
    } else {
      // validate email
      if (!me.validateEmail(newUser)) {
        return new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.INVALID_EMAIL } })
      }

      // validate password
      if (!me.validatePassword(newUser)) {
        return new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.INVALID_PWD } })
      }
      try {
        const user = await newUser.save()
        const userProfileModel = new me.UserProfileModel({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        })
        return new me.ApiResponse({
          success: true,
          extras: {
            userProfileModel: userProfileModel
          }
        })
      } catch (err) {
        return new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.DB_ERROR } })
      }
    }
  } catch (err) {
    return new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.DB_ERROR } })
  }
}

module.exports = AccountController
