'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldCheck, BarChart3, Bell, Layers, Zap, ArrowRight,
  Star, TrendingDown, Globe, ChevronRight,
  Play, Sparkles, CreditCard, RefreshCw,
} from 'lucide-react';

/* ─── Static Data ─────────────────────────────── */
const features = [
  { icon: ShieldCheck, title: 'Bank-Level Security', desc: 'JWT + refresh tokens, OTP email verification, and encrypted secure password reset.' },
  { icon: BarChart3, title: 'Live Spending Analytics', desc: 'Real-time monthly and yearly spend calculations across all your subscriptions.' },
  { icon: Bell, title: 'Smart Renewal Alerts', desc: "Automated reminders before each renewal so you're never surprised by a charge." },
  { icon: TrendingDown, title: 'Spend Breakdown', desc: 'Visualise spending by category — entertainment, productivity, tools and more.' },
  { icon: Layers, title: 'Workspace Management', desc: 'Group subscriptions into workspaces for personal, team, or per-client tracking.' },
  { icon: Zap, title: 'Instant Updates', desc: 'Real-time CRUD with optimistic UI — every change reflected immediately.' },
];

const stats = [
  { value: '12K+', label: 'Active Users' },
  { value: '$2.4M', label: 'Subscriptions Tracked' },
  { value: '99.9%', label: 'Uptime' },
  { value: '4.9★', label: 'User Rating' },
];


const testimonials = [
  { name: 'Sarah K.', role: 'Product Designer', text: 'SubTrackr saved us from paying for 3 zombie subscriptions we totally forgot about. Beautiful interface.', rating: 5 },
  { name: 'Marcus T.', role: 'Freelance Developer', text: "Finally a subscription tracker that doesn't look like it was built in 2012. The Frost UI is stunning.", rating: 5 },
  { name: 'Priya R.', role: 'Startup Founder', text: "I track all my SaaS tools in SubTrackr. The workspaces feature is a game-changer for multi-client billing.", rating: 5 },
];

const integrations = ['Stripe', 'Notion', 'Slack', 'Figma', 'Linear', 'Loom', 'GitHub', 'Vercel', 'AWS', 'Zapier'];

const howItWorks = [
  { step: '01', icon: CreditCard, title: 'Add your subscriptions', desc: 'Manually add or bulk import subscriptions via CSV. Supports every service imaginable.' },
  { step: '02', icon: Bell, title: 'Set renewal reminders', desc: 'Choose how far in advance you want to be alerted before each subscription renews.' },
  { step: '03', icon: BarChart3, title: 'Track & save money', desc: "Watch your spending dashboard in real-time. Cancel what you don't need." },
];

