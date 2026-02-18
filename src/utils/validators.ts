/**
 * Client-side validation utilities for GoWaay mobile app.
 * These provide instant feedback before data reaches the server.
 */

// BD phone: 01X-XXXXXXXX with optional +880 prefix
const BD_PHONE_REGEX = /^(\+?880)?0?1[3-9]\d{8}$/;

// Standard email regex (RFC 5322 simplified)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Validate a Bangladeshi phone number.
 * Accepts: 01XXXXXXXXX, +8801XXXXXXXXX, 8801XXXXXXXXX
 */
export function isValidBDPhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return BD_PHONE_REGEX.test(cleaned);
}

/**
 * Returns a user-friendly error message for invalid BD phone, or null if valid.
 */
export function validatePhone(phone: string): string | null {
  if (!phone || !phone.trim()) {
    return 'Phone number is required';
  }
  if (!isValidBDPhone(phone)) {
    return 'Enter a valid BD number (e.g. 01712345678)';
  }
  return null;
}

/**
 * Validate email format.
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Returns a user-friendly error message for invalid email, or null if valid.
 */
export function validateEmail(email: string): string | null {
  if (!email || !email.trim()) {
    return 'Email is required';
  }
  if (!isValidEmail(email)) {
    return 'Enter a valid email address';
  }
  return null;
}

/**
 * Validate a price/amount is a positive number.
 * Returns error message or null if valid.
 */
export function validatePositiveAmount(value: string, fieldName: string = 'Amount', min: number = 0): string | null {
  if (!value || !value.trim()) {
    return `${fieldName} is required`;
  }
  const num = parseFloat(value);
  if (isNaN(num)) {
    return `${fieldName} must be a valid number`;
  }
  if (num < min) {
    return `${fieldName} must be at least ${min}`;
  }
  return null;
}
