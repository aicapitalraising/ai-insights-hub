/**
 * Generate a URL-friendly slug from a client name.
 * e.g. "Acme Fund Group" → "acme-fund-group"
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
