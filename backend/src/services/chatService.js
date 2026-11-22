const https = require('https');
const config = require('../config');
const ragRetrievalService = require('./ragRetrievalService');
const mandiSearchService = require('./mandi/mandiSearchService');

class ChatService {
  detectLanguage(text) {
    const hindiRegex = /[\u0900-\u097F]/;
    if (hindiRegex.test(text)) return 'hi';

    // Hinglish indicators
    const hinglishTerms = ['kya', 'hai', 'batao', 'kaise', 'milega', 'kaunsi', 'kaun', 'rate', 'bhav', 'kisan', 'kisano', 'mandi', 'gehun', 'chawal', 'mein', 'ke'];
    const words = text.toLowerCase().split(/\s+/);
    const matches = words.filter(w => hinglishTerms.includes(w));
    if (matches.length >= 2) return 'hi';

    return 'en';
  }

  extractEntities(query) {
    const text = query.toLowerCase();

    // 1. Category extraction
    let intent = 'general';
    if (text.includes('mandi') || text.includes('bhav') || text.includes('rate') || text.includes('price') || text.includes('bhaav')) {
      intent = 'mandi_price';
    } else if (text.includes('vacancy') || text.includes('vacancies') || text.includes('job') || text.includes('jobs') || text.includes('recruitment') || text.includes('naukri') || text.includes('post') || text.includes('posts') || text.includes('bharti') || text.includes('icar') || text.includes('asrb')) {
      intent = 'vacancy';
    } else if (text.includes('scheme') || text.includes('schemes') || text.includes('yojana') || text.includes('yojna') || text.includes('subsidy') || text.includes('subsidies') || text.includes('pm-kisan') || text.includes('pmkisan') || text.includes('fasal bima') || text.includes('kcc') || text.includes('loan')) {
      intent = 'scheme';
    }

    // 2. Crop extraction
    const crops = [
      { key: 'soybean', names: ['soybean', 'soyabean', 'soya'] },
      { key: 'wheat', names: ['wheat', 'gehun', 'gehu'] },
      { key: 'paddy', names: ['paddy', 'dhan', 'rice', 'chawal'] },
      { key: 'cotton', names: ['cotton', 'kapas'] },
      { key: 'mustard', names: ['mustard', 'sarson', 'rai'] },
      { key: 'chana', names: ['chana', 'gram', 'chane'] },
      { key: 'maize', names: ['maize', 'makka', 'makai'] },
      { key: 'onion', names: ['onion', 'pyaz', 'kanda'] },
      { key: 'potato', names: ['potato', 'aloo'] },
      { key: 'tomato', names: ['tomato', 'tamatar'] }
    ];

    let extractedCrop = null;
    for (const c of crops) {
      if (c.names.some(n => text.includes(n))) {
        extractedCrop = c.key;
        break;
      }
    }

    // 3. State extraction
    const states = [
      'madhya pradesh', 'mp', 'maharashtra', 'rajasthan', 'punjab', 'haryana',
      'uttar pradesh', 'up', 'gujarat', 'bihar', 'karnataka', 'andhra pradesh',
      'tamil nadu', 'telangana', 'west bengal', 'odisha', 'chhattisgarh'
    ];
    let extractedState = null;
    for (const s of states) {
      if (text.includes(s)) {
        if (s === 'mp') extractedState = 'Madhya Pradesh';
        else if (s === 'up') extractedState = 'Uttar Pradesh';
        else extractedState = s.charAt(0).toUpperCase() + s.slice(1);
        break;
      }
    }

    // 4. District / Mandi extraction
    const knownMarkets = ['akola', 'indore', 'ujjain', 'nagpur', 'bhopal', 'nashik', 'pune', 'kota', 'jaipur', 'latur', 'kadapa'];
    let extractedMarket = null;
    for (const m of knownMarkets) {
      if (text.includes(m)) {
        extractedMarket = m.charAt(0).toUpperCase() + m.slice(1);
        break;
      }
    }

    return { intent, crop: extractedCrop, state: extractedState, market: extractedMarket };
  }

  async processMessage(userQuery) {
    const lang = this.detectLanguage(userQuery);
    const entities = this.extractEntities(userQuery);

    // If intent is Mandi Price check
    if (entities.intent === 'mandi_price' || (entities.crop && (entities.state || entities.market))) {
      return await this._handleMandiChat(userQuery, entities, lang);
    }

    // For schemes, vacancies, or general queries, use RAG retrieval
    return await this._handleRagChat(userQuery, entities, lang);
  }

