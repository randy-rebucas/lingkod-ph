
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type Budget = {
  amount: number;
  type: 'Fixed' | 'Daily' | 'Monthly';
  negotiable: boolean;
};

export function formatBudget(budget: Budget | undefined | null): string {
  if (!budget || typeof budget.amount !== 'number') {
    return 'Not specified';
  }

  const formattedAmount = `₱${budget.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  let result = '';

  switch (budget.type) {
    case 'Fixed':
      result = formattedAmount;
      break;
    case 'Daily':
      result = `${formattedAmount} / day`;
      break;
    case 'Monthly':
      result = `${formattedAmount} / month`;
      break;
    default:
      result = formattedAmount;
  }

  if (budget.negotiable) {
    result += ' (Negotiable)';
  }

  return result;
}
