// GOAT внутренние коды одежды → буквенный размер
const GOAT_APPAREL_CODE: Record<string, string> = {
    '100': 'XXS', '101': 'XS', '102': 'S', '103': 'M',
    '104': 'L', '105': 'XL', '106': '2XL', '107': '3XL',
    '108': '4XL', '109': '5XL',
};

// US обувь → EU/RU
const SHOE_US_TO_EU: Record<string, string> = {
    '3': '35', '3.5': '35.5',
    '4': '36', '4.5': '36.5', '5': '37', '5.5': '37.5',
    '6': '38', '6.5': '38.5', '7': '40', '7.5': '40.5',
    '8': '41', '8.5': '42', '9': '42.5', '9.5': '43',
    '10': '44', '10.5': '44.5', '11': '45', '11.5': '45.5',
    '12': '46', '12.5': '47', '13': '47.5', '13.5': '48',
    '14': '48.5', '14.5': '49', '15': '49.5', '15.5': '50', '16': '51',
    '16.5': '51.5', '17': '52', '17.5': '52.5', '18': '53',
    '18.5': '53.5', '19': '54', '19.5': '54.5', '20': '55',
    '20.5': '55.5', '21': '56', '21.5': '56.5', '22': '57',
};

// Буквенные размеры → RU числовой (унисекс / мужской)
const LETTER_TO_RU: Record<string, string> = {
    'XXS': '40', 'XS': '42', 'S': '44', 'M': '46–48',
    'L': '48–50', 'XL': '50–52', 'XXL': '52–54', '2XL': '52–54',
    'XXXL': '54–56', '3XL': '54–56', '4XL': '56–58', '5XL': '58–60',
    // Варианты написания
    'SMALL': '44', 'MEDIUM': '46–48', 'LARGE': '48–50',
    'X-SMALL': '42', 'X-LARGE': '50–52',
    'XX-SMALL': '40', 'XX-LARGE': '52–54', 'XXX-LARGE': '54–56',
    'X-LARGE-TALL': '50–52', 'XX-LARGE-TALL': '52–54',
};

const NO_CONVERSION = new Set(['OS', 'ONE SIZE', 'ONESIZE', 'NS', 'N/A', 'ONE-SIZE']);

export const toRuSize = (rawSize: string): string | null => {
    const size = rawSize.trim();
    const upper = size.toUpperCase();

    // Товары без размеров или с нестандартными размерами
    if (NO_CONVERSION.has(upper)) return null;

    // GOAT коды одежды (на случай если пришли с сервера)
    if (GOAT_APPAREL_CODE[size]) {
        const letter = GOAT_APPAREL_CODE[size];
        return LETTER_TO_RU[letter] ?? null;
    }

    // Буквенные размеры одежды
    if (LETTER_TO_RU[upper]) {
        return LETTER_TO_RU[upper];
    }

    // Обувные US-размеры
    const clean = size.replace(/[^0-9.]/g, '');
    if (SHOE_US_TO_EU[clean]) {
        return SHOE_US_TO_EU[clean];
    }

    return null;
};

export const displaySize = (size: string): string => {
    if (!size) return size;
    const upper = size.trim().toUpperCase();
    if (NO_CONVERSION.has(upper)) return 'Один размер';
    const ru = toRuSize(size);
    return ru ? `${size} (RU ${ru})` : size;
};
