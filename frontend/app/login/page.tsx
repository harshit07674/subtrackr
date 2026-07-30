'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import AuthCard, { AuthLogo, Input, PrimaryBtn, Divider } from '@/components/AuthCard';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [touched, setTouched] = useState({ username: false, password: false });
  const [loading, setLoading] = useState(false);

  const handle = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) =>
    setTouched((p) => ({ ...p, [e.target.name]: true }));

  const isUsernameValid = form.username.trim().length > 0;
  const isPasswordValid = form.password.length > 0;
  const isFormValid = isUsernameValid && isPasswordValid;

  const usernameError = touched.username && !isUsernameValid ? 'Username is required' : undefined;
  const passwordError = touched.password && !isPasswordValid ? 'Password is required' : undefined;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    try {
      await login({
        username: form.username.trim(),
        password: form.password,
      });
      toast.success('Welcome back! 🎉');
      router.push('/dashboard');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard>
      <AuthLogo />

      <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-1">Welcome back</h1>
      <p className="text-xs font-medium text-slate-500 mb-6">Sign in to your account to continue</p>

      <form onSubmit={submit}>
        <Input
          label="Username"
          name="username"
          placeholder="your_username"
          value={form.username}
          onChange={handle}
          onBlur={handleBlur}
          error={usernameError}
          autoComplete="username"
        />

        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={handle}
          onBlur={handleBlur}
          error={passwordError}
          autoComplete="current-password"
        />

        <div className="flex justify-end mb-6">
          <Link
            href="/forgot-password"
            className="text-xs text-indigo-600 hover:text-indigo-700 font-bold transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <PrimaryBtn type="submit" loading={loading} disabled={!isFormValid}>
          Sign in
        </PrimaryBtn>
      </form>

      <Divider />

      <p className="text-center text-xs font-semibold text-slate-500">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors">
          Create one free
        </Link>
      </p>
    </AuthCard>
  );
}
