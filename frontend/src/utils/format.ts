export function formatMoney(value: number, currency = '₴'): string {
  if (value >= 1_000_000) return `${currency} ${(value / 1_000_000).toFixed(2)} млн`;
  if (value >= 1_000) return `${currency} ${(value / 1_000).toFixed(0)} тис`;
  return `${currency} ${value.toLocaleString('uk-UA')}`;
}

export function formatMoneyFull(value: number, currency = '₴'): string {
  return `${currency} ${value.toLocaleString('uk-UA')}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('uk-UA', { day: '2-digit', month: 'short' });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;

  if (diff < 60) return 'щойно';
  if (diff < 3600) return `${Math.floor(diff / 60)} хв тому`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} год тому`;
  if (diff < 172800) return 'вчора';
  return d.toLocaleDateString('uk-UA', { day: '2-digit', month: 'short' });
}

export function daysUntil(iso: string): number {
  const d = new Date(iso);
  const now = new Date();
  return Math.round((d.getTime() - now.getTime()) / 86400000);
}

export function isExpiringSoon(iso: string, days = 30): boolean {
  return daysUntil(iso) <= days && daysUntil(iso) >= 0;
}

export function isExpired(iso: string): boolean {
  return daysUntil(iso) < 0;
}

export function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export function fileSize(bytes: number): string {
  if (bytes > 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} МБ`;
  return `${(bytes / 1_000).toFixed(0)} КБ`;
}
