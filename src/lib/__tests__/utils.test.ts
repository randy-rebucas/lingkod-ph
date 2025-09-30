import { cn, formatBudget } from '../utils';

describe('Utils', () => {
  describe('cn function', () => {
    it('merges class names correctly', () => {
      const result = cn('class1', 'class2');
      expect(result).toBe('class1 class2');
    });

    it('handles conditional classes', () => {
      const result = cn('base', { 'conditional': true, 'hidden': false });
      expect(result).toBe('base conditional');
    });

    it('handles undefined and null values', () => {
      const result = cn('base', undefined, null, 'valid');
      expect(result).toBe('base valid');
    });

    it('handles empty input', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('merges conflicting Tailwind classes', () => {
      const result = cn('px-2 px-4', 'py-1 py-3');
      expect(result).toBe('px-4 py-3');
    });

    it('handles arrays of classes', () => {
      const result = cn(['class1', 'class2'], 'class3');
      expect(result).toBe('class1 class2 class3');
    });
  });

  describe('formatBudget function', () => {
    it('formats fixed budget correctly', () => {
      const budget = {
        amount: 1000,
        type: 'Fixed' as const,
        negotiable: false,
      };
      
      const result = formatBudget(budget);
      expect(result).toBe('₱1,000.00');
    });

    it('formats daily budget correctly', () => {
      const budget = {
        amount: 500,
        type: 'Daily' as const,
        negotiable: false,
      };
      
      const result = formatBudget(budget);
      expect(result).toBe('₱500.00 / day');
    });

    it('formats monthly budget correctly', () => {
      const budget = {
        amount: 15000,
        type: 'Monthly' as const,
        negotiable: false,
      };
      
      const result = formatBudget(budget);
      expect(result).toBe('₱15,000.00 / month');
    });

    it('adds negotiable flag when true', () => {
      const budget = {
        amount: 1000,
        type: 'Fixed' as const,
        negotiable: true,
      };
      
      const result = formatBudget(budget);
      expect(result).toBe('₱1,000.00 (Negotiable)');
    });

    it('handles decimal amounts correctly', () => {
      const budget = {
        amount: 1234.56,
        type: 'Fixed' as const,
        negotiable: false,
      };
      
      const result = formatBudget(budget);
      expect(result).toBe('₱1,234.56');
    });

    it('handles zero amount', () => {
      const budget = {
        amount: 0,
        type: 'Fixed' as const,
        negotiable: false,
      };
      
      const result = formatBudget(budget);
      expect(result).toBe('₱0.00');
    });

    it('handles large amounts with proper formatting', () => {
      const budget = {
        amount: 1000000,
        type: 'Monthly' as const,
        negotiable: true,
      };
      
      const result = formatBudget(budget);
      expect(result).toBe('₱1,000,000.00 / month (Negotiable)');
    });

    it('returns "Not specified" for null budget', () => {
      const result = formatBudget(null);
      expect(result).toBe('Not specified');
    });

    it('returns "Not specified" for undefined budget', () => {
      const result = formatBudget(undefined);
      expect(result).toBe('Not specified');
    });

    it('returns "Not specified" for budget with invalid amount', () => {
      const budget = {
        amount: 'invalid' as any,
        type: 'Fixed' as const,
        negotiable: false,
      };
      
      const result = formatBudget(budget);
      expect(result).toBe('Not specified');
    });

    it('returns "Not specified" for budget with NaN amount', () => {
      const budget = {
        amount: NaN,
        type: 'Fixed' as const,
        negotiable: false,
      };
      
      const result = formatBudget(budget);
      expect(result).toBe('Not specified');
    });

    it('handles default case for unknown budget type', () => {
      const budget = {
        amount: 1000,
        type: 'Unknown' as any,
        negotiable: false,
      };
      
      const result = formatBudget(budget);
      expect(result).toBe('₱1,000.00');
    });

    it('handles negative amounts', () => {
      const budget = {
        amount: -500,
        type: 'Fixed' as const,
        negotiable: false,
      };
      
      const result = formatBudget(budget);
      expect(result).toBe('₱-500.00');
    });

    it('handles very small decimal amounts', () => {
      const budget = {
        amount: 0.01,
        type: 'Fixed' as const,
        negotiable: false,
      };
      
      const result = formatBudget(budget);
      expect(result).toBe('₱0.01');
    });

    it('handles daily budget with negotiable flag', () => {
      const budget = {
        amount: 750,
        type: 'Daily' as const,
        negotiable: true,
      };
      
      const result = formatBudget(budget);
      expect(result).toBe('₱750.00 / day (Negotiable)');
    });

    it('handles monthly budget with negotiable flag', () => {
      const budget = {
        amount: 25000,
        type: 'Monthly' as const,
        negotiable: true,
      };
      
      const result = formatBudget(budget);
      expect(result).toBe('₱25,000.00 / month (Negotiable)');
    });
  });
});
