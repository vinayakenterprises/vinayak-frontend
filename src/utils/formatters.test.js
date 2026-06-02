import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, truncateText } from './formatters';

describe('formatters utility', () => {
  describe('formatCurrency', () => {
    it('formats numbers into USD by default', () => {
      const formatted = formatCurrency(1234.56).replace(/\u00A0/g, ' ');
      expect(formatted).toBe('$1,234.56');
    });

    it('formats different currencies and locales', () => {
      const formattedEUR = formatCurrency(100, 'EUR', 'de-DE').replace(/\u00A0/g, ' ');
      expect(formattedEUR).toContain('100');
      expect(formattedEUR).toContain('€');
    });

    it('returns empty string for invalid values', () => {
      expect(formatCurrency(null)).toBe('');
      expect(formatCurrency(undefined)).toBe('');
      expect(formatCurrency(NaN)).toBe('');
    });
  });

  describe('formatDate', () => {
    it('formats a date correctly', () => {
      const date = new Date('2026-06-02T12:00:00Z');
      const formatted = formatDate(date, 'en-US', { timeZone: 'UTC' });
      expect(formatted).toBe('Jun 2, 2026');
    });

    it('returns empty string for invalid date inputs', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate('invalid-date')).toBe('');
    });
  });

  describe('truncateText', () => {
    it('does not truncate if text is shorter than maxLength', () => {
      expect(truncateText('Hello', 10)).toBe('Hello');
    });

    it('truncates text and appends suffix if longer than maxLength', () => {
      expect(truncateText('Hello World', 5)).toBe('Hello...');
      expect(truncateText('Hello World', 5, ' (more)')).toBe('Hello (more)');
    });

    it('returns empty string for empty inputs', () => {
      expect(truncateText(null)).toBe('');
      expect(truncateText('')).toBe('');
    });
  });
});
