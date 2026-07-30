'use client';

import Link from 'next/link';
import { ReactNode, useState } from 'react';
import { Eye, EyeOff, Layers, Loader2, Check, X } from 'lucide-react';
import { validatePasswordRules } from '@/lib/validation';

interface AuthCardProps {
  children: ReactNode;
}

export function AuthLogo() {
  return (
    <div className="flex items-center gap-3 mb-8 justify-center">
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30 flex-shrink-0 animate-float">
        <Layers size={20} strokeWidth={2.2} />
      </div>
      <span className="text-2xl font-bold tracking-tight text-slate-900">
        SubTrackr<span className="text-indigo-600">.</span>
      </span>
    </div>
  );
}

export default function AuthCard({ children }: AuthCardProps) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.18) 0%, transparent 60%), radial-gradient(circle at 100% 100%, rgba(217, 249, 157, 0.12) 0%, transparent 50%), #f8fafc',
      }}
    >
      {/* Decorative ambient background glows */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-12 right-12 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-[440px] bg-white/85 backdrop-blur-2xl border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-slate-900/10 animate-frost-pop relative z-10">
        {children}
      </div>
    </div>
  );
}

/* ── Input ──────────────────────────────────────────────── */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, type, error, className: _cls, ...props }: InputProps) {
  const [showPwd, setShowPwd] = useState(false);
  const isPassword = type === 'password';
  const resolvedType = isPassword ? (showPwd ? 'text' : 'password') : type;

  return (
    <div className="mb-4">
      <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">{label}</label>
      <div className="relative">
        <input
          {...props}
          type={resolvedType}
          className={`input-field text-slate-900 placeholder:text-slate-400 focus:bg-white transition-all ${
            error
              ? 'bg-rose-50/30 border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
              : 'bg-slate-50/80 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
          }${isPassword ? ' pr-12' : ''}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPwd((s) => !s)}
            tabIndex={-1}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-rose-500 font-semibold flex items-center gap-1">{error}</p>}
    </div>
  );
}

/* ── Password Checklist ──────────────────────────────────── */
export function PasswordChecklist({ password }: { password: string }) {
  const rules = validatePasswordRules(password);

  const items = [
    { label: 'At least 8 characters', met: rules.minLength },
    { label: 'At least one uppercase letter (A-Z)', met: rules.hasUpper },
    { label: 'At least one number (0-9)', met: rules.hasDigit },
    { label: 'At least one special symbol (@ # $ % ^ & *)', met: rules.hasSpecial },
  ];

  return (
    <div className="mt-1 mb-4 p-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-1.5 text-xs font-medium text-slate-600">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Password requirements:</p>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <div
            className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] transition-colors ${
              item.met ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
            }`}
          >
            {item.met ? <Check size={9} strokeWidth={3} /> : <X size={9} strokeWidth={3} />}
          </div>
          <span className={item.met ? 'text-emerald-700 font-bold' : 'text-slate-500'}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Primary button ──────────────────────────────────────── */
interface PrimaryBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: ReactNode;
}

export function PrimaryBtn({ loading, children, className: _cls, disabled, ...props }: PrimaryBtnProps) {
  const isBtnDisabled = loading || disabled;
  return (
    <button
      {...props}
      disabled={isBtnDisabled}
      className={`btn-frost-primary btn-primary-full font-semibold shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
        isBtnDisabled ? 'opacity-40 cursor-not-allowed pointer-events-none shadow-none filter grayscale' : ''
      }`}
    >
      {loading ? (
        <>
          <Loader2 size={18} className="animate-spin text-white flex-shrink-0" />
          <span>Please wait...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

/* ── Auth link ───────────────────────────────────────────── */
export function AuthLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">
      {children}
    </Link>
  );
}

/* ── Divider ─────────────────────────────────────────────── */
export function Divider() {
  return (
    <div className="flex items-center gap-4 my-6">
      <span className="flex-1 h-px bg-slate-200" />
      <span className="text-xs font-medium uppercase tracking-wider text-slate-400">or</span>
      <span className="flex-1 h-px bg-slate-200" />
    </div>
  );
}
