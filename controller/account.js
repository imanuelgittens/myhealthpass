// const { maxBFLoginAttempts } = require('../config/compliance.config')
// const { bruteForcelockTime } = require('../config/compliance.config')

const AccountController = function (userModel, session) {
  this.bcrypt = require('bcryptjs')
  //  this.uuid = require('node-uuid')
  this.ApiResponse = require('../models/api-response.js')
  this.ApiMessages = require('../models/api-messages.js')
  this.UserProfileModel = require('../models/user-profile.js')
  this.userModel = userModel
  this.failedLoginModel = require('../models/failed-logins')
  this.session = session
  //   this.mailer = mailer
}

AccountController.prototype.getSession = function () {
  return this.session
}
AccountController.prototype.setSession = function (session) {
  this.session = session
}

// AccountController.prototype.hashPassword = function (password, salt, callback) {
//   this.bcrypt.hashSync(password, salt, callback)
// }

AccountController.prototype.checkBruteForce = function (requestSignature, callback) {
  const me = this
  me.failedLoginModel.findOne({ reqSignature: requestSignature }, function (err, failedLogin) {
    if (err) {
      return callback(err, new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.DB_ERROR } }))
    }
    if (failedLogin) {
      if (failedLogin.isLocked) {
        return callback(err, new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.DB_ERROR } }))
      }
      failedLogin.incLoginAttempts(function (err) {
        if (err) throw err
      })
      return callback(err, new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.DB_ERROR } }))
    } else {
      const failedLogin = new me.failedLoginModel({
        reqSignature: requestSignature,
        loginAttempts: 1
      })
      failedLogin.save(function (err) {
        if (err) {
          return callback(err, new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.DB_ERROR } }))
        } else {
          return callback(err, new me.ApiResponse({
            success: true
          }))
        }
      })
    }
  })

  // me.userModel.findOne({ email: newUser.email }, function (err, user) {
  //   if (err) {
  //     return callback(err, new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.DB_ERROR } }))
  //   }
  //   if (user) {
  //     return callback(err, new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.EMAIL_ALREADY_EXISTS } }))
  //   } else {
  //     newUser.save(function (err, user) {
  //       if (err) {
  //         return callback(err, new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.DB_ERROR } }))
  //       } else {
  //         var userProfileModel = new me.UserProfileModel({
  //           email: user.email,
  //           firstName: user.firstName,
  //           lastName: user.lastName
  //         })
  //         return callback(err, new me.ApiResponse({
  //           success: true,
  //           extras: {
  //             userProfileModel: userProfileModel
  //           }
  //         }))
  //       }

  // console.log(me)
  // const check = await me.failedLoginModel.findOne({ reqSignature: requestSignature })
  // return check.isLocked
  // me.failedLoginModel.findOne({ reqSignature: requestSignature }, function (err, failedLogin) {
  //   if (err) {
  //     throw err
  //     // return callback(err, new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.DB_ERROR } }))
  //   }
  //   if (failedLogin) {
  //     // console.log('hello')
  //     if (failedLogin.isLocked) {
  //       // console.log('hi')
  //       return true
  //     }
  //     failedLogin.incLoginAttempts(function (err) {
  //       if (err) throw err
  //     })
  //     return false
  //   } else {
  //     const failedLogin = new me.failedLoginModel({
  //       reqSignature: requestSignature,
  //       loginAttempts: 1
  //     })
  //     failedLogin.save(function (err) {
  //       if (err) {
  //         throw err
  //       }
  //     })
  //   }
  // })
  // console.log(check)
}

AccountController.prototype.login = async function (email, password, requestSignature, callback) {
  const me = this
  me.userModel.findOne({ email: email }, function (err, user) {
    if (err) {
      return callback(err, new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.DB_ERROR } }))
    }
    if (user) {
      if (user.isLocked) {
        return callback(err, new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.DB_ERROR } }))
      }
      user.comparePassword(password, function (err, isMatch) {
        if (err) throw err
        if (isMatch) {
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
          me.checkBruteForce(requestSignature, function (err, apiResponse) {
            if (err) throw err
            console.log(apiResponse)
          })
          // check brute force
          // const check = async function () {
          //   const d = await me.checkBruteForce(requestSignature)
          //   return d
          // }
          // console.log(check)
          // if (me.checkBruteForce(requestSignature)) {
          //   return callback(err, new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.DB_ERROR } }))
          // }
          // not brute force but regular failed login
          user.incLoginAttempts(function (err) {
            if (err) throw err
          })
          return callback(err, new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.INVALID_PWD } }))
        }
      })
    } else {
      me.checkBruteForce(requestSignature, function (err, apiResponse) {
        if (err) throw err
        console.log(apiResponse)
      })

      // const check = async function () {
      //   const d = await me.checkBruteForce(requestSignature)
      //   return d
      // }
      // console.log(check)
      // check brute force

      // const bfcheck = me.checkBruteForce(requestSignature)
      // console.log(bfcheck)
      // if (me.checkBruteForce(requestSignature)) {
      //   return callback(err, new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.DB_ERROR } }))
      // } else {
      //   return callback(err, new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.EMAIL_NOT_FOUND } }))
      // }
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
      newUser.save(function (err, user) {
        if (err) {
          return callback(err, new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.DB_ERROR } }))
        } else {
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
        }
        // if (numberAffected === 1) {
        //   var userProfileModel = new me.UserProfileModel({
        //     email: user.email,
        //     firstName: user.firstName,
        //     lastName: user.lastName
        //   })
        //   return callback(err, new me.ApiResponse({
        //     success: true,
        //     extras: {
        //       userProfileModel: userProfileModel
        //     }
        //   }))
        // } else {
        //   return callback(err, new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.COULD_NOT_CREATE_USER } }))
        // }
      })
    }
  })
}

module.exports = AccountController