/* ─── Animated Counter ────────────────────────── */
function AnimatedCounter({ target }: { target: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [displayed, setDisplayed] = useState('0');
  const animated = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !animated.current) {
        animated.current = true;
        const numeric = parseFloat(target.replace(/[^0-9.]/g, ''));
        const prefix = target.match(/^[^0-9]*/)?.[0] ?? '';
        const suffix = target.match(/[^0-9.]+$/)?.[0] ?? '';
        const t0 = performance.now();
        const dur = 1600;
        const tick = (now: number) => {
          const p = Math.min((now - t0) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          const v = eased * numeric;
          setDisplayed(prefix + (Number.isInteger(numeric) ? Math.round(v).toString() : v.toFixed(1)) + suffix);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{displayed}</span>;
}

/* ─── Landing Page ────────────────────────────── */
export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const navRef = useRef<HTMLElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroSubRef = useRef<HTMLParagraphElement>(null);
  const heroCardRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const testimonialsRef = useRef<HTMLElement>(null);
  const integrationsRef = useRef<HTMLElement>(null);
  const ctaSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  /* ── GSAP Cinematic Animations ── */
  useEffect(() => {
    let ctx: { revert: () => void } | null = null;
    const run = async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        /* NAV drop-in */
        gsap.from(navRef.current, { y: -80, opacity: 0, duration: 0.9, ease: 'power3.out' });

        /* HERO sequence */
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        tl.from(badgeRef.current, { y: 30, opacity: 0, duration: 0.7, delay: 0.25 })
          .from('.hero-word', { y: 70, opacity: 0, duration: 0.7, stagger: 0.07, ease: 'back.out(1.7)' }, '-=0.3')
          .from(heroSubRef.current, { y: 20, opacity: 0, duration: 0.6 }, '-=0.2')
          .from('.hero-cta-btn', { y: 20, opacity: 0, duration: 0.5, stagger: 0.12 }, '-=0.2')
          .from(heroCardRef.current, { y: 70, opacity: 0, scale: 0.93, duration: 1.1, ease: 'back.out(1.2)' }, '-=0.4')
          .from('.hero-float-badge', { scale: 0, opacity: 0, duration: 0.5, stagger: 0.15, ease: 'back.out(2)' }, '-=0.6');

        /* Parallax orbs */
        gsap.to('.orb-a', { y: -70, ease: 'none', scrollTrigger: { scrub: 1.5, start: 'top top', end: 'bottom top' } });
        gsap.to('.orb-b', { y: -110, ease: 'none', scrollTrigger: { scrub: 2, start: 'top top', end: 'bottom top' } });
        gsap.to('.orb-c', { y: -90, ease: 'none', scrollTrigger: { scrub: 1.2, start: 'top top', end: 'bottom top' } });

        /* Stats */
        gsap.from('.stat-item', {
          y: 40, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'back.out(1.4)',
          scrollTrigger: { trigger: statsRef.current, start: 'top 80%' },
        });

        /* Features */
        gsap.from('.feature-card', {
          y: 55, opacity: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out',
          scrollTrigger: { trigger: featuresRef.current, start: 'top 78%' },
        });

        /* How it works */
        gsap.from('.hiw-card', {
          y: 50, opacity: 0, duration: 0.75, stagger: 0.15, ease: 'power3.out',
          scrollTrigger: { trigger: '#how-it-works', start: 'top 78%' },
        });

        /* Dark showcase */
        gsap.from('.dark-card', {
          y: 60, opacity: 0, scale: 0.96, duration: 0.8, stagger: 0.15, ease: 'power3.out',
          scrollTrigger: { trigger: '#dark-showcase', start: 'top 78%' },
        });

        /* Testimonials */
        gsap.from('.testimonial-card', {
          x: 60, opacity: 0, duration: 0.75, stagger: 0.15, ease: 'power3.out',
          scrollTrigger: { trigger: testimonialsRef.current, start: 'top 80%' },
        });

        /* Integrations */
        gsap.from(integrationsRef.current, {
          opacity: 0, y: 30, duration: 0.8,
          scrollTrigger: { trigger: integrationsRef.current, start: 'top 85%' },
        });

        /* CTA */
        gsap.from(ctaSectionRef.current, {
          scale: 0.94, opacity: 0, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: ctaSectionRef.current, start: 'top 80%' },
        });
      });
    };
    run();
    return () => ctx?.revert();
  }, []);

  return (
    <div className="relative overflow-x-hidden bg-[#f8fafc]">

      {/* ═══ NAV ═══════════════════════════════ */}
      <nav ref={navRef} className="fixed top-0 left-0 right-0 z-50 border-b border-white/60 backdrop-blur-2xl bg-white/75 shadow-sm shadow-slate-100/60">
        <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
              <Layers size={18} strokeWidth={2.2} />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">SubTrackr<span className="text-indigo-600">.</span></span>
          </div>
          <div className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#dark-showcase" className="hover:text-slate-900 transition-colors">Showcase</a>
            <a href="#testimonials" className="hover:text-slate-900 transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden md:block text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors px-4 py-2">Sign in</Link>
            <Link href="/register" className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 shadow-md shadow-indigo-500/25 hover:-translate-y-0.5 hover:shadow-indigo-500/40 transition-all duration-200">
              Get started free <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ══════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-16 overflow-hidden">
        {/* Background orbs */}
        <div className="orb-a absolute -top-[15%] -left-[12%] w-[700px] h-[700px] rounded-full bg-gradient-to-br from-indigo-400/30 to-violet-400/15 blur-3xl pointer-events-none" />
        <div className="orb-b absolute -bottom-[5%] -right-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tl from-violet-400/25 to-fuchsia-400/15 blur-3xl pointer-events-none" />
        <div className="orb-c absolute top-[25%] right-[5%] w-[350px] h-[350px] rounded-full bg-gradient-to-br from-indigo-300/20 to-sky-300/10 blur-2xl pointer-events-none" />
        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.35]"
          style={{ backgroundImage: 'radial-gradient(circle, #c7d2fe 1.2px, transparent 1.2px)', backgroundSize: '32px 32px' }} />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Trust badge */}
          <div ref={badgeRef} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-xl border border-indigo-200/80 text-indigo-700 text-xs font-bold mb-8 shadow-sm shadow-indigo-200/50">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            Loved by 12,000+ subscribers worldwide
            <Sparkles size={13} className="text-indigo-500" />
          </div>

          {/* Headline — words split for GSAP stagger */}
          <h1 ref={heroTitleRef} className="text-5xl md:text-6xl lg:text-[5rem] font-black leading-[1.06] tracking-tight text-slate-900 mb-7">
            <span className="hero-word inline-block">Stop&nbsp;</span>
            <span className="hero-word inline-block">wasting&nbsp;</span>
            <span className="hero-word inline-block bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">money&nbsp;</span>
            <span className="hero-word inline-block">on&nbsp;</span>
            <br className="hidden md:block" />
            <span className="hero-word inline-block">forgotten&nbsp;</span>
            <span className="hero-word inline-block">subscriptions</span>
          </h1>

          <p ref={heroSubRef} className="text-xl text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto mb-10">
            One beautiful dashboard to track Netflix, Spotify, SaaS tools and everything your team uses.
            Know exactly what you spend — and when the next renewal hits.
          </p>

          <div className="flex flex-wrap gap-4 justify-center mb-20">
            <Link href="/register"
              className="hero-cta-btn group flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-1 transition-all duration-300">
              Start for free <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/login"
              className="hero-cta-btn flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base text-slate-700 bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-md hover:-translate-y-1 hover:border-indigo-300 transition-all duration-300">
              <Play size={15} className="text-indigo-600" /> Sign in
            </Link>
          </div>

          {/* Dashboard Mockup Card */}
          <div ref={heroCardRef} className="relative mx-auto max-w-3xl">
            {/* Floating contextual badges */}
            <div className="hero-float-badge absolute -top-6 -left-4 z-10 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-2xl shadow-slate-200/60 text-xs font-bold text-slate-700 animate-float">
              <TrendingDown size={14} className="text-emerald-500" /> Saved $127 this month
            </div>
            <div className="hero-float-badge absolute -top-3 -right-6 z-10 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 shadow-xl shadow-indigo-500/40 text-xs font-bold text-white animate-float" style={{ animationDelay: '1.5s' }}>
              <Bell size={12} /> 3 renewals this week
            </div>
            <div className="hero-float-badge absolute -bottom-5 -right-2 z-10 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-xl text-xs font-bold text-slate-700 animate-float" style={{ animationDelay: '0.8s' }}>
              <Globe size={13} className="text-violet-500" /> Team of 5 tracked
            </div>

            {/* Glass card */}
            <div className="rounded-3xl border border-white/80 bg-white/65 backdrop-blur-2xl shadow-2xl shadow-slate-300/40 overflow-hidden">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-5 py-3.5 bg-white/80 border-b border-slate-100/80">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs font-semibold text-slate-400">dashboard.subtrackr.app</span>
              </div>
              {/* KPI row */}
              <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Monthly Spend', value: '$284.50', bg: 'bg-indigo-50  border-indigo-100', text: 'text-indigo-700' },
                  { label: 'Active Subs', value: '14', bg: 'bg-violet-50  border-violet-100', text: 'text-violet-700' },
                  { label: 'Next Renewal', value: 'Aug 3', bg: 'bg-amber-50   border-amber-100', text: 'text-amber-700' },
                  { label: 'Yearly Total', value: '$3,414', bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700' },
                ].map(({ label, value, bg, text }) => (
                  <div key={label} className={`rounded-2xl border p-4 ${bg}`}>
                    <div className={`text-lg font-black ${text}`}>{value}</div>
                    <div className="text-xs font-semibold text-slate-500 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
              {/* Subscription rows */}
              <div className="px-6 pb-6 space-y-2">
                {[
                  { name: 'Netflix', amount: '$15.99', date: 'Aug 3' },
                  { name: 'Notion Pro', amount: '$16.00', date: 'Aug 9' },
                  { name: 'GitHub', amount: '$4.00', date: 'Aug 12' },
                ].map(row => (
                  <div key={row.name} className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50/80 border border-slate-100/80">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-black">{row.name[0]}</div>
                      <div>
                        <div className="text-sm font-bold text-slate-800">{row.name}</div>
                        <div className="text-xs text-slate-400">Renews {row.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-100">Active</span>
                      <span className="text-sm font-black text-slate-900">{row.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TRUST / MARQUEE BAR ═══════════════ */}
      <section ref={integrationsRef} className="py-14 border-y border-slate-200/60 bg-white/70 backdrop-blur-sm overflow-hidden">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-400 mb-8">Tracks subscriptions from your favourite tools</p>
        <div className="flex items-center gap-14 whitespace-nowrap" style={{ animation: 'marquee 30s linear infinite' }}>
          {[...integrations, ...integrations].map((name, i) => (
            <span key={i} className="text-base font-black text-slate-300 hover:text-slate-500 transition-colors cursor-default">{name}</span>
          ))}
        </div>
      </section>

      {/* ═══ STATS ═════════════════════════════ */}
      <section ref={statsRef} id="stats" className="py-24 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.18]" style={{ backgroundImage: 'radial-gradient(circle, white 1.5px, transparent 1.5px)', backgroundSize: '28px 28px' }} />
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map(({ value, label }) => (
            <div key={label} className="stat-item">
              <div className="text-4xl md:text-5xl font-black text-white mb-2"><AnimatedCounter target={value} /></div>
              <div className="text-sm font-semibold text-indigo-200">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES ══════════════════════════ */}
      <section ref={featuresRef} id="features" className="py-28 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold mb-5">
            <Sparkles size={12} /> Everything you need
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Built for real subscription<br />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">management</span>
          </h2>
          <p className="text-lg text-slate-500 font-medium max-w-xl mx-auto">Every feature designed to help you spend less and know more about your recurring costs.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="feature-card group frost-card p-8 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-default border border-slate-100/80">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-6 group-hover:bg-indigo-100 group-hover:scale-110 transition-all shadow-sm">
                <Icon size={24} className="text-indigo-600" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-3">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ HOW IT WORKS ══════════════════════ */}
      <section id="how-it-works" className="py-28 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-50 border border-violet-200/80 text-violet-700 text-xs font-bold mb-5">
              <Zap size={12} /> Simple as 1-2-3
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
              Get started in <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">minutes</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map(({ step, icon: Icon, title, desc }, idx) => (
              <div key={step} className="hiw-card relative">
                <div className="frost-card p-8 h-full border border-slate-100/80 hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
                  <div className="text-7xl font-black text-slate-100 mb-4 leading-none select-none">{step}</div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/25">
                    <Icon size={20} className="text-white" strokeWidth={2} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mb-3">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">{desc}</p>
                </div>
                {idx < 2 && (
                  <div className="hidden md:flex absolute top-1/2 -right-5 z-10 w-9 h-9 rounded-full bg-indigo-100 border border-indigo-200 items-center justify-center -translate-y-1/2 shadow-sm">
                    <ChevronRight size={16} className="text-indigo-600" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ DARK ANALYTICS SHOWCASE ═══════════ */}
      <section id="dark-showcase" className="py-28 bg-[#0b0f17] relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-violet-600/25 blur-3xl pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold mb-5">
              <Globe size={12} /> Live analytics
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
              Your entire spend,<br />
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">beautifully visualised</span>
            </h2>
            <p className="text-base text-slate-400 font-medium max-w-xl mx-auto">See monthly breakdowns, upcoming renewals, and category spending all in one place.</p>
          </div>

          {/* ── Rich Analytics Dashboard Mockup ── */}
          <div className="dark-card grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* LEFT: Bar Chart — Monthly Spend */}
            <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Monthly Spend Overview</p>
                  <div className="flex items-end gap-3">
                    <span className="text-3xl font-black text-white">$284.50</span>
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 mb-1"><TrendingDown size={12} /> 12% vs last month</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span><span className="text-slate-400">This month</span></span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-white/20"></span><span className="text-slate-500">Last month</span></span>
                </div>
              </div>

              {/* SVG Bar Chart */}
              <svg viewBox="0 0 520 180" className="w-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="1" />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.5" />
                  </linearGradient>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#f0abfc" />
                  </linearGradient>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Grid lines */}
                {[0, 45, 90, 135, 180].map(y => (
                  <line key={y} x1="0" y1={y} x2="520" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                ))}
                {/* Previous month bars (muted) */}
                {[
                  [28, 95], [90, 120], [155, 80], [220, 140], [285, 100], [350, 160], [415, 75], [480, 130]
                ].map(([x, h], i) => (
                  <rect key={i} x={x} y={180 - h} width={24} height={h} rx="6" fill="rgba(255,255,255,0.08)" />
                ))}
                {/* Current month bars */}
                {[
                  [52, 130], [116, 155], [181, 105], [246, 165], [311, 120], [376, 145], [441, 90], [506, 160]
                ].map(([x, h], i) => (
                  <rect key={i} x={x} y={180 - h} width={24} height={h} rx="6" fill="url(#barGrad)">
                    <animate attributeName="height" from="0" to={h} dur="1.2s" begin={`${i * 0.1}s`} fill="freeze" calcMode="spline" keySplines="0.16 1 0.3 1" />
                    <animate attributeName="y" from="180" to={180 - h} dur="1.2s" begin={`${i * 0.1}s`} fill="freeze" calcMode="spline" keySplines="0.16 1 0.3 1" />
                  </rect>
                ))}
                {/* Trend line (area) */}
                <path d="M64,50 C100,55 130,30 193,45 C255,60 270,20 323,38 C375,56 390,35 453,48 C490,56 510,40 518,45 L518,180 L64,180 Z"
                  fill="url(#areaGrad)" />
                <path d="M64,50 C100,55 130,30 193,45 C255,60 270,20 323,38 C375,56 390,35 453,48 C490,56 510,40 518,45"
                  fill="none" stroke="url(#lineGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <animate attributeName="stroke-dashoffset" from="600" to="0" dur="1.8s" fill="freeze" />
                </path>
                {/* Dots on trend line */}
                {[
                  [64, 50], [193, 45], [323, 38], [453, 48]
                ].map(([cx, cy], i) => (
                  <circle key={i} cx={cx} cy={cy} r="4" fill="#a78bfa" stroke="#1e1b4b" strokeWidth="2">
                    <animate attributeName="r" from="0" to="4" dur="0.4s" begin={`${0.8 + i * 0.15}s`} fill="freeze" />
                  </circle>
                ))}
                {/* X-axis labels */}
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'].map((m, i) => (
                  <text key={m} x={52 + i * 65} y={175} textAnchor="middle" fontSize="11" fill="rgba(148,163,184,0.7)" fontWeight="600">{m}</text>
                ))}
              </svg>
            </div>

            {/* RIGHT: Category Donut + Stats */}
            <div className="flex flex-col gap-5">

              {/* Donut / Category ring */}
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-6 flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Spend by Category</p>
                <div className="flex items-center gap-4">
                  {/* SVG Donut */}
                  <svg viewBox="0 0 80 80" className="w-20 h-20 flex-shrink-0" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="40" cy="40" r="30" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
                    {/* Entertainment 35% */}
                    <circle cx="40" cy="40" r="30" fill="none" stroke="#6366f1" strokeWidth="12"
                      strokeDasharray="65.94 122.52" strokeDashoffset="0" strokeLinecap="round">
                      <animate attributeName="stroke-dasharray" from="0 188" to="65.94 122.52" dur="1.2s" fill="freeze" />
                    </circle>
                    {/* Productivity 28% */}
                    <circle cx="40" cy="40" r="30" fill="none" stroke="#8b5cf6" strokeWidth="12"
                      strokeDasharray="52.75 135.71" strokeDashoffset="-65.94" strokeLinecap="round">
                      <animate attributeName="stroke-dasharray" from="0 188" to="52.75 135.71" dur="1.2s" begin="0.3s" fill="freeze" />
                    </circle>
                    {/* Dev Tools 22% */}
                    <circle cx="40" cy="40" r="30" fill="none" stroke="#a78bfa" strokeWidth="12"
                      strokeDasharray="41.44 146.92" strokeDashoffset="-118.69" strokeLinecap="round">
                      <animate attributeName="stroke-dasharray" from="0 188" to="41.44 146.92" dur="1.2s" begin="0.6s" fill="freeze" />
                    </circle>
                    {/* Other 15% */}
                    <circle cx="40" cy="40" r="30" fill="none" stroke="#c4b5fd" strokeWidth="12"
                      strokeDasharray="28.27 160.19" strokeDashoffset="-160.13" strokeLinecap="round">
                      <animate attributeName="stroke-dasharray" from="0 188" to="28.27 160.19" dur="1.2s" begin="0.9s" fill="freeze" />
                    </circle>
                  </svg>
                  <div className="flex flex-col gap-2 text-xs font-semibold">
                    {[
                      { color: 'bg-indigo-500', label: 'Entertainment', pct: '35%' },
                      { color: 'bg-violet-500', label: 'Productivity', pct: '28%' },
                      { color: 'bg-purple-400', label: 'Dev Tools', pct: '22%' },
                      { color: 'bg-purple-300', label: 'Other', pct: '15%' },
                    ].map(({ color, label, pct }) => (
                      <span key={label} className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${color}`} />
                        <span className="text-slate-300">{label}</span>
                        <span className="ml-auto text-white font-black">{pct}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Quick Stats</p>
                <div className="space-y-3">
                  {[
                    { label: 'Active subscriptions', value: '14', delta: '', icon: RefreshCw, up: true },
                    { label: 'Due this week', value: '3', delta: 'Netflix, Notion, GH', icon: Globe, up: false },
                    { label: 'Saved vs last month', value: '$38', delta: '12% less', icon: TrendingDown, up: true },
                  ].map(({ label, value, delta, icon: Icon, up }) => (
                    <div key={label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
                          <Icon size={12} className="text-indigo-400" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-400 leading-none">{label}</div>
                          {delta && <div className="text-[10px] text-slate-600 mt-0.5">{delta}</div>}
                        </div>
                      </div>
                      <span className={`text-sm font-black ${up ? 'text-emerald-400' : 'text-indigo-300'}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ══════════════════════ */}
      <section ref={testimonialsRef} id="testimonials" className="py-28 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-700 text-xs font-bold mb-5">
            <Star size={12} className="fill-amber-500 text-amber-500" /> Loved by thousands
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            Don&apos;t take our word for it
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(({ name, role, text, rating }) => (
            <div key={name} className="testimonial-card frost-card p-8 border border-slate-100/80 hover:-translate-y-2 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
              <div className="flex gap-1 mb-5">
                {Array.from({ length: rating }).map((_, i) => <Star key={i} size={15} className="fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-sm text-slate-600 leading-relaxed font-medium mb-6">&ldquo;{text}&rdquo;</p>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white text-xs font-black">{name[0]}</div>
                <div>
                  <div className="text-sm font-black text-slate-900">{name}</div>
                  <div className="text-xs text-slate-400 font-semibold">{role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* ═══ CTA BANNER ════════════════════════ */}
      <section ref={ctaSectionRef} className="py-20 px-6">
        <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-14 text-center relative overflow-hidden shadow-2xl shadow-indigo-500/30">
          <div className="absolute inset-0 opacity-[0.18]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
              Ready to take control<br />of your subscriptions?
            </h2>
            <p className="text-indigo-200 font-medium mb-10 text-base max-w-xl mx-auto">
              Join thousands of smart users who stopped overpaying on software they don&apos;t use.
            </p>
            <Link href="/register"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base text-indigo-700 bg-white hover:bg-indigo-50 shadow-xl hover:-translate-y-1 transition-all duration-300">
              Start for free — no credit card
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ════════════════════════════ */}
      <footer className="py-14 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white">
              <Layers size={16} strokeWidth={2.2} />
            </div>
            <span className="text-lg font-black text-slate-900">SubTrackr<span className="text-indigo-600">.</span></span>
          </div>
          <p className="text-sm text-slate-400 font-medium">© 2024 SubTrackr. Built with Next.js &amp; Frost UI.</p>
          <div className="flex items-center gap-6 text-sm font-semibold text-slate-400">
            <a href="#features" className="hover:text-slate-700 transition-colors">Features</a>
            <a href="#testimonials" className="hover:text-slate-700 transition-colors">Reviews</a>
            <Link href="/login" className="hover:text-slate-700 transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
