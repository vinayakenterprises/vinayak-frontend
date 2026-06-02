/**
 * Formats a numeric value into a currency string.
 * 
 * @param {number} value - The numeric value to format
 * @param {string} [currency='USD'] - The ISO currency code
 * @param {string} [locale='en-US'] - The locale code
 * @returns {string}
 */
export const formatCurrency = (value, currency = 'USD', locale = 'en-US') => {
  if (value === null || value === undefined || isNaN(value)) return '';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value);
};

/**
 * Formats a Date object or timestamp into a readable date string.
 * 
 * @param {Date|string|number} date - The date to format
 * @param {string} [locale='en-US'] - The locale code
 * @param {Object} [options] - Intl.DateTimeFormat options
 * @returns {string}
 */
export const formatDate = (date, locale = 'en-US', options = {}) => {
  if (!date) return '';
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return '';

  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };

  return new Intl.DateTimeFormat(locale, defaultOptions).format(parsedDate);
};

/**
 * Truncates a string to a given length and appends a suffix.
 * 
 * @param {string} text - The input string
 * @param {number} [maxLength=100] - The maximum allowed length
 * @param {string} [suffix='...'] - The suffix to append
 * @returns {string}
 */
export const truncateText = (text, maxLength = 100, suffix = '...') => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + suffix;
};
