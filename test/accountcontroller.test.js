const chai = require('chai')
const mongoose = require('mongoose')
const { expect } = require('chai')
const should = chai.should()

const AccountController = require('../controller/account')

const ApiMessages = require('../models/api-messages.js')
const User = require('../models/user')
const FailedLogin = require('../models/failed-logins')
const { bruteForceLockoutTime } = require('../config/compliance.config')
const { maxBFLoginAttempts } = require('../config/compliance.config')
const { permanentLockTime } = require('../config/compliance.config')
const { maxLoginAttempts } = require('../config/compliance.config')
let controller = {}
const session = {}

describe('Registration Functionality', function () {
  before(function (done) {
    controller = new AccountController(User, session)
    mongoose.connection.collections.users.drop().then(function () {
      const testUser = new User({
        email: `hello@example.com`,
        firstName: 'John',
        lastName: 'Doe',
        password: 'Hello1234'
      })
      testUser.save().then(function () {
        done()
      })
    })
  })
  it('should be a function', function () {
    controller.register.should.be.a('function')
  })

  it('should register a valid user', function (done) {
    const testUser = new User({
      email: `hello@newexample${Math.floor(Math.random() * 1000)}.com`, // add random number in email because it should be unique
      firstName: 'John',
      lastName: 'Doe',
      password: 'Hello1234'
    })
    const registerPromise = controller.register(testUser).catch((err) => err)
    registerPromise.then(function (result) {
      result.success.should.equal(true)
      done()
    })
  })

  it('should return an error if user exists', function (done) {
    const testUser = new User({ // this test user is already in database
      email: 'hello@example.com',
      firstName: 'John',
      lastName: 'Doe',
      password: 'Hello1234'
    })

    const registerPromise = controller.register(testUser).catch((err) => err)
    registerPromise.then(function (result) {
      result.success.should.equal(false)
      result.extras.msg.should.equal(ApiMessages.EMAIL_ALREADY_EXISTS)
      done()
    })
  })
  it('should return an error if password does not meet requirements', function (done) {
    const testUser = new User({
      email: `hello@example${Math.floor(Math.random() * 1000)}.com`, // add random number in email because it should be unique
      firstName: 'John',
      lastName: 'Doe',
      password: 'hello'
    })
    const registerPromise = controller.register(testUser).catch((err) => err)
    registerPromise.then(function (result) {
      result.success.should.equal(false)
      result.extras.msg.should.equal(ApiMessages.INVALID_PWD)
      done()
    })
  })
  it('should return an error if email is not valid', function (done) {
    const testUser = new User({
      email: 'hello',
      firstName: 'John',
      lastName: 'Doe',
      password: 'helloH1234'
    })
    const registerPromise = controller.register(testUser).catch((err) => err)
    registerPromise.then(function (result) {
      result.success.should.equal(false)
      result.extras.msg.should.equal(ApiMessages.INVALID_EMAIL)
      done()
    })
  })
})

describe('Brute Force Functionality', function () {
  before(function (done) {
    controller = new AccountController(User, session)
    mongoose.connection.collections.failedlogins.drop().then(function () {
      const failedLogin = new FailedLogin({
        reqSignature: 'bruteforcedemo',
        loginAttempts: maxBFLoginAttempts,
        lockUntil: Date.now() + bruteForceLockoutTime
      })
      failedLogin.save().then(function () {
        done()
      })
    })
  })
  it('should be a function', function () {
    controller.checkBruteForce.should.be.a('function')
  })
  it('should register a valid failedLogin signature', function (done) {
    const reguestSignature = `demorequestSignature${Math.floor(Math.random() * 1000)}.com`
    const failedLoginPromise = controller.checkBruteForce(reguestSignature).catch((err) => err)
    failedLoginPromise.then(function (result) {
      result.should.equal(false)
      done()
    })
  })
  it('should return true if brute force detected', function (done) {
    const reguestSignature = 'bruteforcedemo'
    const failedLoginPromise = controller.checkBruteForce(reguestSignature).catch((err) => err)
    failedLoginPromise.then(function (result) {
      result.should.equal(true)
      done()
    })
  })
  it('should return false if brute force not detected', function (done) {
    const reguestSignature = 'demorequestSignature'
    const failedLoginPromise = controller.checkBruteForce(reguestSignature).catch((err) => err)
    failedLoginPromise.then(function (result) {
      result.should.equal(false)
      done()
    })
  })
})

describe('Login Functionality', function () {
  before(function (done) {
    controller = new AccountController(User, session)
    mongoose.connection.collections.users.drop().then(function () {
      const users = []
      const testUser = new User({
        email: `hello@example.com`,
        firstName: 'John',
        lastName: 'Doe',
        password: 'Hello1234'
      })
      const testLockedUser = new User({
        email: `locked@example.com`,
        firstName: 'John',
        lastName: 'Doe',
        password: 'Hello1234',
        loginAttempts: maxLoginAttempts,
        lockUntil: Date.now() + permanentLockTime
      })
      users.push(testUser)
      users.push(testLockedUser)
      User.create(users).then(function () {
        done()
      })
    })
  })
  it('should be a function', function () {
    controller.login.should.be.a('function')
  })
  it('should return an error if bruteforce detected', function (done) {
    const email = 'hello@example.com'
    const password = 'Hello1234'
    const signature = 'bruteforcedemo'

    const loginPromise = controller.login(email, password, signature).catch((err) => err)
    loginPromise.then(function (result) {
      result.success.should.equal(false)
      result.extras.msg.should.equal(ApiMessages.LOGIN_PREVENTED)
      done()
    })
  })
  it('should return an error if user not found', function (done) {
    const email = 'not@found.com'
    const password = 'Hello1234'
    const signature = 'demorequestSignature'

    const loginPromise = controller.login(email, password, signature).catch((err) => err)
    loginPromise.then(function (result) {
      result.success.should.equal(false)
      result.extras.msg.should.equal(ApiMessages.EMAIL_NOT_FOUND)
      done()
    })
  })
  it('should return an error if password incorrect', function (done) {
    const email = 'hello@example.com'
    const password = 'incorrectPassword'
    const signature = 'demorequestSignature'

    const loginPromise = controller.login(email, password, signature).catch((err) => err)
    loginPromise.then(function (result) {
      result.success.should.equal(false)
      result.extras.msg.should.equal(ApiMessages.INVALID_PWD)
      done()
    })
  })

  it('should return an error if valid user account locked', function (done) {
    const email = 'locked@example.com'
    const password = 'Hello1234'
    const signature = 'demorequestSignature'

    const loginPromise = controller.login(email, password, signature).catch((err) => err)
    loginPromise.then(function (result) {
      result.success.should.equal(false)
      result.extras.msg.should.equal(ApiMessages.ACCOUNT_LOCKED)
      done()
    })
  })
  it('should login a valid user', function (done) {
    const email = 'hello@example.com'
    const password = 'Hello1234'
    const signature = 'demorequestSignature'

    const loginPromise = controller.login(email, password, signature).catch((err) => err)
    loginPromise.then(function (result) {
      result.success.should.equal(true)
      done()
    })
  })
})

describe('Logout Functionality', function () {
  before(function (done) {
    controller = new AccountController(User, session)
    done()
  })
  it('should destroy a user session', function () {
    controller.logout()
    const sessionTest = controller.getSession().userProfileModel
    expect(sessionTest).to.be.undefined
  })
})
