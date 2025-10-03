import { Request, Response } from 'express';
import { Player } from '../models/Player';
import { StatsService } from '../services/StatsService';

export class PlayerController {
    private statsService: StatsService;

    constructor() {
        this.statsService = new StatsService();
    }

    public getPlayerStats(req: Request, res: Response): void {
        const playerId = req.params.id;
        const playerStats = this.statsService.getPlayerStats(playerId);
        res.json(playerStats);
    }

    public updatePlayer(req: Request, res: Response): void {
        const playerId = req.params.id;
        const playerData = req.body;
        const updatedPlayer = Player.update(playerId, playerData);
        res.json(updatedPlayer);
    }

    public getAllPlayers(req: Request, res: Response): void {
        const players = Player.getAll();
        res.json(players);
    }
}