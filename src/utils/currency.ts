import { formatNumberWithSpaces } from './formatters';

export const formatAriary = (amount: number): string => {
  return `${formatNumberWithSpaces(amount)} Ar`;
};

export const formatAriarySimple = (amount: number): string => {
  return `${formatNumberWithSpaces(amount)} Ar`;
};

export const calculateDownPayment = (totalAmount: number, percentage: number): number => {
  return Math.round((totalAmount * percentage) / 100);
};

export const calculateRemainingAmount = (totalAmount: number, downPaymentAmount: number): number => {
  return totalAmount - downPaymentAmount;
};