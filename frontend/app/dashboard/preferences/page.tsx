'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import {
  ArrowLeft,
  Globe,
  Bell,
  Check,
  Loader2,
  Send,
  Smartphone,
  ShieldCheck,
  Save,
  Sliders,
  Menu,
  X,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi, pushApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar', region: 'United States' },
  { code: 'EUR', symbol: '€', name: 'Euro', region: 'European Union' },
  { code: 'GBP', symbol: '£', name: 'British Pound', region: 'United Kingdom' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', region: 'India' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', region: 'Australia' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', region: 'Canada' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', region: 'Japan' },
];

const NOTIFICATION_DAY_OPTIONS = [
  { value: 1, label: '1 Day Prior', desc: 'Urgent final day alert before renewal date' },
  { value: 3, label: '3 Days Prior', desc: 'Recommended balance buffer window', recommended: true },
  { value: 7, label: '7 Days Prior', desc: '1 week advance notice for team renewals' },
  { value: 14, label: '14 Days Prior', desc: '2 weeks advance notice for annual plans' },
  { value: 30, label: '30 Days Prior', desc: 'Monthly advance notice window' },
];

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PreferencesPage() {
  const router = useRouter();
  const { user, token, updateUser, loading: authLoading, logout } = useAuth();

  const [primaryCurrency, setPrimaryCurrency] = useState(user?.primaryCurrency || 'INR');
  const [defaultNotificationDays, setDefaultNotificationDays] = useState(
    user?.defaultNotificationDays || 3
  );
  const [saving, setSaving] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  // Web Push Notification states
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [testingPush, setTestingPush] = useState(false);

  // Sync user properties when loaded
  useEffect(() => {
    if (user) {
      if (user.primaryCurrency) setPrimaryCurrency(user.primaryCurrency);
      if (user.defaultNotificationDays) setDefaultNotificationDays(user.defaultNotificationDays);
    }
  }, [user]);

  // Auth Guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  // Check Web Push status on current device
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator) {
      if (Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then((reg) => {
          reg.pushManager.getSubscription().then((sub) => {
            if (sub) setPushEnabled(true);
          });
        });
      }
    }
  }, []);

  const handleTogglePush = async () => {
    if (!token) return;
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
      toast.error('Web Push Notifications are not supported in your browser');
      return;
    }

    setPushLoading(true);
    try {
      if (pushEnabled) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await pushApi.unsubscribe(sub.endpoint, token);
          await sub.unsubscribe();
        }
        setPushEnabled(false);
        toast.success('Push notifications disabled on this device');
      } else {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') {
          toast.error('Browser notification permission was denied');
          return;
        }

        const reg = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        const { publicKey } = await pushApi.getVapidPublicKey();
        const convertedKey = urlBase64ToUint8Array(publicKey);

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey,
        });

        await pushApi.subscribe(sub.toJSON(), token);
        setPushEnabled(true);
        toast.success('Web Push Notifications enabled!');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to configure push notifications');
    } finally {
      setPushLoading(false);
    }
  };

  const handleSendTestPush = async () => {
    if (!token) return;
    setTestingPush(true);
    try {
      const res = await pushApi.sendTest(token);
      toast.success(res.message || 'Test push notification sent!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send test push notification');
    } finally {
      setTestingPush(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSaving(true);
    try {
      await authApi.updateSettings(
        {
          primaryCurrency,
          defaultNotificationDays: Number(defaultNotificationDays),
        },
        token
      );

      updateUser({
        primaryCurrency,
        defaultNotificationDays: Number(defaultNotificationDays),
      });

      toast.success('Preferences saved successfully!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
        <div className="spinner w-8 h-8 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Desktop Frost UI Sidebar */}
      <aside className="hidden md:block w-64 flex-shrink-0 bg-white/80 backdrop-blur-xl border-r border-slate-200/80 sticky top-0 h-screen p-6 shadow-sm z-30">
        <Sidebar activeTab="preferences" email={user?.email} verified={user?.verified} onLogout={handleLogout} />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 px-5 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-indigo-600 text-white shadow-md">
            <Layers size={16} strokeWidth={2.2} />
          </div>
          <span className="text-base font-extrabold text-slate-900">SubTrackr<span className="text-indigo-600">.</span></span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-[#334155] flex items-center justify-center cursor-pointer"
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[65px] z-40 bg-white/95 backdrop-blur-2xl border-b border-slate-200/80 p-6 animate-frost-pop shadow-xl">
          <Sidebar activeTab="preferences" email={user?.email} verified={user?.verified} onLogout={handleLogout} />
        </div>
      )}

      {/* Main Content Canvas */}
      <main className="flex-1 p-6 md:p-10 pt-20 md:pt-10 overflow-y-auto min-w-0 font-sans antialiased pb-20">
        <div className="max-w-5xl mx-auto space-y-8 animate-frost-fade-up">
        {/* Top Title Header */}
        <div className="flex items-center gap-3 border-b border-slate-200/80 pb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm flex-shrink-0">
            <Sliders size={24} strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Preferences & Account Settings</h1>
            <p className="text-xs font-medium text-slate-500">Customize display currency, renewal alerts, and device notifications</p>
          </div>
        </div>

        {/* ── Section 1: Display Currency Settings ────────────────────────────── */}
        <div className="frost-card p-6 md:p-8 space-y-6 animate-frost-fade-up stagger-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <Globe size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Primary Display Currency</h2>
              <p className="text-xs text-slate-500 font-medium">All dashboard expense totals and multi-currency values convert to this base currency</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SUPPORTED_CURRENCIES.map((curr) => {
              const isSelected = primaryCurrency === curr.code;
              return (
                <div
                  key={curr.code}
                  onClick={() => setPrimaryCurrency(curr.code)}
                  className={`p-4 rounded-2xl cursor-pointer border transition-all duration-300 flex items-center justify-between group ${
                    isSelected
                      ? 'bg-indigo-50/80 border-indigo-600 shadow-md ring-2 ring-indigo-600/20'
                      : 'bg-white border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg transition-transform group-hover:scale-105 ${
                      isSelected ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {curr.symbol}
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-900">{curr.code}</p>
                      <p className="text-[11px] font-medium text-slate-500 truncate">{curr.name}</p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Section 2: Renewal Notification Window ────────────────────────────── */}
        <div className="frost-card p-6 md:p-8 space-y-6 animate-frost-fade-up stagger-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-sm">
              <Bell size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Renewal Reminder Schedule</h2>
              <p className="text-xs text-slate-500 font-medium">Select how far in advance renewal email reminders and notifications are triggered</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {NOTIFICATION_DAY_OPTIONS.map((opt) => {
              const isSelected = defaultNotificationDays === opt.value;
              return (
                <div
                  key={opt.value}
                  onClick={() => setDefaultNotificationDays(opt.value)}
                  className={`p-4 rounded-2xl cursor-pointer border transition-all duration-300 relative overflow-hidden flex flex-col justify-between group ${
                    isSelected
                      ? 'bg-purple-50/80 border-purple-600 shadow-md ring-2 ring-purple-600/20'
                      : 'bg-white border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-black text-slate-900">{opt.label}</span>
                    {opt.recommended && (
                      <span className="pill-badge pill-purple text-[10px]">Recommended</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{opt.desc}</p>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-end">
                    {isSelected ? (
                      <span className="text-xs font-bold text-purple-700 flex items-center gap-1">
                        <Check size={14} /> Selected
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-600">Select</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Section 3: Web Push Notifications ───────────────────────────────── */}
        <div className="frost-card p-6 md:p-8 space-y-6 animate-frost-fade-up stagger-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                <Smartphone size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Device Web Push Notifications</h2>
                <p className="text-xs text-slate-500 font-medium">Receive direct desktop/mobile browser alerts before renewal charge dates</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTogglePush}
              disabled={pushLoading}
              className={`px-5 py-2.5 rounded-full text-xs font-extrabold transition-all flex items-center gap-2 ${
                pushEnabled
                  ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                  : 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700'
              }`}
            >
              {pushLoading && <Loader2 size={14} className="animate-spin" />}
              {pushEnabled ? 'Disable Web Push' : 'Enable Web Push'}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${pushEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                <span className="text-xs font-bold text-slate-900">
                  {pushEnabled ? 'Active Device Subscription' : 'Not Subscribed on this Browser'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {pushEnabled
                  ? 'Your current browser is active and registered to receive renewal push alerts.'
                  : 'Click "Enable Web Push" to grant browser permissions and receive live push notifications.'}
              </p>
            </div>

            {pushEnabled && (
              <button
                type="button"
                onClick={handleSendTestPush}
                disabled={testingPush}
                className="btn-frost-secondary text-xs px-4 py-2 flex items-center gap-2 flex-shrink-0"
              >
                {testingPush ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Test Push Notification
              </button>
            )}
          </div>
        </div>

        {/* ── Section 4: Account Details Card ─────────────────────────────────── */}
        <div className="frost-card p-6 md:p-8 space-y-4 animate-frost-fade-up stagger-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-base flex items-center justify-center shadow-md">
                {user.email ? user.email[0].toUpperCase() : 'U'}
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-900">{user.email}</p>
                <p className="text-xs text-slate-500 font-medium">User Account ID: {user.id}</p>
              </div>
            </div>

            {user.verified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold">
                <ShieldCheck size={14} className="text-emerald-600" /> Account Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-extrabold">
                Verification Pending
              </span>
            )}
          </div>
        </div>

        {/* ── Bottom Action Bar ─────────────────────────────────────────────────── */}
        <div className="frost-card p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 animate-frost-fade-up stagger-5 shadow-xl bg-gradient-to-r from-white/90 via-slate-50/90 to-white/90">
          <Link
            href="/dashboard"
            className="btn-frost-secondary text-sm px-6 py-3.5 inline-flex items-center justify-center gap-2 font-bold w-full sm:w-auto"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-frost-primary text-sm px-8 py-3.5 shadow-lg shadow-indigo-500/25 font-bold flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Saving Changes...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </main>
  </div>
  );
}
