/**
 * App Configuration Constants
 */

export const API_BASE_URL = __DEV__
  ? 'http://10.0.2.2:8080/api' // Android emulator special IP to access host machine
  : 'https://api.gowaay.com/api'; // Production

export const IMG_BASE_URL = __DEV__
  ? 'http://10.0.2.2:8080'
  : 'https://images.gowaay.com'; // Production - Cloudflare R2 bucket

// For testing on physical device, replace localhost with your computer's IP:
// Example: 'http://192.168.0.105:8080/api'
// To find your IP:
// - Mac: System Preferences → Network
// - Windows: ipconfig in Command Prompt
// - Linux: ifconfig or ip addr

export default {
  API_BASE_URL,
  IMG_BASE_URL,
};