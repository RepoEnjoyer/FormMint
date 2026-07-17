export function safeFilename(value: string): string {
  const cleaned = value.toLowerCase().trim().replace(/[^a-z0-9]+/gu, '-').replace(/^-|-$/gu, '').slice(0, 60);
  return cleaned === '' ? 'formmint-accessory' : cleaned;
}
