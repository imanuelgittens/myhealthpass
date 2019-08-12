this.bcrypt = require('bcryptjs')
const chai = require('chai')
const { expect } = require('chai')
const { assert } = require('chai')
const should = chai.should()

const AccountController = require('../controller/account')

const ApiResponse = require('../models/api-response.js')
const ApiMessages = require('../models/api-messages.js')
const UserProfileModel = require('../models/user-profile.js')
const User = require('../models/user')

let controller = {}
const session = {}

describe('Registration Functionality', function () {
  beforeEach(function (done) {
    const User = require('../models/user')
    controller = new AccountController(User, session)
    done()
  })
  it('should be a function', function () {
    controller.register.should.be.a('function')
  })
  it('should return an error if user exists', function () {
    const testUser = new User({ // assume this test user is already in database
      email: 'hello@example.com',
      firstName: 'John',
      lastName: 'Doe',
      password: 'Hello1234'
    })
    controller.register(testUser, function (err, ApiResponse) {
      if (err) throw err
      ApiResponse.success.should.equal(false)
      ApiResponse.extras.msg.should.equal(ApiMessages.EMAIL_ALREADY_EXISTS)
    })
  })
  it('should register a valid user', function () {
    const testUser = new User({ // assume this test user is already in database
      email: `hello@example${Math.floor(Math.random() * 1000)}.com`, // add random number in email because it should be unique
      firstName: 'John',
      lastName: 'Doe',
      password: 'Hello1234'
    })
    controller.register(testUser, function (err, ApiResponse) {
      if (err) throw err
      ApiResponse.success.should.equal(true)
    })
  })
})

describe('Login Functionality', function () {
  const testUSerData = { // assume this test user is already in database
    email: `hello@example.com`,
    password: 'Hello1234'
  }

  beforeEach(function (done) {
    const User = require('../models/user')
    controller = new AccountController(User, session)
    done()
  })
  it('should be a function', function () {
    controller.login.should.be.a('function')
  })
  it('Should create a user session when successful', function () {
    controller.login(testUSerData.email, testUSerData.pass, function (err, ApiResponse) {
      if (err) throw err
      ApiResponse.success.should.equal(true)
      expect(ApiMessages.extras.userProfileModel).to.equal(controller.getSession().userProfileModel)
    }
    )
  })
  it('should return "Email not found"', function () {
    controller.login('does@not.exist', testUSerData.pass, function (err, ApiResponse) {
      if (err) throw err
      ApiResponse.success.should.equal(false)
      ApiResponse.extras.msg.should.equal(ApiMessages.EMAIL_NOT_FOUND)
    })
  })
  it('should return "Invalid Password"', function () {
    controller.login(testUSerData.email, 'invalidPassword', function (err, ApiResponse) {
      if (err) throw err
      ApiResponse.success.should.equal(false)
      ApiResponse.extras.msg.should.equal(ApiMessages.INVALID_PWD)
    })
  })
})

describe('Logout Functionality', function () {
  it('should destroy a user session', function () {
    controller.logout()
    const sessionTest = controller.getSession().userProfileModel
    expect(sessionTest).to.be.undefined
  })
})
