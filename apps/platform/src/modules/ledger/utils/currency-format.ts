export const formatNumberWithDots = (val: string | number): string => {
  if (val === undefined || val === null || val === '') return '';
  const numericOnly = String(val).replace(/\D/g, '');
  if (!numericOnly) return '';
  return new Intl.NumberFormat('id-ID').format(parseInt(numericOnly, 10));
};

export const parseDotsToNumber = (val: string | number): number => {
  if (!val) return 0;
  const numericOnly = String(val).replace(/\D/g, '');
  return parseInt(numericOnly, 10) || 0;
};
