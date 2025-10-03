// src/models/Game.ts

export class Game {
    date: string;
    opponent: string;
    ourScore: number;
    theirScore: number;
    result: 'win' | 'loss' | 'tie';

    constructor(date: string, opponent: string, ourScore: number, theirScore: number, result: 'win' | 'loss' | 'tie') {
        this.date = date;
        this.opponent = opponent;
        this.ourScore = ourScore;
        this.theirScore = theirScore;
        this.result = result;
    }

    getSummary(): string {
        return `${this.date}: ${this.opponent} - ${this.ourScore}:${this.theirScore} (${this.result})`;
    }
}