  async _handleMandiChat(query, entities, lang) {
    const crop = entities.crop || 'wheat';
    const state = entities.state || 'Madhya Pradesh';
    const market = entities.market || null;

    const priceResult = await mandiSearchService.getPrices({
      crop,
      state,
      market
    });

    const isHindi = lang === 'hi';
    const citations = [];

    if (priceResult.found && priceResult.prices && priceResult.prices.length > 0) {
      const topPrice = priceResult.prices[0];
      citations.push({
        title: `${priceResult.commodity} Mandi Bhav - ${priceResult.state} (${priceResult.market || 'APMC'})`,
        source_name: topPrice.source || 'Agmarknet 2.0 (MoA&FW)',
        source_url: topPrice.source_url || 'https://agmarknet.gov.in',
        date: topPrice.arrival_date || topPrice.date,
        type: 'mandi_price'
      });

      let answer = '';
      if (isHindi) {
        answer = `**${priceResult.state}** की **${priceResult.market || 'मंडी'}** में **${priceResult.commodity}** का भाव:\n\n` +
          `- **मॉडल भाव (Modal Price):** ₹${topPrice.modal_price} / क्विंटल\n` +
          `- **न्यूनतम भाव (Min Price):** ₹${topPrice.min_price} / क्विंटल\n` +
          `- **अधिकतम भाव (Max Price):** ₹${topPrice.max_price} / क्विंटल\n` +
          `- **आवक दिनांक (Date):** ${topPrice.arrival_date || topPrice.date}\n` +
          `- **किस्म (Variety):** ${topPrice.variety || 'Standard FAQ'}\n\n` +
          `*स्रोत: सरकारी कृषि विपणन पोर्टल (Agmarknet 2.0). कृपया व्यापार करने से पहले स्थानीय मंडी समिति से पुष्टि करें।*`;
      } else {
        answer = `Official Mandi Rates for **${priceResult.commodity}** in **${priceResult.state}** (${priceResult.market || 'APMC Market'}):\n\n` +
          `- **Modal Price:** ₹${topPrice.modal_price} per Quintal\n` +
          `- **Minimum Price:** ₹${topPrice.min_price} per Quintal\n` +
          `- **Maximum Price:** ₹${topPrice.max_price} per Quintal\n` +
          `- **Arrival Date:** ${topPrice.arrival_date || topPrice.date}\n` +
          `- **Variety:** ${topPrice.variety || 'Standard FAQ'}\n\n` +
          `*Source: Official Agmarknet (MoA&FW, GoI). Always confirm with the local APMC yard before dispatch.*`;
      }

      return {
        answer,
        citations,
        entities,
        language: lang,
        mandi_data: priceResult
      };
    }

    // No exact price recorded
    let answer = '';
    if (isHindi) {
      answer = `क्षमा करें, **${priceResult.state}** की **${priceResult.market || 'मंडी'}** में **${crop}** के लिए वर्तमान Agmarknet रिपोर्ट में कोई नई आवक या भाव दर्ज नहीं है।\n\n` +
        (priceResult.suggestion ? `💡 **सुझाव:** ${priceResult.suggestion}\n\n` : '') +
        `आप आधिकारिक Agmarknet पोर्टल पर भी सीधे दैनिक बुलेटिन देख सकते हैं।`;
    } else {
      answer = `Currently, no arrival or price entries are reported for **${crop}** in **${priceResult.state}** (${priceResult.market || 'Selected APMC'}) in the official Agmarknet records.\n\n` +
        (priceResult.suggestion ? `💡 **Suggestion:** ${priceResult.suggestion}\n\n` : '') +
        `You can verify reports directly on the official Agmarknet portal.`;
    }

    return {
      answer,
      citations: [{
        title: 'Agmarknet Agricultural Marketing Information Network',
        source_name: 'Directorate of Marketing & Inspection (DMI)',
        source_url: 'https://agmarknet.gov.in',
        date: new Date().toISOString().split('T')[0],
        type: 'coverage_notice'
      }],
      entities,
      language: lang,
      mandi_data: priceResult
    };
  }

