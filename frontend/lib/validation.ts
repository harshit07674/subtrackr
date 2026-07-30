export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export interface PasswordValidationRules {
  minLength: boolean;
  hasDigit: boolean;
  hasUpper: boolean;
  hasSpecial: boolean;
}

export function validatePasswordRules(password: string): PasswordValidationRules {
  return {
    minLength: password.length >= 8,
    hasDigit: /\d/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasSpecial: /[@#$%^&*!_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
}

export function isPasswordValid(password: string): boolean {
  const r = validatePasswordRules(password);
  return r.minLength && r.hasDigit && r.hasUpper && r.hasSpecial;
}
