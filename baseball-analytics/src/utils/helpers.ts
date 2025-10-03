// src/utils/helpers.ts

export function formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('ja-JP', options);
}

export function calculateWinPercentage(wins: number, losses: number): number {
    if (wins + losses === 0) return 0;
    return (wins / (wins + losses)) * 100;
}

export function formatStatValue(value: number): string {
    return value.toFixed(2);
}