import crypto from 'crypto'

/**
 * Generate a random 6-digit PIN
 * @returns {string} 6-digit PIN
 */
export const generatePin = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Hash PIN using SHA256
 * @param {string} pin - Plain text PIN
 * @returns {string} Hashed PIN
 */
export const hashPin = (pin) => {
  return crypto.createHash('sha256').update(pin).digest('hex')
}

/**
 * Verify PIN against hash
 * @param {string} pin - Plain text PIN to verify
 * @param {string} hash - Stored hash to compare against
 * @returns {boolean} True if PIN matches
 */
export const verifyPin = (pin, hash) => {
  const pinHash = hashPin(pin)
  return pinHash === hash
}

/**
 * Check if PIN has expired (24 hours)
 * @param {Date} sentAt - When PIN was sent
 * @returns {boolean} True if expired
 */
export const isPinExpired = (sentAt) => {
  const expiryHours = 24
  const expiryTime = new Date(sentAt).getTime() + expiryHours * 60 * 60 * 1000
  return Date.now() > expiryTime
}

export default {
  generatePin,
  hashPin,
  verifyPin,
  isPinExpired,
}
