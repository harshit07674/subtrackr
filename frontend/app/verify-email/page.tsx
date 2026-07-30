'use client';

import { useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Mail } from 'lucide-react';
import { authApi } from '@/lib/api';
import AuthCard, { PrimaryBtn } from '@/components/AuthCard';

function VerifyEmailInner() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get('email') ?? '';

  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0)
      inputs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      inputs.current[5]?.focus();
    }
  };

  const submit = async () => {
    const otp = digits.join('');
    if (otp.length < 6) return toast.error('Enter all 6 digits');
    if (!email) return toast.error('Email not found — go back and register');
    setLoading(true);
    try {
      await authApi.verifyEmail({ email, otp });
      toast.success('Email verified! You can now log in.');
      router.push('/login');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard>
      <div className="text-center">
        {/* Icon */}
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-5 text-indigo-600 shadow-sm">
          <Mail size={22} strokeWidth={2.2} />
        </div>

        <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-1">Check your email</h1>
        <p className="text-xs font-medium text-slate-500 mb-8">
          We sent a 6-digit code to{' '}
          <span className="text-indigo-600 font-bold">{email || 'your email'}</span>
        </p>

        <div className="flex gap-2.5 justify-center mb-7" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              className="otp-box bg-slate-50/80 border-slate-200 text-slate-900 font-black focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              inputMode="numeric"
            />
          ))}
        </div>

        <PrimaryBtn onClick={submit} loading={loading}>Verify email</PrimaryBtn>

        <p className="mt-6 text-center text-xs font-semibold text-slate-500">
          Wrong email?{' '}
          <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors">Go back</Link>
        </p>
      </div>
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return <Suspense><VerifyEmailInner /></Suspense>;
}
