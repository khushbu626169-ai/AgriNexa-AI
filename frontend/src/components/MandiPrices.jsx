import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, AlertTriangle, ExternalLink, ShieldCheck, Search, Sprout, Coins, Layers, ArrowRight } from 'lucide-react';
import { translations } from '../i18n/translations';
import { apiClient } from '../api/client';

export default function MandiPrices({ lang }) {
  const t = translations[lang];

  const popularCrops = [
    { id: '1', name: 'Wheat (गेहूं)', icon: '🌾' },
    { id: '3', name: 'Soyabean (सोयाबीन)', icon: '🌱' },
    { id: '2', name: 'Paddy (धान/चावल)', icon: '🍚' },
    { id: '5', name: 'Mustard (सरसों)', icon: '🌼' },
    { id: '4', name: 'Cotton (कपास)', icon: '☁️' },
    { id: '6', name: 'Gram (चना)', icon: '🧆' },
    { id: '8', name: 'Onion (प्याज)', icon: '🧅' },
    { id: '9', name: 'Potato (आलू)', icon: '🥔' }
  ];

  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [commodities, setCommodities] = useState([]);
  const [markets, setMarkets] = useState([]);

  const [selectedStateId, setSelectedStateId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedCommodityId, setSelectedCommodityId] = useState('1'); // Wheat by default
  const [selectedMarketId, setSelectedMarketId] = useState('');

  const [loading, setLoading] = useState(false);
  const [priceData, setPriceData] = useState(null);

  // Load initial states and commodities on mount
  useEffect(() => {
    async function loadMeta() {
      try {
        const [statesRes, commRes] = await Promise.all([
          apiClient.getMandiStates(),
          apiClient.getMandiCommodities()
        ]);
        if (statesRes.success && statesRes.data) {
          setStates(statesRes.data);
          if (statesRes.data.length > 0) {
            setSelectedStateId(String(statesRes.data[0].id));
          }
        }
        if (commRes.success && commRes.data) {
          setCommodities(commRes.data);
        }
      } catch (err) {
        console.error('Failed to load Mandi catalog:', err);
      }
    }
    loadMeta();
  }, []);

  // When state changes, fetch its districts and markets
  useEffect(() => {
    if (!selectedStateId) return;

    async function loadDistrictsAndMarkets() {
      try {
        const [distRes, mktRes] = await Promise.all([
          apiClient.getMandiDistricts(selectedStateId),
          apiClient.getMandiMarkets(selectedStateId, selectedCommodityId)
        ]);

        if (distRes.success && distRes.data) {
          setDistricts(distRes.data);
          setSelectedDistrictId(distRes.data.length > 0 ? String(distRes.data[0].id) : '');
        }
        if (mktRes.success && mktRes.data) {
          setMarkets(mktRes.data);
          setSelectedMarketId(mktRes.data.length > 0 ? String(mktRes.data[0].id) : '');
        }
      } catch (err) {
        console.error('Failed to load districts/markets:', err);
      }
    }

    loadDistrictsAndMarkets();
  }, [selectedStateId, selectedCommodityId]);

  const handleSearch = async (cId = selectedCommodityId, sId = selectedStateId, mId = selectedMarketId) => {
    setLoading(true);
    setPriceData(null);

    const stObj = states.find(s => String(s.id) === String(sId));
    const commObj = commodities.find(c => String(c.id) === String(cId));
    const mktObj = markets.find(m => String(m.id) === String(mId));

    try {
      const res = await apiClient.getMandiPrices({
        stateId: sId,
        commodityId: cId,
        marketId: mId || 1,
        state: stObj ? stObj.name : '',
        crop: commObj ? commObj.name : '',
        market: mktObj ? mktObj.name : ''
      });

      if (res.success) {
        setPriceData(res);
      }
    } catch (err) {
      console.error('Mandi price lookup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-purple-600 p-[1.5px] shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-[#0B1020] rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>{t.mandiTitle}</span>
              <span className="badge-neon-green text-xs font-bold px-2.5 py-0.5 rounded-full">
                Agmarknet 2.0 Live
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
              {t.mandiSubtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Popular Crop Pills */}
      <div className="mb-6">
        <p className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Sprout className="w-3.5 h-3.5 text-cyan-400" />
          <span>Quick Select Agricultural Staples:</span>
        </p>
        <div className="flex flex-wrap gap-2.5">
          {popularCrops.map((crop) => {
            const isSelected = String(selectedCommodityId) === String(crop.id);
            return (
              <button
                key={crop.id}
                onClick={() => {
                  setSelectedCommodityId(crop.id);
                  handleSearch(crop.id, selectedStateId, selectedMarketId);
                }}
                className={`text-xs px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                  isSelected
                    ? 'nav-tab-active'
                    : 'glass-card text-slate-300 hover:text-white hover:border-cyan-400'
                }`}
              >
                <span>{crop.icon}</span>
                <span>{crop.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cascading Filter Controls Glass Panel */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-xl mb-8 border border-white/10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Commodity Dropdown */}
          <div>
            <label className="block text-xs font-extrabold text-cyan-300 uppercase tracking-wider mb-2">
              {t.selectCrop}
            </label>
            <select
              value={selectedCommodityId}
              onChange={(e) => setSelectedCommodityId(e.target.value)}
              className="w-full text-sm cyber-select px-3.5 py-2.5 font-medium"
            >
              {commodities.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* State Dropdown */}
          <div>
            <label className="block text-xs font-extrabold text-cyan-300 uppercase tracking-wider mb-2">
              {t.selectState}
            </label>
            <select
              value={selectedStateId}
              onChange={(e) => setSelectedStateId(e.target.value)}
              className="w-full text-sm cyber-select px-3.5 py-2.5 font-medium"
            >
              {states.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* District Dropdown */}
          <div>
            <label className="block text-xs font-extrabold text-cyan-300 uppercase tracking-wider mb-2">
              {t.selectDistrict}
            </label>
            <select
              value={selectedDistrictId}
              onChange={(e) => setSelectedDistrictId(e.target.value)}
              className="w-full text-sm cyber-select px-3.5 py-2.5 font-medium"
            >
              {districts.length === 0 ? (
                <option value="">All Districts in State</option>
              ) : (
                districts.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} {d.hindi_name ? `(${d.hindi_name})` : ''}</option>
                ))
              )}
            </select>
          </div>

          {/* Market Dropdown */}
          <div>
            <label className="block text-xs font-extrabold text-cyan-300 uppercase tracking-wider mb-2">
              {t.selectMarket}
            </label>
            <select
              value={selectedMarketId}
              onChange={(e) => setSelectedMarketId(e.target.value)}
              className="w-full text-sm cyber-select px-3.5 py-2.5 font-medium"
            >
              {markets.length === 0 ? (
                <option value="">Primary APMC Yard</option>
              ) : (
                markets.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Search Action Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="btn-cyber-primary disabled:opacity-50 text-white px-7 py-3 rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer shadow-lg"
          >
            <Search className="w-4 h-4 text-cyan-300" />
            <span>{loading ? 'Interrogating Agmarknet 2.0...' : t.searchPricesBtn}</span>
          </button>
        </div>
      </div>

      {/* Results Display Area */}
      {priceData && (
        <div className="space-y-6">
          {priceData.found ? (
            <div className="space-y-5">
              {/* Result Header Badge */}
              <div className="glass-panel border border-cyan-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-violet-950/40 via-cyan-950/30 to-slate-900/40">
                <div>
                  <h3 className="font-extrabold text-white text-xl tracking-tight">
                    {priceData.commodity} Rates — <span className="text-cyan-300">{priceData.state}</span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 font-semibold flex items-center gap-2">
                    <span>APMC Yard: <strong className="text-white">{priceData.market}</strong></span>
                    <span>•</span>
                    <span>Source: {priceData.prices[0]?.source || 'Agmarknet 2.0 (MoA&FW)'}</span>
                  </p>
                </div>
                <span className="badge-neon-green text-xs px-3.5 py-1.5 rounded-full font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <span>DMI Government Data</span>
                </span>
              </div>

              {/* Price Cards Grid with Range Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {priceData.prices.map((p, idx) => {
                  const range = p.max_price - p.min_price;
                  const percent = range > 0 ? Math.min(100, Math.max(10, ((p.modal_price - p.min_price) / range) * 100)) : 50;

                  return (
                    <div key={idx} className="glass-card rounded-3xl p-6 shadow-md flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center text-xs mb-3">
                          <span className="font-bold text-cyan-300 bg-white/5 border border-cyan-500/30 px-3 py-1 rounded-full">
                            {p.variety || 'Standard FAQ'}
                          </span>
                          <span className="flex items-center gap-1.5 font-semibold text-slate-400">
                            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                            {p.arrival_date || p.date}
                          </span>
                        </div>

                        {/* Modal Price Highlight */}
                        <div className="my-4">
                          <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">{t.modalPrice}</p>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-4xl sm:text-5xl font-extrabold text-gradient-cyan">₹{p.modal_price}</span>
                            <span className="text-xs font-bold text-slate-400">/ Quintal</span>
                          </div>
                        </div>

                        {/* Range Visualizer Meter */}
                        <div className="my-5 space-y-1.5">
                          <div className="flex justify-between text-[11px] font-bold text-slate-400">
                            <span>Min: <strong className="text-white">₹{p.min_price}</strong></span>
                            <span>Max: <strong className="text-white">₹{p.max_price}</strong></span>
                          </div>
                          <div className="cyber-gauge-bg">
                            <div className="cyber-gauge-fill" style={{ width: `${percent}%` }}></div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 font-medium">
                        <span>Unit: Rs / 100 Kg</span>
                        <a
                          href="https://agmarknet.gov.in"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-300 hover:text-white font-bold flex items-center gap-1 transition"
                        >
                          <span>Official Agmarknet</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Honest Coverage Notice Card */
            <div className="glass-panel border border-amber-500/40 rounded-3xl p-7 bg-amber-950/20 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-300 flex-shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-extrabold text-amber-300 text-lg">{t.coverageNotice}</h4>
                  <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">{priceData.message}</p>

                  {priceData.nearby_or_reporting_markets && priceData.nearby_or_reporting_markets.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-white/10">
                      <p className="text-xs font-extrabold text-amber-300 mb-3 uppercase tracking-wider">
                        {t.nearbyReportingMarkets}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {priceData.nearby_or_reporting_markets.map((mkt, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-white/5 text-amber-200 font-bold px-3 py-1.5 rounded-xl border border-amber-500/30 flex items-center gap-1.5 shadow-xs hover:border-amber-400 transition cursor-pointer"
                          >
                            <span>📍</span>
                            <span>{mkt}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-5">
                    <a
                      href="https://agmarknet.gov.in"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-extrabold text-cyan-300 hover:text-white group transition"
                    >
                      <span>Check full national bulletin on Agmarknet official portal</span>
                      <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
