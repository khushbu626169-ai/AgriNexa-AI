const { URL } = require('url');

const TRUSTED_DOMAINS = [
  'gov.in',
  'nic.in',
  'icar.org.in',
  'asrb.org.in',
  'agricoop.nic.in',
  'pmkisan.gov.in',
  'fasalvima.gov.in',
  'agmarknet.gov.in',
  'data.gov.in',
  'myscheme.gov.in',
  'nabard.org',
  'soilhealth.dac.gov.in',
  'dbtbharat.gov.in',
  'enam.gov.in',
  'krishi.maharashtra.gov.in',
  'mpkrishi.org',
  'upagripardarshi.gov.in'
];

class SourceValidationService {
  isOfficialDomain(urlStr) {
    try {
      const parsed = new URL(urlStr);
      const host = parsed.hostname.toLowerCase();

      return TRUSTED_DOMAINS.some(trusted => {
        return host === trusted || host.endsWith('.' + trusted);
      });
    } catch {
      return false;
    }
  }

  normalizeCanonicalUrl(urlStr) {
    try {
      const parsed = new URL(urlStr);
      // Strip common analytics and tracking parameters
      const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'ref'];
      trackingParams.forEach(p => parsed.searchParams.delete(p));

      // Remove trailing slash if path is longer than /
      let cleanPath = parsed.pathname;
      if (cleanPath.length > 1 && cleanPath.endsWith('/')) {
        cleanPath = cleanPath.slice(0, -1);
      }

      return `${parsed.protocol}//${parsed.hostname.toLowerCase()}${cleanPath}${parsed.search ? parsed.search : ''}`;
    } catch {
      return urlStr.trim().toLowerCase();
    }
  }

  validateSourceItem(item) {
    const errors = [];

    if (!item.title || item.title.trim().length < 5) {
      errors.push('Title is missing or too short');
    }
    if (!item.source_url) {
      errors.push('Source URL is missing');
    } else if (!this.isOfficialDomain(item.source_url)) {
      errors.push(`Source URL ${item.source_url} does not belong to an official or trusted government/institution domain`);
    }
    if (!item.category || !['scheme', 'farmer_vacancy', 'agri_service'].includes(item.category)) {
      errors.push(`Invalid category: ${item.category}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      canonicalUrl: item.source_url ? this.normalizeCanonicalUrl(item.source_url) : ''
    };
  }
}

module.exports = new SourceValidationService();