  async _handleRagChat(query, entities, lang) {
    const isHindi = lang === 'hi';
    const category = entities.intent === 'vacancy' ? 'farmer_vacancy' : (entities.intent === 'scheme' ? 'scheme' : null);

    const retrievedDocs = await ragRetrievalService.retrieve(query, {
      category,
      state: entities.state,
      limit: 4
    });

    const citations = retrievedDocs.map(d => ({
      title: d.title,
      source_name: d.source_name,
      source_url: d.source_url,
      date: d.announcement_date,
      category: d.category,
      eligibility: d.eligibility,
      application_link: d.application_link,
      status: d.status
    }));

    if (retrievedDocs.length === 0) {
      // For scheme or vacancy intents keep the original fallback.
      if (category) {
        const fallbackMsg = isHindi
          ? 'आपके द्वारा पूछे गए विषय के लिए हमारे सत्यापित सरकारी रिकॉर्ड में वर्तमान में कोई आधिकारिक योजना या कृषि रिक्ति नहीं मिली। कृपया अपने नजदीकी कृषि विज्ञान केंद्र (KVK) या राज्य कृषि विभाग से संपर्क करें।'
          : 'No verified official farmer schemes or agricultural vacancies matching your query were found in our current verified index. Please check back after the next scheduled sync or verify with your local Krishi Vigyan Kendra.';
        
        return {
          answer: fallbackMsg,
          citations: [],
          entities,
          language: lang
        };
      }
      // For general agricultural queries, proceed without early fallback – Gemini will be invoked (even with empty docs).
    }

    // If an external LLM is configured (e.g. Gemini), query it with grounded context
    if (config.GEMINI_API_KEY && config.LLM_PROVIDER === 'gemini') {
      try {
        const llmAnswer = await this._callGeminiChat(query, retrievedDocs, lang);
        if (llmAnswer) {
          return {
            answer: llmAnswer,
            citations,
            entities,
            language: lang
          };
        }
      } catch (err) {
        console.warn('Gemini chat generation failed, using deterministic grounded answer:', err.message);
      }
    }

    // Grounded deterministic response based on retrieved authoritative records
    let answer = '';
    if (isHindi) {
      answer = `सत्यापित आधिकारिक रिकॉर्ड्स के अनुसार जानकारी:\n\n`;
      retrievedDocs.forEach((doc, idx) => {
        answer += `### ${idx + 1}. ${doc.title}\n`;
        answer += `${doc.summary}\n\n`;
        if (doc.eligibility) answer += `- **पात्रता (Eligibility):** ${doc.eligibility}\n`;
        if (doc.benefits) answer += `- **लाभ / लाभ राशि:** ${doc.benefits}\n`;
        if (doc.application_deadline) answer += `- **अंतिम तिथि (Deadline):** ${doc.application_deadline}\n`;
        if (doc.application_link) answer += `- **आधिकारिक आवेदन लिंक:** [यहाँ क्लिक करें](${doc.application_link})\n`;
        answer += `- **स्थिति:** ${doc.status === 'active' ? '🟢 सक्रिय (Active)' : '🔴 बंद/अज्ञात'}\n\n`;
      });
      answer += `*कृपया आवेदन करने से पहले दिए गए आधिकारिक सरकारी लिंक से सभी नियमों की पुष्टि अवश्य कर लें।*`;
    } else {
      answer = `Based on verified official government records:\n\n`;
      retrievedDocs.forEach((doc, idx) => {
        answer += `### ${idx + 1}. ${doc.title}\n`;
        answer += `${doc.summary}\n\n`;
        if (doc.eligibility) answer += `- **Eligibility:** ${doc.eligibility}\n`;
        if (doc.benefits) answer += `- **Benefits:** ${doc.benefits}\n`;
        if (doc.application_deadline) answer += `- **Application Deadline:** ${doc.application_deadline}\n`;
        if (doc.application_link) answer += `- **Official Portal:** [Apply / View Details](${doc.application_link})\n`;
        answer += `- **Status:** ${doc.status === 'active' ? '🟢 Active' : '🔴 Closed/Pending'}\n\n`;
      });
      answer += `*Note: Farmers should always verify critical eligibility details on the linked official government portal.*`;
    }

    return {
      answer,
      citations,
      entities,
      language: lang
    };
  }

  _callGeminiChat(query, docs, lang) {
    return new Promise((resolve, reject) => {
      const contextText = docs.map((d, i) => `[Source ${i+1}] Title: ${d.title}\nSummary: ${d.summary}\nEligibility: ${d.eligibility}\nBenefits: ${d.benefits}\nOfficial Link: ${d.application_link}\nDate: ${d.announcement_date}`).join('\n\n');

      const systemPrompt = `You are AgriNexa AI, a trustworthy, helpful agricultural assistant for Indian farmers.
Language requested: ${lang === 'hi' ? 'Hindi' : 'English'}.
Strict instructions:
1. Base your answer EXCLUSIVELY on the retrieved official records below.
2. NEVER hallucinate eligibility, dates, rates, or application links.
3. If the user asks in Hindi, answer in clear, respectful, easy-to-understand Hindi.
4. Always cite the official source name and link.
5. If the retrieved records do not answer the query, clearly state that verified official data is not available.

Context:
${contextText}`;

      const payload = JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\nFarmer Question: ${query}` }] }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 800
        }
      });

      const req = https.request({
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/${config.GEMINI_MODEL}:generateContent?key=${config.GEMINI_API_KEY}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        },
        timeout: 10000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.candidates && parsed.candidates[0] && parsed.candidates[0].content) {
              resolve(parsed.candidates[0].content.parts[0].text);
            } else {
              reject(new Error('Invalid response from Gemini'));
            }
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Gemini API timeout'));
      });

      req.write(payload);
      req.end();
    });
  }
}

module.exports = new ChatService();
