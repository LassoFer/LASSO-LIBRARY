// =====================
// classNames
// =====================
//#region classNames
export const classNames = (classes: Array<string | false | null | undefined>): string => {
  return classes.filter(Boolean).join(' ');
};

export function generateRandomString(length = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
