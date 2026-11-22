import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ExternalLink, Sparkles, CheckCircle2, ShieldCheck, ArrowRight, RefreshCw, Cpu, Landmark, Briefcase, TrendingUp, Coins, Layers, Sprout } from 'lucide-react';
import { translations } from '../i18n/translations';
import { apiClient } from '../api/client';

export default function AskAgriNexa({ lang }) {
  const t = translations[lang];
  const messagesEndRef = useRef(null);

  // 6 Curated Futuristic Question Cards matching Section 8
  const suggestedQuestionCards = [
    {
      text: lang === 'hi' ? "मध्य प्रदेश और देश में किसानों के लिए कौन सी नई सरकारी योजनाएं आई हैं?" : "What are the latest government schemes for farmers across India?",
      label: lang === 'hi' ? "सरकारी योजनाएं (Schemes)" : "Government Schemes",
      subtitle: lang === 'hi' ? "PM-KISAN, सब्सिडी, सिंचाई योजना" : "Subsidies, PM-KISAN, Irrigation",
      icon: Sprout,
      gradient: "from-violet-600 to-cyan-500"
    },
    {
      text: lang === 'hi' ? "अभी agriculture-related farmer vacancies और ICAR भर्तियां कौन सी खुली हैं?" : "What agricultural and farmer-related vacancies are currently open?",
      label: lang === 'hi' ? "कृषि भर्तियां (Agri Vacancies)" : "Agricultural Vacancies",
      subtitle: lang === 'hi' ? "ICAR, KVK, कृषि वैज्ञानिक पद" : "ICAR, KVK, Subject Specialists",
      icon: Briefcase,
      gradient: "from-blue-600 to-purple-600"
    },
    {
      text: "Soybean ka rate Maharashtra ke Akola mandi mein kya hai?",
      label: lang === 'hi' ? "सोयाबीन मंडी भाव (Soybean Rate)" : "Soybean Mandi Rates",
      subtitle: lang === 'hi' ? "अकोला व महाराष्ट्र एपीएमसी भाव" : "Akola & Maharashtra APMC Prices",
      icon: TrendingUp,
      gradient: "from-cyan-500 to-teal-400"
    },
    {
      text: "Indore district ki aaj ki mandi mein gehun ka rate batao.",
      label: lang === 'hi' ? "गेहूं का ताजा भाव (Wheat Price)" : "Wheat Mandi Prices",
      subtitle: lang === 'hi' ? "इंदौर व नजदीकी मंडियों के दाम" : "Indore & Regional APMC Prices",
      icon: Coins,
      gradient: "from-amber-500 to-yellow-400"
    },
    {
      text: "PM-KISAN ke liye eligibility aur official apply link kya hai?",
      label: lang === 'hi' ? "PM-KISAN पात्रता व आवेदन" : "PM-KISAN Eligibility & Apply",
      subtitle: lang === 'hi' ? "₹6,000 वार्षिक DBT डायरेक्ट ट्रांसफर" : "₹6,000/yr Direct Benefit Transfer",
      icon: Landmark,
      gradient: "from-purple-600 to-pink-500"
    },
    {
      text: "Rajasthan mein chana ka mandi bhav kis mandi mein achha hai?",
      label: lang === 'hi' ? "चना भाव तुलना (Chana Bhav)" : "Compare Crop Mandi Prices",
      subtitle: lang === 'hi' ? "राजस्थान की सक्रिय मंडियों की तुलना" : "Compare Top Reporting Mandis",
      icon: Layers,
      gradient: "from-emerald-500 to-cyan-500"
    }
  ];

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: lang === 'hi' 
        ? '🌾 **नमस्ते! एग्रीनेक्सा AI में आपका स्वागत है।**\n\nमैं भारत सरकार के कृषि एवं किसान कल्याण मंत्रालय, **Agmarknet 2.0 लाइव टेलीमेट्री** और **ICAR आधिकारिक भर्ती पोर्टल्स** से सीधे जुड़ा हुआ AI इंजन हूँ।\n\nआप मुझसे बिना किसी भ्रम के सटीक **सरकारी योजनाएं, सब्सिडी, आवेदन लिंक, कृषि नौकरियां** या **लाइव मंडी भाव** पूछ सकते हैं।'
        : '🌾 **Namaste! Welcome to AgriNexa AI.**\n\nI am an advanced agricultural intelligence engine directly integrated with the Ministry of Agriculture & Farmers Welfare, **live Agmarknet 2.0 telemetry**, and **ICAR official career portals**.\n\nYou can inquire about **verified government schemes, subsidies, application links, agricultural vacancies**, or **authoritative APMC mandi prices** across India.',
      citations: []
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (queryText = input) => {
    const textToSend = queryText.trim();
    if (!textToSend || loading) return;

    const userMsg = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const data = await apiClient.sendChatMessage(textToSend);
      if (data.success) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: data.answer,
            citations: data.citations || [],
            mandi_data: data.mandi_data || null
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: 'Error communicating with AgriNexa Neural Engine. Please verify your connection and retry.',
            citations: []
          }
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Unable to connect to AgriNexa API gateway. Please ensure the backend server is operational.',
          citations: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Futuristic Hero Landing Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-9 shadow-lg mb-8 border border-white/10 relative overflow-hidden group">
        {/* Ambient Neon Highlights */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-600/20 via-cyan-500/15 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-purple-600/20 to-transparent rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            {/* Holographic Glowing AI Avatar */}
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-500 to-cyan-400 p-[2px] shadow-lg shadow-purple-500/40 animate-pulse-glow">
                <div className="w-full h-full bg-[#0B1020] rounded-2xl flex items-center justify-center">
                  <Cpu className="w-8 h-8 text-cyan-400" />
                </div>
              </div>
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {lang === 'hi' ? 'नमस्ते! एग्रीनेक्सा AI में आपका स्वागत है' : 'Namaste! Welcome to AgriNexa AI'}
                </h2>
                <span className="badge-neon-purple text-xs font-bold px-3 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>RAG + Neural LLM</span>
                </span>
                <span className="badge-neon-green text-xs font-bold px-2.5 py-0.5 rounded-full">
                  GoI Verified Telemetry
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {t.chatWelcomeDesc}
              </p>
            </div>
          </div>
        </div>

        {/* 6 Curated Glass Question Cards */}
        <div className="relative z-10 mt-6">
          <p className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.chatSuggestedPromptTitle}</span>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {suggestedQuestionCards.map((q, idx) => {
              const IconComponent = q.icon;
              return (
                <div
                  key={idx}
                  onClick={() => handleSend(q.text)}
                  className="question-card group"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${q.gradient} p-2 flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition duration-300`}>
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white group-hover:text-cyan-300 transition line-clamp-1">
                      {q.label}
                    </p>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {q.subtitle}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition flex-shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Messages Thread Container */}
      <div className="space-y-6 mb-6">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start gap-3.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 p-[1.5px] flex-shrink-0 shadow-lg shadow-purple-500/25">
                <div className="w-full h-full bg-[#0B1020] rounded-2xl flex items-center justify-center">
                  <Bot className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
            )}

            <div
              className={`max-w-[88%] rounded-3xl p-5 sm:p-6 transition ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white rounded-tr-none shadow-lg shadow-purple-600/30 border border-white/20'
                  : 'glass-panel rounded-tl-none border border-white/10 text-slate-200'
              }`}
            >
              {/* Message Header for AI */}
              {msg.role === 'assistant' && (
                <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-white/10">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>AgriNexa Verified Response</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium badge-neon-purple px-2 py-0.5 rounded-full">
                    Grounded in GoI Records
                  </span>
                </div>
              )}

              {/* Message Body */}
              <div className="text-sm leading-relaxed whitespace-pre-line space-y-2.5 font-normal">
                {msg.content}
              </div>

              {/* Grounded Citation Source Cards */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-5 pt-4 border-t border-white/10">
                  <p className="text-xs font-extrabold text-cyan-300 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    <span>{t.citationsTitle}</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {msg.citations.map((cite, cIdx) => (
                      <div
                        key={cIdx}
                        className="bg-white/[0.04] border border-cyan-500/30 rounded-2xl p-3.5 text-xs text-slate-300 flex flex-col justify-between hover:border-cyan-400 hover:bg-white/[0.07] transition shadow-xs"
                      >
                        <div>
                          <p className="font-bold text-white line-clamp-1 text-xs">{cite.title}</p>
                          <p className="text-[11px] text-cyan-400 font-medium mt-1">
                            {cite.source_name} • {cite.date || 'Active'}
                          </p>
                        </div>
                        {cite.source_url && (
                          <a
                            href={cite.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300 hover:text-white transition group"
                          >
                            <span>Open Official Source</span>
                            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-700 to-slate-900 border border-white/10 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                <User className="w-5 h-5 text-cyan-300" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 text-cyan-300 text-sm font-semibold glass-panel p-4 rounded-2xl border border-cyan-500/30 max-w-md shadow-lg shadow-cyan-500/10">
            <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
            <span>Consulting official government datasets & indexing grounded citations...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Futuristic Glass Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="sticky bottom-4 glass-panel p-2 rounded-2xl shadow-2xl border border-white/15 flex items-center gap-2 z-20 backdrop-blur-2xl"
      >
        <div className="pl-3 text-slate-400">
          <Sparkles className="w-4 h-4 text-cyan-400" />
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.chatPlaceholder}
          disabled={loading}
          className="flex-1 px-3 py-3 text-sm bg-transparent outline-none text-white placeholder-slate-400 font-medium"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn-cyber-primary disabled:opacity-40 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer shadow-md"
        >
          <span>{t.sendBtn}</span>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
