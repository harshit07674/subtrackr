'use client';

import { useState, useRef, useEffect } from 'react';
import {
  X,
  Briefcase,
  Folder,
  User,
  Rocket,
  Cpu,
  Layers,
  Sparkles,
  Building,
  Code,
  Shield,
  Check,
  Save,
  Plus,
  Palette,
  ChevronDown
} from 'lucide-react';
import type { Workspace } from '@/types';
import { getWorkspaceIcon } from '@/lib/workspaceIcons';
import toast from 'react-hot-toast';

interface WorkspaceModalProps {
  title: string;
  initial?: Workspace;
  onSubmit: (data: {
    name: string;
    category: string;
    colorTheme: { primary: string; secondary: string };
    iconName: string;
  }) => Promise<void>;
  onClose: () => void;
}

const CATEGORIES = [
  'Work',
  'Personal',
  'Side Projects',
  'Family',
  'Client Services',
  'Enterprise',
  'Gaming',
  'Other'
];

const PRIMARY_SWATCHES = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f43f5e', // Rose
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#a855f7', // Violet
  '#3b82f6', // Blue
  '#ec4899', // Pink
];

const SECONDARY_SWATCHES = [
  '#8b5cf6', // Purple
  '#14b8a6', // Teal
  '#ec4899', // Pink
  '#f97316', // Sunset
  '#0ea5e9', // Sky
  '#d946ef', // Fuchsia
  '#60a5fa', // Light Blue
  '#f43f5e', // Rose
];

const ICONS = [
  { id: 'briefcase', label: 'Briefcase', icon: Briefcase },
  { id: 'folder', label: 'Folder', icon: Folder },
  { id: 'user', label: 'User', icon: User },
  { id: 'rocket', label: 'Rocket', icon: Rocket },
  { id: 'cpu', label: 'Cpu', icon: Cpu },
  { id: 'layers', label: 'Layers', icon: Layers },
  { id: 'sparkles', label: 'Sparkles', icon: Sparkles },
  { id: 'building', label: 'Building', icon: Building },
  { id: 'code', label: 'Code', icon: Code },
  { id: 'shield', label: 'Shield', icon: Shield },
];

function CustomSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (val: string) => void;
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

  return (
    <div className={`relative ${open ? 'z-50' : 'z-10'}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between gap-2 border cursor-pointer bg-white text-slate-900 border-indigo-100/90 hover:border-indigo-300 ring-1 ring-indigo-50/60 shadow-xs"
      >
        <span>{value}</span>
        <ChevronDown size={15} className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180 text-indigo-600' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-1.5 rounded-2xl bg-white border border-slate-200 p-1.5 z-[100] animate-frost-pop space-y-1 max-h-52 overflow-y-auto shadow-2xl">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                opt === value
                  ? 'bg-indigo-600 text-white font-black shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{opt}</span>
              {opt === value && <Check size={14} className="text-white flex-shrink-0" strokeWidth={2.5} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function WorkspaceModal({ title, initial, onSubmit, onClose }: WorkspaceModalProps) {
  const [name, setName] = useState(initial?.name || '');
  const [category, setCategory] = useState(initial?.category || 'Work');
  const [primaryColor, setPrimaryColor] = useState(initial?.colorTheme?.primary || '#6366f1');
  const [secondaryColor, setSecondaryColor] = useState(initial?.colorTheme?.secondary || '#8b5cf6');
  const [selectedIcon, setSelectedIcon] = useState(initial?.iconName || 'briefcase');
  const [loading, setLoading] = useState(false);

  const PreviewIconComponent = getWorkspaceIcon(selectedIcon);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Workspace name is required');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        category,
        colorTheme: {
          primary: primaryColor,
          secondary: secondaryColor,
        },
        iconName: selectedIcon,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save workspace';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-400";
  const labelClass = "text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5 block";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-950/40 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="frost-card bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-2xl rounded-3xl w-full max-w-[520px] max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-5 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md transition-all"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
            >
              <PreviewIconComponent size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900">{title}</h2>
              <p className="text-xs text-slate-500 font-medium">Customize your workspace appearance</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-all flex items-center justify-center cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-7 py-6 flex flex-col min-h-0 flex-1 overflow-y-auto gap-5">
          {/* Live Preview Card */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">
              Live Preview
            </span>
            <div
              className="p-3.5 rounded-2xl border flex items-center justify-between transition-all"
              style={{
                borderColor: `${primaryColor}66`,
                background: `linear-gradient(135deg, ${primaryColor}18, ${secondaryColor}08)`,
                boxShadow: `0 4px 20px ${primaryColor}15`,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold shadow-md"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                >
                  <PreviewIconComponent size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">
                    {name.trim() || 'Untitled Workspace'}
                  </h4>
                  <span className="text-[10px] text-slate-500 font-medium">{category}</span>
                </div>
              </div>
              <span
                className="px-2.5 py-1 rounded-full text-[10px] font-extrabold text-white shadow-xs"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
              >
                Badge Preview
              </span>
            </div>
          </div>

          {/* Workspace Name */}
          <div>
            <label className={labelClass}>Workspace Name *</label>
            <input
              type="text"
              className={inputClass}
              placeholder="e.g. Work Projects, Personal, Client ABC..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Category */}
          <div className="relative z-30">
            <label className={labelClass}>Category</label>
            <CustomSelect value={category} options={CATEGORIES} onChange={setCategory} />
          </div>

          {/* Primary Color Picker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className={`${labelClass} flex items-center gap-1.5 mb-0`}>
                <Palette size={14} className="text-indigo-600" /> Primary Theme Color
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-500 uppercase font-bold">{primaryColor}</span>
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-6 h-6 rounded-md cursor-pointer border border-slate-200 bg-transparent"
                  title="Custom Primary Color"
                />
              </div>
            </div>
            <div className="grid grid-cols-8 gap-2">
              {PRIMARY_SWATCHES.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setPrimaryColor(color)}
                  className={`w-full h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                    primaryColor.toLowerCase() === color.toLowerCase()
                      ? 'border-slate-900 scale-110 shadow-md ring-2 ring-indigo-500/20'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {primaryColor.toLowerCase() === color.toLowerCase() && <Check size={12} className="text-white drop-shadow-sm" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>

          {/* Secondary Color Picker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className={`${labelClass} flex items-center gap-1.5 mb-0`}>
                <Palette size={14} className="text-purple-600" /> Secondary Theme Color
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-500 uppercase font-bold">{secondaryColor}</span>
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-6 h-6 rounded-md cursor-pointer border border-slate-200 bg-transparent"
                  title="Custom Secondary Color"
                />
              </div>
            </div>
            <div className="grid grid-cols-8 gap-2">
              {SECONDARY_SWATCHES.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSecondaryColor(color)}
                  className={`w-full h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                    secondaryColor.toLowerCase() === color.toLowerCase()
                      ? 'border-slate-900 scale-110 shadow-md ring-2 ring-purple-500/20'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {secondaryColor.toLowerCase() === color.toLowerCase() && <Check size={12} className="text-white drop-shadow-sm" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Picker */}
          <div>
            <label className={labelClass}>Workspace Icon</label>
            <div className="grid grid-cols-5 gap-2.5">
              {ICONS.map(({ id, icon: IconComp }) => {
                const isSelected = selectedIcon === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedIcon(id)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold shadow-xs'
                        : 'border-slate-200 bg-slate-50/70 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <IconComp size={18} strokeWidth={2.2} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 flex-shrink-0 mt-2">
            <button type="button" onClick={onClose} className="btn-frost-secondary text-xs px-5 py-2.5 font-bold" disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-frost-primary text-xs px-6 py-2.5 font-bold flex items-center gap-2 shadow-md">
              {loading ? (
                'Saving…'
              ) : initial ? (
                <>
                  <Save size={15} /> Save Changes
                </>
              ) : (
                <>
                  <Plus size={15} /> Create Workspace
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
