const complianceConfig = {
  minPasswordLength: 8,
  passwordComplexity: '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])', // Password string must contain at least 1 lowercase alphabetical character, 1 uppercase alphabetical character, and at least 1 numeric character
  sessionLength: 900, // 900 seconds or 15 minutes
  lockoutCriteria: {
    time: 600, // 600 seconds or 10 minutes
    failedLogins: 13
  }
}

module.exports = complianceConfig
