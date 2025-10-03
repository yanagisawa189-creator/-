import { Request, Response } from 'express';
import { Game } from '../models/Game';
import { DataService } from '../services/DataService';

export class GameController {
    private dataService: DataService;

    constructor() {
        this.dataService = new DataService();
    }

    public async getGameResults(req: Request, res: Response): Promise<void> {
        try {
            const results = await this.dataService.getGameResults();
            res.status(200).json(results);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving game results', error });
        }
    }

    public async updateGame(req: Request, res: Response): Promise<void> {
        const gameData: Game = req.body;
        try {
            const updatedGame = await this.dataService.updateGame(gameData);
            res.status(200).json(updatedGame);
        } catch (error) {
            res.status(500).json({ message: 'Error updating game information', error });
        }
    }
}