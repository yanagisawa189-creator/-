import express from 'express';
import bodyParser from 'body-parser';
import { DashboardController } from './controllers/DashboardController';
import { PlayerController } from './controllers/PlayerController';
import { GameController } from './controllers/GameController';
import { AnalyticsController } from './controllers/AnalyticsController';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Controllers
const dashboardController = new DashboardController();
const playerController = new PlayerController();
const gameController = new GameController();
const analyticsController = new AnalyticsController();

// Routes
app.get('/dashboard', dashboardController.getDashboardData);
app.get('/players', playerController.getPlayers);
app.post('/players', playerController.addPlayer);
app.get('/games', gameController.getGames);
app.post('/games', gameController.addGame);
app.get('/analytics', analyticsController.getAnalyticsData);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});