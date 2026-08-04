'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Plus, Save, Sparkles, ChevronDown, Search, Check, Layers, Folder } from 'lucide-react';
import type { Subscription, SubscriptionFormData, SubscriptionStatus, CatalogService, CatalogPlan, Workspace } from '@/types';
import catalogServicesData from '@/lib/servicesCatalog.json';
import { useAuth } from '@/context/AuthContext';

const catalogServices = catalogServicesData as CatalogService[];

const CATEGORIES = [
  'Entertainment & Streaming',
  'AI & Automation',
  'Developer Tools & Cloud',
  'Productivity & Work',
  'Design & Creative',
  'Utilities & Security',
  'Entertainment',
  'Productivity',
  'Music',
  'Gaming',
  'Other'
];
const BILLING_CYCLES = ['monthly', 'yearly', 'weekly', 'daily'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'JPY'];
const PAYMENT_METHODS = ['Credit Card', 'Debit Card', 'PayPal', 'UPI', 'Bank Transfer', 'Other'];

type FormState = Omit<SubscriptionFormData, 'price'> & {
  price: string;
  status: SubscriptionStatus;
  isFreeTrial: boolean;
  freeTrialEndDate: string;
  workSpaceId?: string;
};

const EMPTY: FormState = {
  serviceName: '',
  category: '',
  price: '',
  currency: 'INR',
  billingCycle: 'monthly',
  renewalDate: '',
  paymentMethod: '',
  notes: '',
  status: 'active',
  isFreeTrial: false,
  freeTrialEndDate: '',
  workSpaceId: '',
};

interface Props {
  title: string;
  initial?: Subscription;
  workspaces?: Workspace[];
  onSubmit: (data: SubscriptionFormData) => Promise<void>;
  onClose: () => void;
}

interface ModalOptionItem {
  label: string;
  value: string;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5 block">
        {label}
      </label>
      {children}
    </div>
  );
}

