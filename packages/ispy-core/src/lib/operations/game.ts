import { Entities, Requests } from "@cloudydaiyz/ispy-shared";
import { Context } from "../context";
import { getCurrentPointValue } from "../../helper";
import assert from "assert";

export async function metrics(ctx: Context): Promise<Entities.AppMetrics> {
    return ctx.app.db.appMetricsStore.readAppMetrics();
}

export async function getGameState(ctx: Context): Promise<Entities.GameState> {
    const stats = await ctx.app.db.gameStatsStore.readGameStats();
    return stats.state;
}

export async function getGameHistory(ctx: Context): Promise<Entities.GameHistory> {
    const results = await ctx.app.db.gameHistoryStore.readGameHistory();
    return { results };
}

export async function exportGamePdf(ctx: Context) {

}

export async function leaveGame(ctx: Context, request: Entities.Username): Promise<void> {
    const { userStore, gameStatsStore, adminStore, playerStore, leaderboardStore } = ctx.app.db;
    const user = await userStore.readUser(request.username);
    assert(user.role != "host", "Unable to leave game if you're the host. " 
        + "You must end the game in order to leave.");

    const stats = await gameStatsStore.readGameStats();
    const statsUpdate: Partial<Entities.GameStats> = {};
    if(user.role == "player") {
        const player = await playerStore.readPlayer(request.username);
        if(player.completed) {
            statsUpdate.playersCompleted = stats.playersCompleted - 1;
        }
        statsUpdate.players = stats.players.filter(username => username != request.username);
        await playerStore.dropPlayer(request.username);
        await leaderboardStore.dropPlayer(request.username);
    } else if(user.role == "admin") {
        statsUpdate.admins = stats.admins.filter(username => username != request.username);
        await adminStore.dropAdmin(request.username);
    }

    await userStore.dropUser(request.username);
}

export async function submitTask(ctx: Context, request: Requests.SubmitTaskRequest): Promise<Entities.TaskSubmission> {
    const { gameStatsStore, leaderboardStore, playerStore } = ctx.app.db;
    const { username } = ctx.req;

    const stats = await gameStatsStore.readGameStats();
    const config = stats.configuration;
    // const task = await gameStatsStore.readTask(request.taskId);
    const task = config.tasks.find(t => t.id! == request.taskId);
    assert(task, "Invalid task ID.");

    const responses = task.responses.filter(t => request.responses.includes(t.id!));
    assert(responses.length == request.responses.length, "Some task IDs provided are invalid."
        + "Please validate your task IDs and retry.");
    
    const player = await playerStore.readPlayer(username!);
    const statsUpdate: Partial<Entities.GameStats> = {};
    const playerUpdate: Partial<Entities.Player> = {};

    const correct = responses.every(r => r.correct);
    const submitTime = Date.now();
    let pointsDelta = 0;
    if(correct) {
        pointsDelta += task.scaleSuccessValue 
            ? getCurrentPointValue(submitTime, task.successValue, config.startTime, config.endTime, true)
            : task.successValue;
        
        const playerNumRequiredTasks = player.tasksSubmitted.reduce((v, t) => t.required ? v + 1 : v, 0);
        if(!player.completed && task.required && playerNumRequiredTasks + 1 == stats.numRequiredTasks) {
            playerUpdate.completed = true;
            statsUpdate.playersCompleted = stats.playersCompleted + 1;
            if(!stats.completed && stats.players.length == statsUpdate.playersCompleted) {
                statsUpdate.completed = true;
            }
        }
    } else {
        pointsDelta -= task.scaleFailValue 
            ? getCurrentPointValue(submitTime, task.failValue, config.startTime, config.endTime, false)
            : task.failValue;
    }
    playerUpdate.points = player.points + pointsDelta;

    const submission: Entities.TaskSubmission = {
        taskId: task.id!,
        correct: false,
        title: task.title,
        required: task.required,
        submitTime,
        responses,
        pointsDelta,
    };

    const ranking = await leaderboardStore.updatePlayerScore(username!, pointsDelta);
    playerUpdate.ranking = ranking;
    await gameStatsStore.writeGameStats(statsUpdate);
    await playerStore.pushTaskSubmission(username!, submission);
    await playerStore.writePlayer(username!, playerUpdate);
    return submission;
}

