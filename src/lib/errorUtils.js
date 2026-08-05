/**
 * Clean & User-Friendly Error Message Formatter
 * Removes technical references to Firebase, Firestore, database, codes, etc.
 */

export const sanitizeErrorMessage = (error, defaultMsg = 'An error occurred. Please try again.') => {
  if (!error) return defaultMsg;

  let msg = typeof error === 'string' ? error : (error.message || error.code || '');

  if (!msg) return defaultMsg;

  const lower = msg.toLowerCase();

  // Authentication error mappings
  if (lower.includes('auth/invalid-credential') || lower.includes('auth/wrong-password') || lower.includes('auth/user-not-found')) {
    return 'Invalid email address or password. Please check your credentials and try again.';
  }
  if (lower.includes('auth/email-already-in-use') || lower.includes('email-already-exists')) {
    return 'This email address is already registered. Please log in or use a different email.';
  }
  if (lower.includes('auth/weak-password')) {
    return 'Password is too weak. Please use at least 6 characters.';
  }
  if (lower.includes('auth/invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (lower.includes('auth/network-request-failed')) {
    return 'Network connection error. Please check your internet connection and retry.';
  }
  if (lower.includes('auth/too-many-requests')) {
    return 'Too many unsuccessful attempts. Please wait a few minutes and try again.';
  }

  // Firestore / Permission / Storage mappings
  if (lower.includes('permission-denied') || lower.includes('insufficient permissions')) {
    return 'Access denied. You do not have permission to complete this request.';
  }
  if (lower.includes('quota exceeded') || lower.includes('resource-exhausted')) {
    return 'System is temporarily busy. Please try again in a few moments.';
  }
  if (lower.includes('object-not-found') || lower.includes('not found')) {
    return 'Requested item could not be found.';
  }
  if (lower.includes('storage/unauthorized')) {
    return 'File upload permission denied.';
  }

  // Remove any remaining technical tags like "FirebaseError:", "Firebase:", "auth/", "[firestore]" etc.
  msg = msg.replace(/firebaseerror:?/gi, '')
           .replace(/firebase:?/gi, '')
           .replace(/auth\/[a-z0-9-]+/gi, '')
           .replace(/firestore/gi, '')
           .replace(/database/gi, '')
           .replace(/\[.*?\]/g, '')
           .replace(/\(auth/gi, '')
           .trim();

  // Clean double spaces or trailing punctuation remnants
  msg = msg.replace(/\s+/g, ' ').replace(/^:\s*/, '');

  if (!msg || msg.length < 5 || msg.toLowerCase().includes('error')) {
    return defaultMsg;
  }

  return msg;
};
