import { Entities, Requests } from "@cloudydaiyz/ispy-shared";
import { Context, } from "../context";
import { getCurrentPointValue } from "../../util";
import { dropUser, dropUsers } from "./op-helper";
import { Readable } from "stream";
import { IllegalStateError, InvalidInputError } from "../errors";

export async function metrics(ctx: Context): Promise<Entities.AppMetrics> {
    return ctx.app.db.appMetricsStore.readAppMetrics();
}

export async function getGameState(ctx: Context): Promise<Entities.GameState> {
    const stats = await ctx.app.db.gameStatsStore.readGameStats();
    return stats.state;
}

export async function validateGame(ctx: Context, request: any): Promise<Requests.ValidateResponse> {
    const valid = Entities.GameConfigurationModel.safeParse(request).success;
    return { valid };
}

export async function getGameHistory(ctx: Context): Promise<Entities.GameHistory> {
    const results = await ctx.app.db.gameHistoryStore.readGameHistory();
    return { results };
}

export async function exportGamePdf(ctx: Context): Promise<Entities.GameExport> {
    return { link: await ctx.app.files.getExportPdfLink() };
}

export async function exportGamePdfFile(ctx: Context): Promise<Readable> {
    return ctx.app.files.getExportPdfFile();
}

export async function leaveGame(ctx: Context, request: Entities.Username): Promise<void> {
    const user = ctx.local!.req.currentUser!;
    await dropUser(ctx, user);
    ctx.sock.disconnect([request.username]);
}

export async function submitTask(ctx: Context, request: Requests.SubmitTaskRequest): Promise<Entities.TaskSubmission> {
    const { gameStatsStore, leaderboardStore, playerStore } = ctx.app.db;
    const username = ctx.local!.req.username;
    const stats = await gameStatsStore.readGameStats();
    const statsUpdate: Partial<Entities.GameStats> = {};
    IllegalStateError.assert(stats.state == "running", "Cannot submit task. The game hasn't started yet.");

    const config = stats.configuration;
    const task = config.tasks.find(t => t.id! == request.taskId);
    InvalidInputError.assert(task, "Invalid task ID.");

    const responses = task.responses.filter(t => request.responses.includes(t.id!));
    InvalidInputError.assert(responses.length == request.responses.length, "Some task IDs provided are invalid. "
        + "Please validate your task IDs and retry.");
    
    const player = await playerStore.readPlayer(username!);
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
            if(!stats.completed && statsUpdate.playersCompleted >= config.minPlayersToComplete) {
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

export async function startGame(ctx: Context): Promise<void> {
    const { gameStatsStore, appMetricsStore } = ctx.app.db;
    const stats = await gameStatsStore.readGameStats();
    IllegalStateError.assert(stats.state == "ready", "Unable to start game. The game is not in a ready state.");

    await gameStatsStore.writeGameStats({ state: "running", startTime: Date.now() });
    await appMetricsStore.writeAppMetrics({ gameState: "running" });

    if(!ctx.local!.req.scheduled) {
        await ctx.app.scheduler.cancelSchedule("start-game");
    }
}

export async function viewPlayerInfo(ctx: Context, request: Entities.Username): Promise<Entities.EnhancedPlayer> {
    return ctx.app.db.playerStore.readPlayer(request.username);
}

export async function viewTaskInfo(ctx: Context, request: Entities.TaskId): Promise<Entities.PublicTask> {
    const gameStats = await ctx.app.db.gameStatsStore.readGameStats();
    IllegalStateError.assert(gameStats.state == "running", "Game has not stared yet.");
    
    const task = gameStats.configuration.tasks.find(t => t.id == request.taskId);
    InvalidInputError.assert(task, "Invalid task ID.");

    const publicTask = Entities.PublicTaskModel.parse(task);
    return publicTask;
}

export async function kickPlayer(ctx: Context, request: Entities.Username): Promise<void> {
    const user = await ctx.app.db.userStore.readUser(request.username);
    await dropUser(ctx, user);
    ctx.sock.disconnect([request.username]);
}

export async function kickAllPlayers(ctx: Context): Promise<void> {
    await dropUsers(ctx, "player");
    ctx.sock.disconnect("player");
}

export async function viewGameInfo(ctx: Context): Promise<Entities.PublicGameStats> {
    const gameStats = await ctx.app.db.gameStatsStore.readGameStats();
    IllegalStateError.assert(gameStats.state == "running", "Game has not stared yet.");
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
    const stats = await db.gameStatsStore.readGameStats();
    IllegalStateError.assert(stats.state == "running", "Unable to end game. The game is not already running.");

    const game = await viewGameHostInfo(ctx);
    await db.gameHistoryStore.pushGame(game);
    await db.gameStatsStore.dropGameStats();
    await db.leaderboardStore.dropLeaderboard();
    await db.userStore.dropUsers();
    await db.playerStore.dropPlayers();
    await db.adminStore.dropAdmins();
    await db.appMetricsStore.writeAppMetrics({
        numPlayers: 0, 
        numAdmins: 0,
        gameState: "no-game",
        gameLocked: true,
    });
    ctx.sock.to('all').gameEnded(game);
    ctx.sock.disconnect('all');

    await ctx.app.files.deleteExportPdfFile();
    if(!ctx.local!.req.scheduled) {
        await ctx.app.scheduler.cancelSchedule("end-game");
    }
}

export async function removeAdmin(ctx: Context, request: Entities.Username): Promise<void> {
    const user = await ctx.app.db.userStore.readUser(request.username);
    await dropUser(ctx, user);
    ctx.sock.disconnect([request.username]);
}