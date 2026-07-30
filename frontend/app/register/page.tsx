'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import AuthCard, { AuthLogo, Input, PrimaryBtn, Divider, PasswordChecklist } from '@/components/AuthCard';
import { validateEmail, isPasswordValid } from '@/lib/validation';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [touched, setTouched] = useState({
    username: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  const [loading, setLoading] = useState(false);

  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((p) => ({ ...p, [name]: true }));
  };

  // Real-time validation checks
  const isUsernameValid = form.username.trim().length >= 2;
  const isEmailValid = validateEmail(form.email);
  const isPwdValid = isPasswordValid(form.password);
  const isConfirmValid = form.confirmPassword.length > 0 && form.confirmPassword === form.password;

  const isFormValid = isUsernameValid && isEmailValid && isPwdValid && isConfirmValid;

  // Real-time error messages
  const usernameError = touched.username && !isUsernameValid ? 'Username must be at least 2 characters' : undefined;
  const emailError = touched.email && form.email && !isEmailValid ? 'Please enter a valid email address' : undefined;
  const confirmError =
    touched.confirmPassword && form.confirmPassword && !isConfirmValid ? 'Passwords do not match' : undefined;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    try {
      await authApi.register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      toast.success('Account created! Check your email for the OTP 📧');
      router.push(`/verify-email?email=${encodeURIComponent(form.email.trim())}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard>
      <AuthLogo />

      <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-1">Create account</h1>
      <p className="text-xs font-medium text-slate-500 mb-6">Start tracking subscriptions for free</p>

      <form onSubmit={submit}>
        <Input
          label="Username"
          name="username"
          placeholder="choose_a_username"
          value={form.username}
          onChange={handle}
          onBlur={handleBlur}
          error={usernameError}
          autoComplete="username"
        />

        <Input
          label="Email address"
          name="email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={handle}
          onBlur={handleBlur}
          error={emailError}
          autoComplete="email"
        />

        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={handle}
          onBlur={handleBlur}
          autoComplete="new-password"
        />

        {/* Real-time Password Requirements Checklist */}
        {form.password.length > 0 && <PasswordChecklist password={form.password} />}

        <Input
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          placeholder="Repeat password"
          value={form.confirmPassword}
          onChange={handle}
          onBlur={handleBlur}
          error={confirmError}
          autoComplete="new-password"
        />

        <div className="mt-6">
          <PrimaryBtn type="submit" loading={loading} disabled={!isFormValid}>
            Create account
          </PrimaryBtn>
        </div>
      </form>

      <Divider />

      <p className="text-center text-xs font-semibold text-slate-500">
        Already have an account?{' '}
        <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
