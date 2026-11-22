class FarmerRelevanceService {
  constructor() {
    // Explicit positive indicators directly relevant to agriculture, crops, and farmers
    this.agriKeywords = [
      'kisan', 'farmer', 'krishi', 'fasal', 'mandi', 'apmc', 'crop', 'harvest',
      'agriculture', 'agricultural', 'farming', 'agronomy', 'horticulture', 'floriculture',
      'sericulture', 'apiculture', 'soil health', 'irrigation', 'fertilizer', 'pesticide',
      'seeds', 'seed subsidy', 'tractor', 'pm-kisan', 'pmkisan', 'pmfby', 'kisan credit card',
      'kcc', 'rashtriya krishi vikas', 'rkvy', 'per drop more crop', 'organic farming',
      'jaivik kheti', 'animal husbandry', 'pashupalan', 'dairy farming', 'poultry', 'fisheries',
      'matsya', 'icar', 'asrb', 'krishi vigyan kendra', 'kvk', 'subject matter specialist',
      'agri extension', 'agriculture officer', 'gram sevak', 'patwari krishi', 'village agriculture assistant',
      'technical officer agriculture', 'farm manager', 'soil chemist', 'seed analyst', 'mandi bhav',
      'minimum support price', 'msp', 'fpo', 'farmer producer organisation', 'drip irrigation'
    ];

    // Explicit disqualifiers: generic government jobs, civil services, defense, politics, entertainment
    this.disqualifiers = [
      'ssc cgl', 'ssc chsl', 'ssc gd constable', 'railway recruitment', 'rrb ntpc',
      'railway group d', 'banking po', 'ibps clerk', 'sbi clerk', 'delhi police',
      'constable recruitment', 'income tax inspector', 'customs officer', 'upsc cse',
      'nda exam', 'cds exam', 'air force group', 'navy sailor', 'entertainment',
      'box office', 'bollywood', 'cricket match', 'celebrity wedding', 'fashion week',
      'commercial real estate', 'crypto currency', 'stock trading tips', 'casino'
    ];
  }

  evaluateRelevance(item) {
    const textToAnalyze = `${item.title || ''} ${item.summary || ''} ${item.eligibility || ''} ${item.benefits || ''}`.toLowerCase();

    // Check for explicit disqualifiers
    for (const disq of this.disqualifiers) {
      if (textToAnalyze.includes(disq)) {
        return {
          isRelevant: false,
          score: 0.05,
          reason: `Excluded due to generic/unrelated notification term: "${disq}". AgriNexa strictly filters out generic non-agricultural posts.`
        };
      }
    }

    // Calculate agricultural keyword match intensity
    let matchCount = 0;
    const matchedTerms = [];

    for (const kw of this.agriKeywords) {
      if (textToAnalyze.includes(kw)) {
        matchCount++;
        matchedTerms.push(kw);
      }
    }

    if (item.category === 'farmer_vacancy') {
      // Stricter check for vacancies: must be an agricultural role, not just any job
      const isAgriRole = matchedTerms.some(t => [
        'icar', 'asrb', 'agriculture', 'agricultural', 'krishi', 'horticulture', 'agronomy',
        'kvk', 'krishi vigyan kendra', 'farm manager', 'soil health', 'agri extension',
        'veterinary', 'pashupalan', 'fisheries', 'subject matter specialist'
      ].includes(t));

      if (!isAgriRole || matchCount < 1) {
        return {
          isRelevant: false,
          score: 0.1,
          reason: 'Vacancy lacks verifiable agricultural or farm-support qualification requirements. AgriNexa only publishes agriculture-specific roles.'
        };
      }

      return {
        isRelevant: true,
        score: Math.min(1.0, 0.7 + matchCount * 0.1),
        reason: `Verified agricultural vacancy: matched role keywords [${matchedTerms.slice(0, 4).join(', ')}] from official agricultural source.`
      };
    }

    // Schemes and services
    if (matchCount >= 1) {
      return {
        isRelevant: true,
        score: Math.min(1.0, 0.6 + matchCount * 0.1),
        reason: `Verified farmer scheme/service: identified direct agriculture keywords [${matchedTerms.slice(0, 4).join(', ')}].`
      };
    }

    return {
      isRelevant: false,
      score: 0.2,
      reason: 'No verifiable farmer or agriculture support indicators found in the official text.'
    };
  }
}

module.exports = new FarmerRelevanceService();
