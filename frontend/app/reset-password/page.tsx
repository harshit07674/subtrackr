'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { KeyRound, CheckCircle, ArrowRight } from 'lucide-react';
import { authApi } from '@/lib/api';
import AuthCard, { AuthLogo, Input, PrimaryBtn, PasswordChecklist } from '@/components/AuthCard';
import { isPasswordValid } from '@/lib/validation';

function ResetPasswordInner() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const [form, setForm] = useState({ newPassword: '', confirm: '' });
  const [touched, setTouched] = useState({ newPassword: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handle = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) =>
    setTouched((p) => ({ ...p, [e.target.name]: true }));

  const isPwdValid = isPasswordValid(form.newPassword);
  const isConfirmValid = form.confirm.length > 0 && form.confirm === form.newPassword;
  const isFormValid = isPwdValid && isConfirmValid && Boolean(token);

  const confirmError = touched.confirm && form.confirm && !isConfirmValid ? 'Passwords do not match' : undefined;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    try {
      await authApi.resetPassword({ token, newPassword: form.newPassword });
      setDone(true);
      toast.success('Password reset successfully!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard>
      <AuthLogo />

      {done ? (
        <div className="text-center py-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-5 text-emerald-600 shadow-sm">
            <CheckCircle size={22} strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-1">Password updated!</h1>
          <p className="text-xs font-medium text-slate-500 mb-7">
            Your password has been reset. You can now sign in with your new password.
          </p>
          <Link
            href="/login"
            className="btn-frost-primary w-full flex items-center justify-center gap-2 text-xs font-bold"
          >
            Go to sign in <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <>
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-5 text-indigo-600 shadow-sm">
            <KeyRound size={18} strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-1">Reset password</h1>
          <p className="text-xs font-medium text-slate-500 mb-6">Choose a strong new password for your account.</p>

          <form onSubmit={submit}>
            <Input
              label="New password"
              name="newPassword"
              type="password"
              placeholder="••••••••"
              value={form.newPassword}
              onChange={handle}
              onBlur={handleBlur}
              autoComplete="new-password"
            />

            {form.newPassword.length > 0 && <PasswordChecklist password={form.newPassword} />}

            <Input
              label="Confirm new password"
              name="confirm"
              type="password"
              placeholder="Repeat password"
              value={form.confirm}
              onChange={handle}
              onBlur={handleBlur}
              error={confirmError}
              autoComplete="new-password"
            />

            <div className="mt-4">
              <PrimaryBtn type="submit" loading={loading} disabled={!isFormValid}>
                Reset password
              </PrimaryBtn>
            </div>
          </form>
        </>
      )}
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordInner />
    </Suspense>
  );
}
