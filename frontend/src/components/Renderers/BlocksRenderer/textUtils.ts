export const breakNumberScanners = (text: string): string => {
  if (/^\d{7,}$/.test(text.trim())) {
    return text.charAt(0) + '\u200B' + text.slice(1);
  }
  return text;
};
