/**
  * @desc this class holds the functions for the Authorization library
  * which are - checkBruteForce(), login(), register(), logout(), validateEmail(), validatePassword()
*/

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

/**
  * @desc gets current session
  * @return object - session
*/

AccountController.prototype.getSession = function () {
  return this.session
}

/**
  * @desc sets current session
*/
AccountController.prototype.setSession = function (session) {
  this.session = session
}

/**
  * @desc checks whether the login qualifies as a brute force attempt
  * @param string requestSignature - a combination of the user agent, client IP address, and
browser cookies
  * @return bool - true or false
*/

AccountController.prototype.checkBruteForce = async function (requestSignature) {
  const me = this
  try {
    // check whether signature exists in db
    const signature = await me.failedLoginModel.findOne({ reqSignature: requestSignature })
    if (signature) {
      // is signature is locked that means it is a brute force attempt
      if (signature.isLocked) {
        return true
      } else {
        // if it is not a brute force attempt, we increment login attempts
        try {
          signature.incLoginAttempts()
          return false
        } catch (err) {
          return new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.DB_ERROR } })
        }
      }
    } else {
      // if signature is not in the db we create it
      try {
        const failedLogin = new me.failedLoginModel({
          reqSignature: requestSignature,
          loginAttempts: 1
        })
        await failedLogin.save()
        // not a brute force attempt so return false
        return false
      } catch (err) {
        return new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.DB_ERROR } })
      }
    }
  } catch (err) {
    return new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.DB_ERROR } })
  }
}

/**
  * @desc validates user and ensures that brute force is not being attempted during login
  * @param string email
  * @param string password
  * @param string requestSignature - a combination of the user agent, client IP address, and
browser cookies
  * @return object - apiResponse
*/

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
              // reset any failed logins for this request signature
              try {
                const previousfailedLogins = await me.failedLoginModel.findOne({ reqSignature: requestSignature })
                if (previousfailedLogins) {
                  await previousfailedLogins.resetLoginAttempts()
                }
                // check if account is locked
                if (user.isLocked) {
                  return new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.ACCOUNT_LOCKED } })
                } else {
                  // reset any previous failed logins
                  try {
                    await user.resetLoginAttempts()
                    // populate session
                    const userProfileModel = new me.UserProfileModel({
                      email: user.email,
                      firstName: user.firstName,
                      lastName: user.lastName
                    })
                    me.session.userProfileModel = userProfileModel
                    me.session.expires = Date.now() + me.compliance.sessionInactivityLength
                    // return api response
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
            } else {
              return new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.INVALID_PWD } })
            }
          } catch (err) {
            return new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.DB_ERROR } })
          }
        } else {
          // user not found
          return new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.EMAIL_NOT_FOUND } })
        }
      } catch (err) {
        return new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.DB_ERROR } })
      }
    }
  } catch (err) {
    // data base error when checking brute force
    return new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.DB_ERROR } })
  }
}

/**
  * @desc validates user email
  * @param object user
  * @return bool - true or false
*/

AccountController.prototype.validateEmail = function (user) {
  const me = this
  return me.validator.isEmail(user.email)
}

/**
  * @desc validates user password
  * @param object user
  * @return bool - true or false
*/

AccountController.prototype.validatePassword = function (user) {
  const me = this
  const requiredComplexity = new RegExp(me.compliance.passwordComplexity)
  return me.validator.isLength(user.password, { min: 8 }) && requiredComplexity.test(user.password)
}

/**
  * @desc logs user out of application by destorying session
*/

AccountController.prototype.logout = function () {
  if (this.session.userProfileModel) delete this.session.userProfileModel
  if (this.session.expires) delete this.session.expires
}

/**
  * @desc registers valid user
  * @param object user
  * @return object - apiResponse
*/

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
        // add user to db
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
