export const getImageUrl = (url?: string | null): string => {
  if (!url) return '';
  // If it contains /api/uploads/, extract the relative path from /api/uploads/
  if (url.includes('/api/uploads/')) {
    return url.substring(url.indexOf('/api/uploads/'));
  }
  return url;
};
