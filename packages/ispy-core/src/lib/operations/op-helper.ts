import { Context } from "../context";
import { Entities } from "@cloudydaiyz/ispy-shared";

// Drops a user depending on their role
export async function dropUser(ctx: Context, user: Entities.User): Promise<void> {
    const { userStore, gameStatsStore, adminStore, playerStore, leaderboardStore, appMetricsStore } = ctx.app.db;
    const stats = await gameStatsStore.readGameStats();
    const metrics = await appMetricsStore.readAppMetrics();
    const statsUpdate: Partial<Entities.GameStats> = {};
    const metricsUpdate: Partial<Entities.AppMetrics> = {};

    if(user.role == "player") {
        metricsUpdate.numPlayers = metrics.numPlayers - 1;

        const player = await playerStore.readPlayer(user.username);
        if(player.completed) {
            statsUpdate.playersCompleted = stats.playersCompleted - 1;
            if(stats.configuration.minPlayersToComplete > statsUpdate.playersCompleted) {
                statsUpdate.completed = false;
            }
        }

        statsUpdate.players = stats.players.filter(username => username != user.username);
        const gameState = stats.state == "running" 
            ? "running" 
            : stats.configuration.minPlayers <= statsUpdate.players.length
            ? "ready" 
            : "not-ready";
        statsUpdate.state = gameState;
        metricsUpdate.gameState = gameState;

    } else if(user.role == "admin") {
        metricsUpdate.numAdmins = metrics.numAdmins - 1;
        statsUpdate.admins = stats.admins.filter(username => username != user.username);
        await adminStore.dropAdmin(user.username);
    }

    // Perform writes
    if(user.role == "player") {
        await playerStore.dropPlayer(user.username);
        await leaderboardStore.dropPlayer(user.username);
    }
    await userStore.dropUser(user.username);
    await gameStatsStore.writeGameStats(statsUpdate);
    await appMetricsStore.writeAppMetrics(metricsUpdate);
}

// Drops users of a specified role
export async function dropUsers(ctx: Context, role: 'player' | 'admin'): Promise<void> {
    const { playerStore, adminStore, leaderboardStore, gameStatsStore, userStore, appMetricsStore } = ctx.app.db;
    const stats = await gameStatsStore.readGameStats();
    const statsUpdate: Partial<Entities.GameStats> = {};
    const metricsUpdate: Partial<Entities.AppMetrics> = {};
    
    if(role == 'player') {
        const gameState = stats.state == "running" 
            ? "running" 
            : stats.configuration.minPlayers == 0 
            ? "ready" 
            : "not-ready";
        
        statsUpdate.players = [];
        statsUpdate.playersCompleted = 0;
        statsUpdate.completed = false;

        metricsUpdate.numPlayers = 0;
        metricsUpdate.gameState = gameState;

        await playerStore.dropPlayers();
        await leaderboardStore.dropLeaderboard();
        await userStore.dropUsers(stats.players);
    }

    if(role == 'admin') {
        statsUpdate.admins = [];
        metricsUpdate.numAdmins = 0;

        await adminStore.dropAdmins();
        await userStore.dropUsers(stats.admins);
    }

    await gameStatsStore.writeGameStats(statsUpdate);
    await appMetricsStore.writeAppMetrics(metricsUpdate);
}