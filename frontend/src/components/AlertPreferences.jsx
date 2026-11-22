import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, ShieldCheck, Save, Smartphone, Mail, AppWindow, Check, HeartHandshake, Sparkles } from 'lucide-react';
import { translations } from '../i18n/translations';
import { apiClient } from '../api/client';

export default function AlertPreferences({ lang }) {
  const t = translations[lang];

  const [formData, setFormData] = useState({
    user_name: 'Ritesh Kumar',
    contact: '+91 98765 43210',
    preferred_language: lang,
    channel: 'in_app',
    schemes_enabled: true,
    vacancies_enabled: true,
    consent_given: true,
    states: ['Madhya Pradesh', 'Maharashtra'],
    crops: ['Wheat', 'Soybean', 'Chana']
  });

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadPref() {
      try {
        const res = await apiClient.getAlertPreferences('default_farmer');
        if (res.success && res.data) {
          setFormData(prev => ({
            ...prev,
            ...res.data
          }));
        }
      } catch (err) {
        console.warn('Could not load preferences:', err.message);
      }
    }
    loadPref();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    try {
      const res = await apiClient.saveAlertPreferences('default_farmer', formData);
      if (res.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 4000);
      }
    } catch (err) {
      console.error('Failed to save alert preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const availableStates = [
    'Madhya Pradesh', 'Maharashtra', 'Rajasthan', 'Uttar Pradesh', 'Punjab', 'Haryana', 'Gujarat', 'Bihar', 'Karnataka'
  ];

  const availableCrops = [
    { name: 'Wheat', icon: '🌾' },
    { name: 'Soybean', icon: '🌱' },
    { name: 'Paddy(Dhan)', icon: '🍚' },
    { name: 'Cotton', icon: '☁️' },
    { name: 'Mustard', icon: '🌼' },
    { name: 'Chana', icon: '🧆' },
    { name: 'Maize', icon: '🌽' },
    { name: 'Onion', icon: '🧅' }
  ];

  const toggleState = (st) => {
    setFormData(prev => ({
      ...prev,
      states: prev.states.includes(st)
        ? prev.states.filter(s => s !== st)
        : [...prev.states, st]
    }));
  };

  const toggleCrop = (cr) => {
    setFormData(prev => ({
      ...prev,
      crops: prev.crops.includes(cr)
        ? prev.crops.filter(c => c !== cr)
        : [...prev.crops, cr]
    }));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-purple-600 p-[1.5px] shadow-lg shadow-amber-500/20">
            <div className="w-full h-full bg-[#0B1020] rounded-2xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>{t.alertsTitle}</span>
              <span className="badge-neon-purple text-xs font-bold px-2.5 py-0.5 rounded-full">
                Real-Time Telemetry
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
              {t.alertsSubtitle}
            </p>
          </div>
        </div>
      </div>

      {saved && (
        <div className="glass-panel bg-emerald-950/40 border border-teal-400/50 rounded-2xl p-4 mb-6 flex items-center gap-3 text-teal-300 text-sm font-bold shadow-lg shadow-teal-500/10">
          <CheckCircle2 className="w-5 h-5 text-teal-400 flex-shrink-0" />
          <span>{t.savedSuccess}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="glass-panel rounded-3xl p-6 sm:p-8 shadow-xl border border-white/10 space-y-7">
        {/* Farmer Name & Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-extrabold text-cyan-300 uppercase tracking-wider mb-2">
              Farmer / User Name
            </label>
            <input
              type="text"
              value={formData.user_name}
              onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
              className="w-full text-sm cyber-input px-3.5 py-2.5 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-cyan-300 uppercase tracking-wider mb-2">
              Mobile / Contact Number
            </label>
            <input
              type="text"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              className="w-full text-sm cyber-input px-3.5 py-2.5 font-medium"
            />
          </div>
        </div>

        {/* Delivery Channel Selector */}
        <div>
          <label className="block text-xs font-extrabold text-cyan-300 uppercase tracking-wider mb-3">
            {t.deliveryChannel}
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'in_app', label: t.inAppChannel, icon: AppWindow },
              { id: 'sms', label: t.smsChannel, icon: Smartphone },
              { id: 'email', label: t.emailChannel, icon: Mail }
            ].map((ch) => {
              const isSelected = formData.channel === ch.id;
              const Icon = ch.icon;
              return (
                <button
                  type="button"
                  key={ch.id}
                  onClick={() => setFormData({ ...formData, channel: ch.id })}
                  className={`p-4 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'nav-tab-active'
                      : 'glass-card text-slate-300 hover:text-white hover:border-cyan-400'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-yellow-300' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold">{ch.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Categories of Interest */}
        <div>
          <label className="block text-xs font-extrabold text-cyan-300 uppercase tracking-wider mb-3">
            Notification Categories
          </label>
          <div className="flex flex-wrap gap-4 bg-white/[0.03] p-4 rounded-2xl border border-white/10">
            <label className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-white cursor-pointer">
              <input
                type="checkbox"
                checked={formData.schemes_enabled}
                onChange={(e) => setFormData({ ...formData, schemes_enabled: e.target.checked })}
                className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
              />
              <span>🌾 {t.schemesTab}</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-white cursor-pointer">
              <input
                type="checkbox"
                checked={formData.vacancies_enabled}
                onChange={(e) => setFormData({ ...formData, vacancies_enabled: e.target.checked })}
                className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
              />
              <span>👨‍🌾 {t.vacanciesTab}</span>
            </label>
          </div>
        </div>

        {/* States of Interest */}
        <div>
          <label className="block text-xs font-extrabold text-cyan-300 uppercase tracking-wider mb-3">
            {t.interestedStates}
          </label>
          <div className="flex flex-wrap gap-2.5">
            {availableStates.map((st, idx) => {
              const selected = formData.states.includes(st);
              return (
                <button
                  type="button"
                  key={idx}
                  onClick={() => toggleState(st)}
                  className={`text-xs px-4 py-2 rounded-xl border transition font-bold flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    selected
                      ? 'nav-tab-active'
                      : 'glass-card text-slate-300 hover:text-white hover:border-cyan-400'
                  }`}
                >
                  {selected && <Check className="w-3.5 h-3.5 text-cyan-300" />}
                  <span>{st}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Crops of Interest */}
        <div>
          <label className="block text-xs font-extrabold text-cyan-300 uppercase tracking-wider mb-3">
            {t.interestedCrops}
          </label>
          <div className="flex flex-wrap gap-2.5">
            {availableCrops.map((cr, idx) => {
              const selected = formData.crops.includes(cr.name);
              return (
                <button
                  type="button"
                  key={idx}
                  onClick={() => toggleCrop(cr.name)}
                  className={`text-xs px-4 py-2 rounded-xl border transition font-bold flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    selected
                      ? 'nav-tab-active'
                      : 'glass-card text-slate-300 hover:text-white hover:border-cyan-400'
                  }`}
                >
                  <span>{cr.icon}</span>
                  {selected && <Check className="w-3.5 h-3.5 text-cyan-300" />}
                  <span>{cr.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Farmer Privacy Consent Guarantee */}
        <div className="pt-4 border-t border-white/10">
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex items-start gap-3">
            <HeartHandshake className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 leading-relaxed">
              <label className="flex items-start gap-2.5 cursor-pointer font-bold text-white">
                <input
                  type="checkbox"
                  checked={formData.consent_given}
                  onChange={(e) => setFormData({ ...formData, consent_given: e.target.checked })}
                  className="w-4 h-4 accent-cyan-500 rounded mt-0.5 cursor-pointer"
                />
                <span>{t.consentLabel}</span>
              </label>
              <p className="mt-1 text-slate-400 pl-6">
                AgriNexa guarantees zero commercial spam, zero data monetisation, and 100% verified official announcements only.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="btn-cyber-primary disabled:opacity-50 text-white px-7 py-3 rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer shadow-lg"
          >
            <Save className="w-4 h-4 text-cyan-300" />
            <span>{loading ? 'Saving Preferences...' : t.savePreferences}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
