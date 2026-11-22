import React from 'react';
import { MessageSquare, Bell, Sprout, TrendingUp, Globe, ShieldCheck, PhoneCall, Radio, Sparkles, Cpu } from 'lucide-react';
import { translations } from '../i18n/translations';

export default function Navbar({ activeTab, setActiveTab, lang, setLang }) {
  const t = translations[lang];

  return (
    <header className="sticky top-0 z-50">
      {/* Top Futuristic Telemetry Announcement Bar */}
      <div className="bg-[#070b16]/90 backdrop-blur-md text-xs py-1.5 px-4 border-b border-cyan-500/20 hidden sm:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-bold text-cyan-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span>LIVE TELEMETRY:</span>
            </span>
            <span className="text-slate-300 font-medium">Agmarknet 2.0 API & Ministry of Agriculture Portals Synchronized</span>
            <span className="text-slate-600">•</span>
            <span className="text-purple-300 font-medium">600+ Mandi Commodities Across All 36 States & UTs</span>
          </div>

          <div className="flex items-center gap-4 text-slate-300">
            <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
              <PhoneCall className="w-3 h-3 text-cyan-400" />
              <span>Kisan Helpline: <strong className="text-cyan-300">1800-180-1551</strong> (Toll Free)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Futuristic Glass Navbar */}
      <div className="glass-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left: Brand Logo & Title */}
            <div
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={() => setActiveTab('chat')}
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-cyan-400 p-[1px] shadow-lg shadow-purple-500/30 group-hover:shadow-cyan-500/40 transition">
                  <div className="w-full h-full bg-[#0B1020] rounded-2xl flex items-center justify-center">
                    <Sprout className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition duration-300" />
                  </div>
                </div>
                <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full border-2 border-[#0B1020] animate-pulse"></span>
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5">
                    AgriNexa <span className="text-gradient-cyan">AI</span>
                  </span>
                  <span className="badge-neon-purple text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-cyan-400" />
                    <span>DMI Verified</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block font-medium">
                  {t.tagline}
                </p>
              </div>
            </div>

            {/* Middle: Cyber Navigation Tabs */}
            <nav className="flex items-center space-x-1 sm:space-x-2 bg-white/[0.04] p-1.5 rounded-2xl border border-white/10 backdrop-blur-xl shadow-inner">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                  activeTab === 'chat'
                    ? 'nav-tab-active'
                    : 'nav-tab-inactive'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span>{t.navChat}</span>
              </button>

              <button
                onClick={() => setActiveTab('updates')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                  activeTab === 'updates'
                    ? 'nav-tab-active'
                    : 'nav-tab-inactive'
                }`}
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>{t.navUpdates}</span>
              </button>

              <button
                onClick={() => setActiveTab('mandi')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                  activeTab === 'mandi'
                    ? 'nav-tab-active'
                    : 'nav-tab-inactive'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-teal-300" />
                <span>{t.navMandi}</span>
              </button>

              <button
                onClick={() => setActiveTab('alerts')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                  activeTab === 'alerts'
                    ? 'nav-tab-active'
                    : 'nav-tab-inactive'
                }`}
              >
                <Bell className="w-4 h-4 text-amber-300" />
                <span>{t.navAlerts}</span>
              </button>
            </nav>

            {/* Right: Language Switcher */}
            <div className="flex items-center">
              <button
                onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
                className="btn-cyber-secondary flex items-center gap-1.5 font-bold px-3.5 py-2 rounded-xl text-xs shadow-md transition group"
                title="Toggle Language / भाषा बदलें"
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-45 transition duration-300" />
                <span>{lang === 'en' ? 'हिंदी में बदलें' : 'Switch to English'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
