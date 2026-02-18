/**
 * Centralized human-readable error messages.
 * Keeps user-facing copy consistent across the app.
 */

export function getErrorMessage(error: any): string {
  // No response at all → network issue
  if (!error?.response && !error?.success) {
    if (error?.message?.toLowerCase().includes('network')) {
      return 'Network error. Please check your internet connection.';
    }
    if (error?.message?.toLowerCase().includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
  }

  // Server returned an HTTP error
  const status = error?.response?.status;
  const serverMsg =
    error?.response?.data?.message || error?.message || error?.error;

  switch (status) {
    case 401:
      return 'Session expired. Please log in again.';
    case 403:
      return "You don't have permission for this action.";
    case 404:
      return 'The requested data was not found.';
    case 422:
      return serverMsg || 'Invalid data. Please check your input.';
    case 429:
      return 'Too many requests. Please wait a moment.';
    case 500:
    case 502:
    case 503:
      return 'Server error. Please try again later.';
    default:
      break;
  }

  // Fall back to whatever the server or error said
  if (typeof serverMsg === 'string' && serverMsg.length < 120) {
    return serverMsg;
  }

  return 'Something went wrong. Please try again.';
}
