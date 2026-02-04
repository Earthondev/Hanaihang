/**
 * Thai text normalization utilities
 * สำหรับการค้นหาที่ไม่ติดวรรณยุกต์และตัวพิมพ์เล็ก-ใหญ่
 */

/**
 * Normalize Thai text for search
 * - Convert to lowercase
 * - Remove Thai diacritics (วรรณยุกต์)
 * - Remove tone marks (เครื่องหมายกำกับ)
 */
export const normalizeThai = (text: string): string => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .normalize('NFKD') // Decompose characters
    .replace(/[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/g, '') // Remove Thai diacritics
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
};

/**
 * Create search query for Firestore range queries
 * Returns normalized query + '\uf8ff' for prefix matching
 */
export const createSearchQuery = (query: string): { start: string; end: string } => {
  const normalized = normalizeThai(query);
  return {
    start: normalized,
    end: normalized + '\uf8ff'
  };
};

/**
 * Highlight matching text in search results
 * Returns JSX-like structure for highlighting
 */
export const highlightMatch = (text: string, query: string): string => {
  if (!query || !text) return text;
  
  const normalizedText = normalizeThai(text);
  const normalizedQuery = normalizeThai(query);
  
  if (!normalizedText.includes(normalizedQuery)) {
    return text;
  }
  
  // Find the original position of the match
  const startIndex = normalizedText.indexOf(normalizedQuery);
  const endIndex = startIndex + normalizedQuery.length;
  
  return text.substring(0, startIndex) + 
         `<mark class="bg-yellow-200 px-1 rounded">${text.substring(startIndex, endIndex)}</mark>` + 
         text.substring(endIndex);
};

/**
 * Check if text matches query (case and diacritic insensitive)
 */
export const matchesQuery = (text: string, query: string): boolean => {
  if (!query || !text) return false;
  
  const normalizedText = normalizeThai(text);
  const normalizedQuery = normalizeThai(query);
  
  return normalizedText.includes(normalizedQuery);
};

/**
 * Get search score for ranking (higher = better match)
 * - Exact match gets highest score
 * - Starts with query gets high score
 * - Contains query gets lower score
 */
export const getSearchScore = (text: string, query: string): number => {
  if (!query || !text) return 0;
  
  const normalizedText = normalizeThai(text);
  const normalizedQuery = normalizeThai(query);
  
  if (normalizedText === normalizedQuery) return 100;
  if (normalizedText.startsWith(normalizedQuery)) return 80;
  if (normalizedText.includes(normalizedQuery)) return 60;
  
  return 0;
};