/**
 * Currency formatting utilities for Ghana Cedis (GHS)
 */

/**
 * Format amount as Ghana Cedis currency
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string (e.g., "GH₵ 1,234.56")
 */
export function formatGHS(
  amount: number, 
  options: {
    showSymbol?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string {
  const {
    showSymbol = true,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
  } = options;

  const formattedAmount = new Intl.NumberFormat('en-GH', {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);

  return showSymbol ? `GH₵ ${formattedAmount}` : formattedAmount;
}

/**
 * Format amount as Ghana Cedis with compact notation for large numbers
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "GH₵ 1.2K", "GH₵ 1.5M")
 */
export function formatGHSCompact(amount: number): string {
  const formatter = new Intl.NumberFormat('en-GH', {
    notation: 'compact',
    compactDisplay: 'short',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });

  return `GH₵ ${formatter.format(amount)}`;
}

/**
 * Parse currency string to number (removes GH₵ symbol and commas)
 * @param currencyString - Currency string to parse
 * @returns Parsed number
 */
export function parseGHS(currencyString: string): number {
  const cleanString = currencyString
    .replace(/GH₵\s?/g, '')
    .replace(/,/g, '')
    .trim();
  
  return parseFloat(cleanString) || 0;
}

/**
 * Format amount as Ghana Cedis for display in tables/cards
 * @param amount - The amount to format
 * @returns Formatted currency string optimized for UI display
 */
export function formatGHSForDisplay(amount: number): string {
  if (amount >= 1000000) {
    return formatGHSCompact(amount);
  }
  return formatGHS(amount);
}

/**
 * Calculate the total amount paid from transactions
 * @param transactions - Array of transaction objects
 * @returns The total amount paid
 */
export function calculateAmountPaid(transactions: any[]): number {
  if (!transactions || !Array.isArray(transactions)) {
    return 0;
  }
  
  return transactions
    .filter(transaction => transaction.paymentStatus === 'PAID')
    .reduce((total, transaction) => total + (transaction.amount || 0), 0);
}

/**
 * Get the amount paid for a registration, falling back to category price if no transactions
 * @param registration - Registration object with transactions and category
 * @returns The amount paid or category price
 */
export function getRegistrationAmount(registration: any): number {
  const amountPaid = calculateAmountPaid(registration.transactions);
  const categoryPrice = registration?.category?.price ?? 0;

  if (Number.isFinite(amountPaid) && amountPaid > 0) {
    return amountPaid;
  }

  return Number.isFinite(categoryPrice) ? categoryPrice : 0;
}
