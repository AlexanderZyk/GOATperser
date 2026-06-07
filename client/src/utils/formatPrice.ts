export const formatRub = (usdPrice: string | null | undefined, rate: number): string => {
    if (!usdPrice) return 'Нет в наличии';
    const usd = parseFloat(usdPrice.replace(/[^0-9.]/g, ''));
    if (isNaN(usd) || usd <= 0) return 'Нет в наличии';
    return `${Math.round(usd * rate).toLocaleString('ru-RU')} ₽`;
};
