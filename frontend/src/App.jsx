import React, { useState } from 'react';
import Navbar from './components/Navbar';
import AskAgriNexa from './components/AskAgriNexa';
import LatestUpdates from './components/LatestUpdates';
import MandiPrices from './components/MandiPrices';
import AlertPreferences from './components/AlertPreferences';
import { ShieldCheck, PhoneCall, Globe2, Radio, Cpu, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [lang, setLang] = useState('hi'); // Default Hindi for Indian farmer accessibility

  return (
    <div className="min-h-screen flex flex-col relative text-slate-100 selection:bg-purple-500 selection:text-white">
      {/* Ambient Cybernetic Glowing Backdrop */}
      <div className="cyber-bg-container">
        <div className="ambient-blob blob-1"></div>
        <div className="ambient-blob blob-2"></div>
        <div className="ambient-blob blob-3"></div>
        <div className="cyber-grid-overlay"></div>
      </div>

      {/* Main Glass Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        setLang={setLang}
      />

      {/* Main Workspace Router */}
      <main className="flex-1 pb-16 relative z-10">
        {activeTab === 'chat' && <AskAgriNexa lang={lang} />}
        {activeTab === 'updates' && <LatestUpdates lang={lang} />}
        {activeTab === 'mandi' && <MandiPrices lang={lang} />}
        {activeTab === 'alerts' && <AlertPreferences lang={lang} />}
      </main>

      {/* Futuristic AI Dashboard Footer */}
      <footer className="relative z-10 glass-nav text-slate-400 text-xs py-10 border-t border-white/10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 pb-8 border-b border-white/10">
            {/* Col 1: AI Platform Brand */}
            <div>
              <div className="flex items-center space-x-2.5 mb-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 via-purple-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Cpu className="w-4 h-4 text-white" />
                </div>
                <span className="font-extrabold text-lg text-white tracking-tight">AgriNexa AI</span>
                <span className="badge-neon-purple text-[10px] font-bold px-2 py-0.5 rounded-full">
                  v2.0 Neural Engine
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed text-xs">
                Next-generation agricultural intelligence platform powered by Retrieval-Augmented Generation (RAG) and direct government data telemetry across all 36 Indian states.
              </p>
            </div>

            {/* Col 2: Authoritative Integrations */}
            <div>
              <h4 className="font-bold text-white text-sm mb-3 flex items-center gap-1.5 text-gradient-cyan">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Authoritative Integrations</span>
              </h4>
              <ul className="space-y-1.5 text-slate-400 text-xs">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  <span>Directorate of Marketing & Inspection (Agmarknet 2.0 API)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                  <span>Ministry of Agriculture & Farmers Welfare (DA&FW)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                  <span>Indian Council of Agricultural Research (ICAR) & ASRB</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span>PM-KISAN DBT Direct Benefit Transfer Pipeline</span>
                </li>
              </ul>
            </div>

            {/* Col 3: Real-Time Assistance */}
            <div>
              <h4 className="font-bold text-white text-sm mb-3 flex items-center gap-1.5 text-gradient-purple">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>Farmer Assistance & Helplines</span>
              </h4>
              <div className="space-y-2.5 text-slate-300 text-xs">
                <p className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/5">
                  <PhoneCall className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>Kisan Call Centre: <strong className="text-white">1800-180-1551</strong> (22 Languages)</span>
                </p>
                <p className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/5">
                  <PhoneCall className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>PM-KISAN Helpline: <strong className="text-white">155261 / 011-24300606</strong></span>
                </p>
                <p className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/5">
                  <Globe2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
                  <span>National Portal: <strong className="text-white">agricoop.gov.in</strong></span>
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>© 2026 AgriNexa AI. Grounded in official Indian Government datasets. Zero hallucinated rates.</p>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 badge-neon-green px-2.5 py-1 rounded-full text-xs font-semibold">
                <Radio className="w-3 h-3 text-teal-400 animate-pulse" />
                <span>Live Government Telemetry Active</span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
