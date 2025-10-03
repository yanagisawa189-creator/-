import { Request, Response } from 'express';
import { StatsService } from '../services/StatsService';

export class DashboardController {
    private statsService: StatsService;

    constructor() {
        this.statsService = new StatsService();
    }

    public async getTeamStatistics(req: Request, res: Response): Promise<void> {
        try {
            const statistics = await this.statsService.getTeamStatistics();
            res.status(200).json(statistics);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving team statistics', error });
        }
    }
}