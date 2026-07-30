'use client';

import React, { useEffect, useState } from 'react';
import { X, Globe, Bell, Check, Loader2, Send, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi, pushApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface SettingsModalProps {
  onClose: () => void;
  onSaved: () => void;
}

const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
];

const NOTIFICATION_DAY_OPTIONS = [
  { value: 1, label: '1 Day Before', desc: 'Urgent final day alert' },
  { value: 3, label: '3 Days Before', desc: 'Standard reminder window (Recommended)' },
  { value: 7, label: '7 Days Before', desc: '1 week advance notice' },
  { value: 14, label: '14 Days Before', desc: '2 weeks advance notice' },
  { value: 30, label: '30 Days Before', desc: 'Monthly advance notice' },
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

export default function SettingsModal({ onClose, onSaved }: SettingsModalProps) {
  const { user, token, updateUser } = useAuth();

  const [primaryCurrency, setPrimaryCurrency] = useState(user?.primaryCurrency || 'INR');
  const [defaultNotificationDays, setDefaultNotificationDays] = useState(
    user?.defaultNotificationDays || 3
  );
  const [saving, setSaving] = useState(false);

  // Push notification state
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [testingPush, setTestingPush] = useState(false);

  // Check if push notifications are enabled on this device
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
      toast.error('Web Push Notifications are not supported in your current browser');
      return;
    }

    setPushLoading(true);
    try {
      if (pushEnabled) {
        // Unsubscribe
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await pushApi.unsubscribe(sub.endpoint, token);
          await sub.unsubscribe();
        }
        setPushEnabled(false);
        toast.success('Push notifications disabled on this device');
      } else {
        // Subscribe
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') {
          toast.error('Browser notification permission was denied');
          return;
        }

        const reg = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        const { publicKey } = await pushApi.getVapidPublicKey();
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        await pushApi.subscribe(sub.toJSON(), token);
        setPushEnabled(true);
        toast.success('Web Push Notifications enabled!');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to toggle push notifications');
    } finally {
      setPushLoading(false);
    }
  };

  const handleSendTestPush = async () => {
    if (!token) return;
    setTestingPush(true);
    try {
      const res = await pushApi.sendTest(token);
      toast.success(res.message || 'Test push notification dispatched!');
    } catch (err) {
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

      toast.success('Settings saved successfully!');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-950/40 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="frost-card bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-2xl rounded-3xl p-6 md:p-8 w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-scale-in relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-all flex items-center justify-center cursor-pointer z-10"
        >
          <X size={16} />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3 mb-5 flex-shrink-0 pr-8">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm flex-shrink-0">
            <Globe size={20} strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-black tracking-tight text-slate-900 truncate">User Preferences</h2>
            <p className="text-xs text-slate-500 font-medium truncate">Configure currency, alerts & native push notifications</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="flex flex-col min-h-0 flex-1">
          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-6">
            {/* Section 1: Primary Currency */}
            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <Globe size={14} className="text-indigo-600" />
                Primary Display Currency
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {SUPPORTED_CURRENCIES.map((curr) => {
                  const isSelected = primaryCurrency === curr.code;
                  return (
                    <button
                      key={curr.code}
                      type="button"
                      onClick={() => setPrimaryCurrency(curr.code)}
                      className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-950 font-bold shadow-xs'
                          : 'bg-slate-50/70 border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5 font-black text-sm">
                          <span className="text-xs text-indigo-600 font-mono">{curr.symbol}</span>
                          <span>{curr.code}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium block mt-0.5 truncate">{curr.name}</span>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Native Web Push Notifications */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Smartphone size={14} className="text-purple-600" />
                Native Web Push Notifications
              </label>

              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Device OS Alerts</span>
                  <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                    Receive native desktop / mobile notification banners before renewals occur.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleTogglePush}
                  disabled={pushLoading}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0 cursor-pointer ${
                    pushEnabled
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                  }`}
                >
                  {pushLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : pushEnabled ? (
                    'Enabled'
                  ) : (
                    'Enable Push'
                  )}
                </button>
              </div>

              {pushEnabled && (
                <button
                  type="button"
                  onClick={handleSendTestPush}
                  disabled={testingPush}
                  className="w-full p-2.5 rounded-xl border border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {testingPush ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Send Test Push Notification
                </button>
              )}
            </div>

            {/* Section 3: Default Notification Days */}
            <div className="pt-4 border-t border-slate-100">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <Bell size={14} className="text-amber-600" />
                Default Renewal Alert Lead Time
              </label>

              <div className="space-y-2">
                {NOTIFICATION_DAY_OPTIONS.map((opt) => {
                  const isSelected = Number(defaultNotificationDays) === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDefaultNotificationDays(opt.value)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-50 border-amber-200 text-amber-950 font-bold shadow-xs'
                          : 'bg-slate-50/70 border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-sm text-slate-900 block">{opt.label}</span>
                        <span className="text-xs text-slate-500 font-medium">{opt.desc}</span>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Buttons Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 flex-shrink-0 mt-4">
            <button type="button" onClick={onClose} className="btn-frost-secondary text-xs px-5 py-2.5 font-bold" disabled={saving}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-frost-primary text-xs px-6 py-2.5 font-bold flex items-center gap-2 shadow-md">
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Preferences'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
