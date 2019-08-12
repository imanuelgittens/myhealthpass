const complianceConfig = {
  minPasswordLength: 8,
  passwordComplexity: '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])', // Password string must contain at least 1 lowercase alphabetical character, 1 uppercase alphabetical character, and at least 1 numeric character
  sessionLength: 900, // 900 seconds or 15 minutes
  maxLoginAttempts: 3,
  maxBFLoginAttempts: 5, // 5 for testing
  permanentLockTime: 99 * 60 * 60 * 1000, // 99 years
  bruteForcelockTime: 2 * 60 * 1000, // 2 minutes lockdown of account for testing
  lockoutCriteria: {
    time: 600, // 600 seconds or 10 minutes
    failedLogins: 13
  }
}

module.exports = complianceConfig
