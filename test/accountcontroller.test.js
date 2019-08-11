this.bcrypt = require('bcryptjs')
const chai = require('chai')
const { expect } = require('chai')

const should = chai.should()

const AccountController = require('../controller/account')

const ApiResponse = require('../models/api-response.js')
const ApiMessages = require('../models/api-messages.js')
const UserProfileModel = require('../models/user-profile.js')

let controller = {}
const session = {}

describe('Account Controller', function () {
  beforeEach(function (done) {
    const User = require('../models/user')
    controller = new AccountController(User, session)
    done()
  })
  it('should have a register protype function', function () {
    controller.register.should.be.a('function')
  })
})
