// src/controllers/AnalyticsController.ts

import { Request, Response } from 'express';
import { StatsService } from '../services/StatsService';

export class AnalyticsController {
    private statsService: StatsService;

    constructor() {
        this.statsService = new StatsService();
    }

    public async getPlayerStatistics(req: Request, res: Response): Promise<void> {
        try {
            const playerStats = await this.statsService.calculatePlayerStatistics();
            res.json(playerStats);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving player statistics', error });
        }
    }

    public async getGameAnalytics(req: Request, res: Response): Promise<void> {
        try {
            const gameAnalytics = await this.statsService.calculateGameAnalytics();
            res.json(gameAnalytics);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving game analytics', error });
        }
    }

    public async generateReport(req: Request, res: Response): Promise<void> {
        try {
            const report = await this.statsService.generateAnalyticsReport();
            res.json(report);
        } catch (error) {
            res.status(500).json({ message: 'Error generating report', error });
        }
    }
}