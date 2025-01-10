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

export async function exportGamePdf(ctx: Context) {}

export async function leaveGame(ctx: Context, request: Entities.Username): Promise<void> {
    const {userStore, gameStatsStore} = ctx.app.db;
    const user = await userStore.readUser(request.username);
    assert(user.role != "host", "Unable to leave game if you're the host. " 
        + "You must end the game in order to leave.");
    
    await userStore.dropUser(request.username);
}

export async function submitTask(ctx: Context, request: Requests.SubmitTaskRequest): Promise<Entities.TaskSubmission> {
    const {gameStatsStore, leaderboardStore, playerStore} = ctx.app.db;
    const {username} = ctx.req;

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
        if(!player.completed && playerNumRequiredTasks + 1 == stats.numRequiredTasks) {
            playerUpdate.completed = true;
            statsUpdate.playersCompleted = stats.playersCompleted - 1;
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
    await playerStore.writePlayer(username!, player);
    return submission;
}