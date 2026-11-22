import React, { useState, useEffect } from 'react';
import { RefreshCw, Search, ExternalLink, Calendar, ShieldCheck, CheckCircle2, Sparkles, Filter, Landmark, Briefcase } from 'lucide-react';
import { translations } from '../i18n/translations';
import { apiClient } from '../api/client';

export default function LatestUpdates({ lang }) {
  const t = translations[lang];

  const [activeCategory, setActiveCategory] = useState('scheme');
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('All-India');
  const [statusFilter, setStatusFilter] = useState('');
  const [lastChecked, setLastChecked] = useState(null);

  const fetchUpdates = async () => {
    setLoading(true);
    try {
      const params = { category: activeCategory };
      if (selectedState && selectedState !== 'All-India') params.state = selectedState;
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;

      const res = await apiClient.getUpdates(params);
      if (res.success) {
        setUpdates(res.data);
      }
    } catch (e) {
      console.error('Failed to load updates', e);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      await apiClient.runIngestion();
      setLastChecked(new Date().toLocaleTimeString());
      await fetchUpdates();
    } catch (e) {
      console.error('Sync failed', e);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, [activeCategory, selectedState, statusFilter]);

  const indianStates = [
    'All-India', 'Madhya Pradesh', 'Maharashtra', 'Rajasthan', 'Uttar Pradesh',
    'Punjab', 'Haryana', 'Gujarat', 'Bihar', 'Karnataka', 'Andhra Pradesh', 'Tamil Nadu', 'West Bengal'
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>{t.navUpdates}</span>
            </h1>
            <span className="badge-neon-purple text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Zero Generic Jobs</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
            {t.lastChecked}: <strong className="text-cyan-300">{lastChecked || 'Active Telemetry'}</strong> • Verified against central and state agricultural departments
          </p>
        </div>

        <button
          onClick={handleManualSync}
          disabled={syncing}
          className="btn-cyber-primary disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer shadow-md self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 text-cyan-300 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? t.syncing : t.syncData}</span>
        </button>
      </div>

      {/* Cyber Category Tabs Switcher */}
      <div className="flex bg-white/[0.04] p-1.5 rounded-2xl max-w-md mb-6 border border-white/10 shadow-inner backdrop-blur-xl">
        <button
          onClick={() => setActiveCategory('scheme')}
          className={`flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 ${
            activeCategory === 'scheme'
              ? 'nav-tab-active'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Landmark className="w-4 h-4 text-cyan-400" />
          <span>{t.schemesTab}</span>
        </button>
        <button
          onClick={() => setActiveCategory('farmer_vacancy')}
          className={`flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 ${
            activeCategory === 'farmer_vacancy'
              ? 'nav-tab-active'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Briefcase className="w-4 h-4 text-purple-400" />
          <span>{t.vacanciesTab}</span>
        </button>
      </div>

      {/* Filters Toolbar Glass Panel */}
      <div className="glass-panel p-4 sm:p-5 rounded-2xl shadow-sm mb-8 flex flex-wrap gap-3 items-center border border-white/10">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUpdates()}
            placeholder={t.searchPlaceholder}
            className="w-full pl-10 pr-3.5 py-2 text-sm cyber-input font-medium"
          />
        </div>

        {/* State Filter */}
        <div className="flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-cyan-400 hidden sm:block" />
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="text-xs sm:text-sm cyber-select px-3.5 py-2 font-medium"
          >
            {indianStates.map((st, idx) => (
              <option key={idx} value={st}>{st === 'All-India' ? t.allStates : st}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs sm:text-sm cyber-select px-3.5 py-2 font-medium"
        >
          <option value="">{t.filterStatus}: All</option>
          <option value="active">{t.statusActive}</option>
          <option value="upcoming">{t.statusUpcoming}</option>
          <option value="closed">{t.statusClosed}</option>
        </select>
      </div>

      {/* Updates Cards Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 glass-panel rounded-3xl border border-white/10">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-cyan-400 mb-3" />
          <p className="font-semibold text-white">Retrieving verified records from government index...</p>
        </div>
      ) : updates.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center text-slate-400 border border-white/10">
          <p className="text-lg font-bold text-white">No verified updates match your selected filters.</p>
          <p className="text-sm text-slate-400 mt-1">Try resetting the state filter or click "Sync Official Updates" above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {updates.map((item) => (
            <div
              key={item.id}
              className="glass-card rounded-3xl p-6 flex flex-col justify-between"
            >
              <div>
                {/* Header Tags */}
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300 bg-white/[0.05] px-3 py-1 rounded-full border border-cyan-500/30 shadow-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{item.source_name}</span>
                  </span>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border ${
                      item.status === 'active'
                        ? 'badge-neon-green'
                        : 'bg-white/5 text-slate-400 border-white/10'
                    }`}
                  >
                    {item.status === 'active' ? t.statusActive : item.status}
                  </span>
                </div>

                {/* Title & Summary */}
                <h3 className="font-extrabold text-white text-base sm:text-lg mb-2.5 leading-snug group-hover:text-cyan-300 transition">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 line-clamp-3 mb-5 leading-relaxed">
                  {item.summary}
                </p>

                {/* Info Callouts Box */}
                <div className="space-y-2 text-xs text-slate-300 bg-white/[0.03] border border-white/10 p-4 rounded-2xl mb-5 backdrop-blur-md">
                  {item.eligibility && (
                    <p className="flex items-start gap-1.5">
                      <strong className="text-cyan-400 flex-shrink-0">{t.eligibility}:</strong>
                      <span className="text-slate-300">{item.eligibility}</span>
                    </p>
                  )}
                  {item.benefits && (
                    <p className="flex items-start gap-1.5">
                      <strong className="text-teal-300 flex-shrink-0">{t.benefits}:</strong>
                      <span className="text-white font-semibold">{item.benefits}</span>
                    </p>
                  )}
                  {item.application_deadline && (
                    <p className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-red-400" />
                      <strong className="text-red-400">{t.deadline}:</strong>
                      <span className="text-white font-bold">{item.application_deadline}</span>
                    </p>
                  )}
                  <p className="flex items-center gap-1.5">
                    <strong className="text-slate-400">Region:</strong>
                    <span className="text-purple-300 font-semibold">{item.state_applicability}</span>
                  </p>
                </div>
              </div>

              {/* Card Footer with CTA */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>Verified Score: {(item.relevance_score * 100).toFixed(0)}%</span>
                </span>

                <a
                  href={item.application_link || item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-cyber-primary text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm group"
                >
                  <span>{t.applyNow}</span>
                  <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
