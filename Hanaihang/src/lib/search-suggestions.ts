import { normalizeThai } from './thai-normalize';

export interface SearchSuggestion {
    type: 'history' | 'trending' | 'category' | 'time-based';
    text: string;
    icon?: string;
    label?: string; // For display, e.g. "ค้นหาล่าสุด", "แนะนำช่วงเที่ยง"
}

const STORAGE_KEY = 'hanaihang_recent_searches';
const MAX_HISTORY = 5;

// Popular terms (Mock data - ideally fetches from an API)
const POPULAR_SEARCHES = [
    'Starbucks',
    'Central World',
    'Uniqlo',
    'H&M',
    'Cinema',
    'Supermarket'
];

// Time-based logic
function getTimeBasedSuggestions(): SearchSuggestion[] {
    const hour = new Date().getHours();
    const suggestions: SearchSuggestion[] = [];

    if (hour >= 6 && hour < 11) {
        suggestions.push({ type: 'time-based', text: 'Coffee', label: '☕ เติมพลังยามเช้า', icon: 'Sun' });
        suggestions.push({ type: 'time-based', text: 'Bakery', label: '🥐 อาหารเช้า', icon: 'Croissant' });
    } else if (hour >= 11 && hour < 14) {
        suggestions.push({ type: 'time-based', text: 'Food Court', label: '🍜 มื้อเที่ยงด่วนๆ', icon: 'Utensils' });
        suggestions.push({ type: 'time-based', text: 'Restaurant', label: '🍽️ ร้านอาหาร', icon: 'Utensils' });
    } else if (hour >= 17 && hour < 21) {
        suggestions.push({ type: 'time-based', text: 'Dinner', label: '🍲 มื้อเย็น', icon: 'Moon' });
        suggestions.push({ type: 'time-based', text: 'Cinema', label: '🎬 ดูหนังรอบค่ำ', icon: 'Film' });
    } else if (hour >= 21 || hour < 4) {
        suggestions.push({ type: 'time-based', text: 'Bar', label: '🥂 แฮงค์เอาท์', icon: 'GlassWater' });
    }

    return suggestions;
}

export class SuggestionEngine {
    // Get all suggestions for empty state
    static getSuggestions(): SearchSuggestion[] {
        const suggestions: SearchSuggestion[] = [];

        // 1. Time-based (Context aware)
        suggestions.push(...getTimeBasedSuggestions());

        // 2. History (Personalization)
        const history = this.getHistory();
        if (history.length > 0) {
            history.forEach(text => {
                suggestions.push({ type: 'history', text, label: '🕒 ค้นหาล่าสุด' });
            });
        }

        // 3. Trending/Popular (Crowd wisdom)
        // Add popular ones that aren't already in history/time-based
        const existingTexts = new Set(suggestions.map(s => normalizeThai(s.text)));

        POPULAR_SEARCHES.forEach(text => {
            if (!existingTexts.has(normalizeThai(text)) && suggestions.length < 10) {
                suggestions.push({ type: 'trending', text, label: '🔥 กำลังฮิต' });
                existingTexts.add(normalizeThai(text));
            }
        });

        return suggestions;
    }

    static getHistory(): string[] {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    static addToHistory(term: string) {
        if (!term || term.trim().length < 2) return;

        const cleanTerm = term.trim();
        let history = this.getHistory();

        // Remove duplicates (case insensitive)
        history = history.filter(h => normalizeThai(h) !== normalizeThai(cleanTerm));

        // Add to front
        history.unshift(cleanTerm);

        // Limit size
        if (history.length > MAX_HISTORY) {
            history = history.slice(0, MAX_HISTORY);
        }

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        } catch (e) {
            console.error('Failed to save search history', e);
        }
    }

    static clearHistory() {
        localStorage.removeItem(STORAGE_KEY);
    }
}
