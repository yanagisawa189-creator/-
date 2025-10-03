// src/types/index.ts

export interface Player {
    id: number;
    name: string;
    position: string;
    avg?: number;
    hr?: number;
    rbi?: number;
    games?: number;
    hits?: number;
    era?: number;
    wins?: number;
    strikeouts?: number;
    throwingPct?: number;
}

export interface Game {
    date: string;
    opponent: string;
    ourScore: number;
    theirScore: number;
    result: 'win' | 'loss' | 'tie';
}

export interface Team {
    id: number;
    name: string;
    players: Player[];
    wins: number;
    losses: number;
    ties: number;
}