export async function viewPlayerInfo(ctx: Context, request: Entities.Username): Promise<Entities.EnhancedPlayer> {
    return ctx.app.db.playerStore.readPlayer(request.username);
}

export async function viewTaskInfo(ctx: Context, request: Entities.TaskId): Promise<Entities.PublicTask> {
    const task = await ctx.app.db.gameStatsStore.readTask(request.taskId);
    const publicTask = Entities.PublicTaskModel.parse(task);
    return publicTask;
}

export async function kickPlayer(ctx: Context, request: Entities.Username): Promise<void> {
    const { playerStore, leaderboardStore, gameStatsStore, userStore, appMetricsStore } = ctx.app.db;
    const stats = await gameStatsStore.readGameStats();
    const statsUpdate: Partial<Entities.GameStats> = {};
    
    await playerStore.dropPlayer(request.username);
    await leaderboardStore.dropPlayer(request.username);
    await userStore.dropUser(request.username);

    statsUpdate.players = stats.players.filter(username => username == request.username);
    const gameState = stats.state == "running" 
        ? "running" 
        : stats.configuration.minPlayers <= statsUpdate.players.length
        ? "ready" 
        : "not-ready";
    statsUpdate.state = gameState;

    const player = await playerStore.readPlayer(request.username);
    if(player.completed) {
        statsUpdate.playersCompleted = stats.playersCompleted - 1;
        if(stats.configuration.minPlayersToComplete > statsUpdate.playersCompleted) {
            statsUpdate.completed = false;
        }
    }
}

export async function kickAllPlayers(ctx: Context, request: Entities.Username): Promise<void> {
    const { playerStore, leaderboardStore, gameStatsStore, userStore, appMetricsStore } = ctx.app.db;
    const stats = await gameStatsStore.readGameStats();
    await playerStore.dropPlayers();
    await leaderboardStore.dropLeaderboard();
    await userStore.dropUsers(stats.players);

    const gameState = stats.state == "running" 
        ? "running" 
        : stats.configuration.minPlayers == 0 
        ? "ready" 
        : "not-ready";

    await gameStatsStore.writeGameStats({ 
        players: [],
        state: gameState,
        playersCompleted: 0,
        completed: false,
    });

    await appMetricsStore.writeAppMetrics({
        numPlayers: 0,
        gameState,
    })
}

export async function viewGameInfo(ctx: Context): Promise<Entities.PublicGameStats> {
    const gameStats = await ctx.app.db.gameStatsStore.readGameStats();
    const publicGameStats = Entities.PublicGameStatsModel.parse(gameStats);
    return publicGameStats;
}

export async function lockGame(ctx: Context): Promise<void> {
    await ctx.app.db.gameStatsStore.writeGameStats({ locked: true });
}

export async function unlockGame(ctx: Context): Promise<void> {
    await ctx.app.db.gameStatsStore.writeGameStats({ locked: false });
}

export async function viewTaskHostInfo(ctx: Context, request: Entities.TaskId): Promise<Entities.Task> {
    return ctx.app.db.gameStatsStore.readTask(request.taskId);
}

export async function viewGameHostInfo(ctx: Context): Promise<Entities.Game> {
    const gameStats = await ctx.app.db.gameStatsStore.readGameStats();
    const leaderboard = await ctx.app.db.leaderboardStore.readLeaderboard();
    return { gameStats, leaderboard };
}

export async function endGame(ctx: Context): Promise<void> {
    const db = ctx.app.db;
    const game = await viewGameHostInfo(ctx);

    await db.gameHistoryStore.pushGame(game);
    await db.adminStore.dropAdmins();
    await db.gameStatsStore.dropGameStats();
    await db.leaderboardStore.dropLeaderboard();
    await db.userStore.dropUsers();
    await db.playerStore.dropPlayers();
    await db.appMetricsStore.writeAppMetrics({
        numPlayers: 0, 
        numAdmins: 0,
        gameState: "no-game",
        gameLocked: true,
    });
}

export async function removeAdmin(ctx: Context, request: Entities.Username): Promise<void> {
    await ctx.app.db.adminStore.dropAdmin(request.username);
}