function ModalFrostSelect({
  value,
  placeholder = 'Select option…',
  options,
  onChange,
  className = '',
}: {
  value: string;
  placeholder?: string;
  options: ModalOptionItem[];
  onChange: (val: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOpt = options.find((o) => o.value === value);

  return (
    <div className={`relative ${open ? 'z-50' : 'z-10'}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full px-3.5 py-2.5 rounded-2xl text-xs transition-all flex items-center justify-between gap-2 border cursor-pointer ${
          open
            ? 'bg-white text-slate-900 border-indigo-500 ring-4 ring-indigo-500/10 font-bold shadow-sm'
            : 'bg-white text-slate-900 border-indigo-100/90 hover:border-indigo-300 ring-1 ring-indigo-50/60 font-bold hover:shadow-sm'
        } ${className}`}
      >
        <span className={`truncate ${value ? 'text-slate-900 font-bold' : 'text-slate-500 font-medium'}`}>
          {selectedOpt ? selectedOpt.label : placeholder}
        </span>
        <ChevronDown size={15} className={`text-slate-400 transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180 text-indigo-600' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-1.5 rounded-2xl bg-white border border-slate-200 p-1.5 z-[100] animate-frost-pop space-y-1 max-h-56 overflow-y-auto shadow-2xl">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-black shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check size={14} className="text-white flex-shrink-0" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SubscriptionModal({ title, initial, workspaces = [], onSubmit, onClose }: Props) {
  const { user } = useAuth();
  const userCurrency = user?.primaryCurrency || 'INR';

  const [form, setForm] = useState<FormState>(
    initial
      ? {
          ...initial,
          price: String(initial.price),
          status: initial.status || 'active',
          isFreeTrial: Boolean(initial.isFreeTrial),
          renewalDate: initial.renewalDate
            ? new Date(initial.renewalDate).toISOString().slice(0, 10)
            : '',
          freeTrialEndDate: initial.freeTrialEndDate
            ? new Date(initial.freeTrialEndDate).toISOString().slice(0, 10)
            : '',
          workSpaceId: initial.workSpaceId || '',
        }
      : { ...EMPTY, currency: userCurrency }
  );

  const [loading, setLoading] = useState(false);
  const [catalogQuery, setCatalogQuery] = useState('');
  const [showCatalogDropdown, setShowCatalogDropdown] = useState(false);
  const [selectedService, setSelectedService] = useState<CatalogService | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const [isCustomName, setIsCustomName] = useState(false);

  const filteredCatalog = catalogQuery.trim()
    ? catalogServices.filter(
        (s) =>
          s.serviceName.toLowerCase().includes(catalogQuery.toLowerCase()) ||
          s.category.toLowerCase().includes(catalogQuery.toLowerCase())
      )
    : catalogServices;

  const applyPlan = (
    service: CatalogService,
    plan: CatalogPlan,
    targetCurrency?: string,
    overrideName?: boolean
  ) => {
    const activeCurrency = targetCurrency || form.currency || userCurrency;
    const priceForCurrency = plan.pricing[activeCurrency] ?? plan.pricing['USD'] ?? 0;
    const currSymbol = plan.pricing[activeCurrency] !== undefined ? activeCurrency : 'USD';

    let defaultName = service.serviceName;
    if (plan.planName && !plan.planName.toLowerCase().includes('default')) {
      defaultName = `${service.serviceName} (${plan.planName})`;
    }

    setForm((prev) => ({
      ...prev,
      serviceName: !overrideName && isCustomName && prev.serviceName ? prev.serviceName : defaultName,
      category: service.category,
      price: String(priceForCurrency),
      currency: currSymbol,
      billingCycle: plan.billingCycle,
      notes: `${plan.planName}: ${plan.notes}`,
    }));

    setSelectedPlanId(plan.planId);
  };

  const handleSelectCatalogItem = (service: CatalogService) => {
    setSelectedService(service);
    setCatalogQuery(service.serviceName);
    setShowCatalogDropdown(false);
    setIsCustomName(false);

    if (service.plans && service.plans.length > 0) {
      applyPlan(service, service.plans[0], form.currency || userCurrency, true);
    }
  };

  const handleSelectPlanChange = (planId: string) => {
    if (!selectedService) return;
    const plan = selectedService.plans.find((p) => p.planId === planId);
    if (plan) {
      applyPlan(selectedService, plan, form.currency || userCurrency);
    }
  };

  const handleCurrencyChange = (newCurrency: string) => {
    if (selectedService && selectedPlanId) {
      const currentPlan = selectedService.plans.find((p) => p.planId === selectedPlanId);
      if (currentPlan && currentPlan.pricing[newCurrency] !== undefined) {
        setForm((p) => ({
          ...p,
          currency: newCurrency,
          price: String(currentPlan.pricing[newCurrency]),
        }));
        return;
      }
    }
    setForm((p) => ({ ...p, currency: newCurrency }));
  };

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (name === 'serviceName') {
      setIsCustomName(true);
    }
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((p) => ({ ...p, [name]: checked }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.serviceName || !form.category || !form.price || !form.renewalDate) return;
    setLoading(true);
    try {
      await onSubmit({
        ...form,
        price: parseFloat(form.price),
        billingCycle: form.billingCycle as SubscriptionFormData['billingCycle'],
        status: form.status,
        isFreeTrial: form.isFreeTrial,
        freeTrialEndDate: form.isFreeTrial && form.freeTrialEndDate ? form.freeTrialEndDate : undefined,
        workSpaceId: form.workSpaceId ? form.workSpaceId : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-400";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-950/40 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="frost-card bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-2xl rounded-3xl w-full max-w-[560px] max-h-[92vh] overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-5 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Sparkles size={18} strokeWidth={2.2} />
            </div>
            <h2 className="text-lg font-black tracking-tight text-slate-900">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-all flex items-center justify-center cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit} className="px-7 py-6 flex flex-col min-h-0 flex-1 overflow-y-auto gap-5">
          {/* Catalog Type-Ahead Search */}
          {!initial && (
            <div className="space-y-3 relative z-40">
              <div className="relative">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between">
                  <span>Select Service from Catalog</span>
                  <span className="text-[10px] text-indigo-600 font-extrabold tracking-wider">Multi-Plan Auto-Fill</span>
                </label>

                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search catalog e.g. Netflix, ChatGPT, Spotify, GitHub, AWS…"
                    value={catalogQuery}
                    onChange={(e) => {
                      setCatalogQuery(e.target.value);
                      setShowCatalogDropdown(true);
                    }}
                    onFocus={() => setShowCatalogDropdown(true)}
                    className={`${inputClass} pl-10 pr-9`}
                  />
                  {catalogQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setCatalogQuery('');
                        setSelectedService(null);
                        setSelectedPlanId(null);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Typeahead Dropdown */}
                {showCatalogDropdown && (
                  <div className="absolute top-full left-0 right-0 z-[100] mt-2 max-h-60 overflow-y-auto bg-white border border-slate-200/90 rounded-2xl p-1.5 shadow-2xl space-y-1 animate-frost-pop">
                    {filteredCatalog.length === 0 ? (
                      <div className="p-3 text-xs text-slate-400 font-semibold text-center">No matching catalog service found</div>
                    ) : (
                      filteredCatalog.map((service) => {
                        const isSelected = selectedService?.id === service.id;
                        const planCount = service.plans?.length || 0;
                        const minPrice = service.plans && service.plans.length > 0
                          ? service.plans[0].pricing[userCurrency] ?? service.plans[0].pricing['USD']
                          : 0;

                        return (
                          <button
                            key={service.id}
                            type="button"
                            onClick={() => handleSelectCatalogItem(service)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-bold'
                                : 'bg-slate-50/50 border-slate-100 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0 shadow-sm"
                                style={{ backgroundColor: service.brandColor || '#6366f1' }}
                              >
                                {service.serviceName.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-xs text-slate-900 block truncate">
                                  {service.serviceName}
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium block truncate">
                                  {service.category} • {planCount} plan{planCount > 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                              <span className="text-xs font-black text-indigo-600">
                                From {userCurrency} {minPrice}
                              </span>
                              {isSelected && <Check size={14} className="text-indigo-600" strokeWidth={2.5} />}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Service Plan Selector Custom Dropdown */}
              {selectedService && selectedService.plans && selectedService.plans.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2 animate-frost-pop relative z-50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <Layers size={14} className="text-indigo-600" /> Available Plans for {selectedService.serviceName}
                    </span>
                    <span className="text-[10px] text-indigo-600 uppercase tracking-wider font-extrabold">
                      {selectedService.plans.length} Tiers
                    </span>
                  </div>

                  <ModalFrostSelect
                    value={selectedPlanId || ''}
                    placeholder="Select plan tier…"
                    options={selectedService.plans.map((plan) => {
                      const activeCurrency = form.currency || userCurrency;
                      const price = plan.pricing[activeCurrency] ?? plan.pricing['USD'];
                      const curr = plan.pricing[activeCurrency] !== undefined ? activeCurrency : 'USD';
                      return {
                        label: `${plan.planName} — ${curr} ${price} (${plan.billingCycle})`,
                        value: plan.planId,
                      };
                    })}
                    onChange={(val) => handleSelectPlanChange(val)}
                  />
                </div>
              )}
            </div>
          )}

          {/* Row 1: Workspace Selector */}
          {workspaces && workspaces.length > 0 && (
            <div className="relative z-30">
              <Field label="Assign to Workspace">
                <ModalFrostSelect
                  value={form.workSpaceId || ''}
                  placeholder="Default (No Workspace)"
                  options={[
                    { label: 'Default (No Workspace)', value: '' },
                    ...workspaces.map((ws) => ({
                      label: `📁 ${ws.name} (${ws.totalNumberOfSubscriptions || 0} subs)`,
                      value: ws._id,
                    })),
                  ]}
                  onChange={(val) => setForm((p) => ({ ...p, workSpaceId: val }))}
                />
              </Field>
            </div>
          )}

          {/* Row 2: Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-20">
            <Field label="Service name *">
              <input
                className={inputClass}
                name="serviceName"
                placeholder="e.g. Netflix"
                value={form.serviceName}
                onChange={handle}
                required
              />
            </Field>
            <Field label="Category *">
              <ModalFrostSelect
                value={form.category}
                placeholder="Select category…"
                options={CATEGORIES.map((c) => ({ label: c, value: c }))}
                onChange={(val) => setForm((p) => ({ ...p, category: val }))}
              />
            </Field>
          </div>

          {/* Row 3: Price & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-15">
            <Field label="Price *">
              <input
                className={inputClass}
                name="price"
                type="number"
                min="0"
                step="0.01"
                placeholder="9.99"
                value={form.price}
                onChange={handle}
                required
              />
            </Field>
            <Field label="Currency">
              <ModalFrostSelect
                value={form.currency}
                placeholder="Select currency…"
                options={CURRENCIES.map((c) => ({ label: c, value: c }))}
                onChange={handleCurrencyChange}
              />
            </Field>
          </div>

          {/* Row 4: Billing Cycle & Renewal Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
            <Field label="Billing cycle *">
              <ModalFrostSelect
                value={form.billingCycle}
                placeholder="Select cycle…"
                options={BILLING_CYCLES.map((c) => ({
                  label: c.charAt(0).toUpperCase() + c.slice(1),
                  value: c,
                }))}
                onChange={(val) => setForm((p) => ({ ...p, billingCycle: val as any }))}
              />
            </Field>
            <Field label="Renewal date *">
              <input
                className={inputClass}
                name="renewalDate"
                type="date"
                value={form.renewalDate}
                onChange={handle}
                required
              />
            </Field>
          </div>

          {/* Row 5: Status & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-[5]">
            <Field label="Subscription Status">
              <ModalFrostSelect
                value={form.status}
                placeholder="Select status…"
                options={[
                  { label: 'Active', value: 'active' },
                  { label: 'Paused', value: 'paused' },
                  { label: 'Cancelled', value: 'cancelled' },
                ]}
                onChange={(val) => setForm((p) => ({ ...p, status: val as SubscriptionStatus }))}
              />
            </Field>
            <Field label="Payment method">
              <ModalFrostSelect
                value={form.paymentMethod || ''}
                placeholder="Select payment method…"
                options={PAYMENT_METHODS.map((m) => ({ label: m, value: m }))}
                onChange={(val) => setForm((p) => ({ ...p, paymentMethod: val }))}
              />
            </Field>
          </div>

          {/* Free Trial Toggle */}
          <div className="rounded-2xl p-4 bg-slate-50 border border-slate-200 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="isFreeTrial"
                checked={form.isFreeTrial}
                onChange={handle}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs font-bold text-slate-900">This is a Free Trial</span>
            </label>

            {form.isFreeTrial && (
              <Field label="Free Trial End Date">
                <input
                  className={inputClass}
                  name="freeTrialEndDate"
                  type="date"
                  value={form.freeTrialEndDate}
                  onChange={handle}
                />
              </Field>
            )}
          </div>

          {/* Notes */}
          <Field label="Notes (optional)">
            <textarea
              className={`${inputClass} py-2.5 min-h-[68px] text-xs resize-none`}
              name="notes"
              placeholder="Add notes e.g. shared family plan account..."
              value={form.notes}
              onChange={handle}
            />
          </Field>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 flex-shrink-0">
            <button type="button" onClick={onClose} className="btn-frost-secondary text-xs px-5 py-2.5 font-bold" disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-frost-primary text-xs px-6 py-2.5 font-bold shadow-md">
              {loading ? (
                'Saving…'
              ) : initial ? (
                <>
                  <Save size={15} /> Save Changes
                </>
              ) : (
                <>
                  <Plus size={15} /> Add Subscription
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
