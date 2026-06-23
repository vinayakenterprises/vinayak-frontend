import { describe, it, expect } from 'vitest';
import { formatToIST, calculateTenderSLAs } from './helper-functions';

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

  describe('calculateTenderSLAs', () => {
    it('returns null if tender is not defined', () => {
      expect(calculateTenderSLAs(null)).toBeNull();
    });

    it('calculates NA status for missing baseline dates', () => {
      const tender = {};
      const slas = calculateTenderSLAs(tender);
      expect(slas.approval.status).toBe('NA');
      expect(slas.approval.label).toBe('-');
      expect(slas.submissionSlip.status).toBe('NA');
      expect(slas.mdCoApproval.status).toBe('NA');
      expect(slas.immediateDocs.status).toBe('NA');
    });

    it('calculates approval stage overdue and late correctly', () => {
      const baseDate = new Date('2026-06-01T12:00:00Z');
      
      // Case 1: Not submitted yet, current time is before planned (planned is base + 2d = Jun 3)
      const nowBefore = new Date('2026-06-02T12:00:00Z');
      const slas1 = calculateTenderSLAs({ created_at: baseDate.toISOString() }, nowBefore);
      expect(slas1.approval.status).toBe('OnTime');
      expect(slas1.approval.label).toBe('On Track');

      // Case 2: Not submitted yet, current time is after planned (overdue by 1 day)
      const nowAfter = new Date('2026-06-04T12:00:00Z');
      const slas2 = calculateTenderSLAs({ created_at: baseDate.toISOString() }, nowAfter);
      expect(slas2.approval.status).toBe('Overdue');
      expect(slas2.approval.label).toBe('Overdue by 1d 0h');

      // Case 3: Submitted on time (Jun 2)
      const slas3 = calculateTenderSLAs({
        created_at: baseDate.toISOString(),
        send_for_approval_at: new Date('2026-06-02T12:00:00Z').toISOString()
      });
      expect(slas3.approval.status).toBe('OnTime');
      expect(slas3.approval.label).toBe('On Time');

      // Case 4: Submitted late (Jun 4, late by 1d)
      const slas4 = calculateTenderSLAs({
        created_at: baseDate.toISOString(),
        send_for_approval_at: new Date('2026-06-04T12:00:00Z').toISOString()
      });
      expect(slas4.approval.status).toBe('Late');
      expect(slas4.approval.label).toBe('Late by 1d 0h');
    });

    it('calculates counter offer MD approval stage correctly', () => {
      // If counter offer is enabled
      const deadline = new Date('2026-06-10T12:00:00Z'); // Planned: deadline - 1 day = Jun 9
      const tender = {
        counter_offer: {
          enabled: true,
          sent_for_approval_at: new Date('2026-06-08T12:00:00Z').toISOString(),
          counter_offer_deadline: deadline.toISOString()
        }
      };

      // Case 1: Not approved, time is before Jun 9
      const nowBefore = new Date('2026-06-08T18:00:00Z');
      const slas1 = calculateTenderSLAs(tender, nowBefore);
      expect(slas1.mdCoApproval.status).toBe('OnTime');

      // Case 2: Not approved, time is after Jun 9
      const nowAfter = new Date('2026-06-09T18:00:00Z');
      const slas2 = calculateTenderSLAs(tender, nowAfter);
      expect(slas2.mdCoApproval.status).toBe('Overdue');
      expect(slas2.mdCoApproval.label).toBe('Overdue by 6h');

      // Case 3: Approved late
      tender.counter_offer.counter_offer_approve_by_md_at = new Date('2026-06-09T15:00:00Z').toISOString(); // late by 3h
      const slas3 = calculateTenderSLAs(tender);
      expect(slas3.mdCoApproval.status).toBe('Late');
      expect(slas3.mdCoApproval.label).toBe('Late by 3h');
    });
  });
});
