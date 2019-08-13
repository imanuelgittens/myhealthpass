const complianceConfig = {
  minPasswordLength: 8,
  passwordComplexity: '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])', // Password string must contain at least 1 lowercase alphabetical character, 1 uppercase alphabetical character, and at least 1 numeric character
  sessionInactivityLength: 15 * 60 * 1000, // Sessions will expire after 15 mins
  maxLoginAttempts: 3, // maximum number of failed login attempts for valid user
  maxBFLoginAttempts: 5, // maximum number of failed login attempts for any user using the same request signature
  permanentLockTime: 99 * 60 * 60 * 1000, // lock user account for 99 years
  bruteForceLockoutTime: 2 * 60 * 1000 // prevent login for 2 minutes if brute force detected
}

module.exports = complianceConfig
