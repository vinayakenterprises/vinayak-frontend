import { describe, it, expect } from 'vitest';
import { formatToIST } from './helper-functions';

describe('helper-functions utility', () => {
  describe('formatToIST', () => {
    it('returns N/A for null/undefined/empty string', () => {
      expect(formatToIST(null)).toBe('N/A');
      expect(formatToIST(undefined)).toBe('N/A');
      expect(formatToIST('')).toBe('N/A');
    });

    it('formats UTC ISO strings (ending with Z) correctly', () => {
      const result = formatToIST('2026-06-22T08:28:09.015Z');
      expect(result).toBe('22/06/2026, 01:58 pm');
    });

    it('formats strings with numeric offset (+00:00) correctly', () => {
      const result = formatToIST('2026-06-22T09:15:33.865231+00:00');
      expect(result).toBe('22/06/2026, 02:45 pm');
    });

    it('formats local Date objects correctly without shifting timezone', () => {
      const date = new Date('2026-06-30T17:02:00+05:30');
      const result = formatToIST(date);
      expect(result).toBe('30/06/2026, 05:02 pm');
    });

    it('returns original or N/A for invalid date strings', () => {
      expect(formatToIST('invalid-date')).toBe('N/A');
    });
  });
});
