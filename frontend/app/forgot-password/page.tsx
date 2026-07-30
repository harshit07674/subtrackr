'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Send, CheckCircle } from 'lucide-react';
import { authApi } from '@/lib/api';
import AuthCard, { AuthLogo, Input, PrimaryBtn } from '@/components/AuthCard';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email');
    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setSent(true);
      toast.success('Reset link sent — check your inbox!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard>
      <AuthLogo />

      {sent ? (
        <div className="text-center py-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-5 text-emerald-600 shadow-sm">
            <CheckCircle size={22} strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-1">Email sent!</h1>
          <p className="text-xs font-medium text-slate-500 mb-7">
            If <span className="text-indigo-600 font-bold">{email}</span> is registered,
            you&apos;ll receive a reset link shortly. It expires in{' '}
            <span className="text-amber-600 font-bold">10 minutes</span>.
          </p>
          <Link
            href="/login"
            className="w-full block text-center py-3 rounded-2xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-1">Forgot password?</h1>
          <p className="text-xs font-medium text-slate-500 mb-6">
            Enter your email and we&apos;ll send you a secure reset link.
          </p>

          <form onSubmit={submit}>
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <div className="mt-2">
              <PrimaryBtn type="submit" loading={loading}>
                <Send size={13} /> Send reset link
              </PrimaryBtn>
            </div>
          </form>

          <p className="text-center mt-5 text-xs font-semibold text-slate-500">
            Remember it?{' '}
            <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors">Sign in</Link>
          </p>
        </>
      )}
    </AuthCard>
  );
}
