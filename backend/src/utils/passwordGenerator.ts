/**
 * Generate a secure random password
 */
export function generateSecurePassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  
  let password = '';
  
  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest of the password length with random characters
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password to avoid predictable patterns
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Generate a memorable password using words and numbers
 */
export function generateMemorablePassword(): string {
  const adjectives = [
    'Happy', 'Bright', 'Swift', 'Clever', 'Strong',
    'Gentle', 'Brave', 'Quick', 'Smart', 'Bold'
  ];
  
  const nouns = [
    'Tiger', 'Eagle', 'Ocean', 'Mountain', 'Forest',
    'River', 'Thunder', 'Phoenix', 'Dragon', 'Falcon'
  ];
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 9000) + 1000; // 4-digit number
  const symbol = '!@#$%^&*'.charAt(Math.floor(Math.random() * 8));
  
  return `${adjective}${noun}${number}${symbol}`;
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;
  
  // Check length
  if (password.length >= 8) score++;
  else feedback.push('Password should be at least 8 characters long');
  
  if (password.length >= 12) score++;
  
  // Check for uppercase
  if (/[A-Z]/.test(password)) score++;
  else feedback.push('Include at least one uppercase letter');
  
  // Check for lowercase
  if (/[a-z]/.test(password)) score++;
  else feedback.push('Include at least one lowercase letter');
  
  // Check for numbers
  if (/\d/.test(password)) score++;
  else feedback.push('Include at least one number');
  
  // Check for special characters
  if (/[!@#$%^&*()_+\-=[\]{};':"|,.<>/?]/.test(password)) score++;
  else feedback.push('Include at least one special character');
  
  // Bonus for length > 16
  if (password.length > 16) score++;
  
  return {
    isValid: score >= 4 && password.length >= 8,
    score: Math.min(score, 5), // Max score of 5
    feedback
  };
}