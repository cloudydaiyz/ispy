import { Entities } from "@cloudydaiyz/ispy-shared";
import { DatabaseCtx, LeaderboardInfo } from "../../lib/context";
import assert from "assert";

// == APP METRICS STORE == //
let appMetrics: Entities.AppMetrics;

export const createAppMetrics = async (): Promise<void> => {
    appMetrics = {
        numPlayers: 0,
        numAdmins: 0,
        gameState: "no-game",
        gameLocked: false,
    }
}

export const readAppMetrics = async (): Promise<Entities.AppMetrics> => {
    assert(appMetrics, "App metrics currently unavailable.");
    return structuredClone(appMetrics);
}

export const writeAppMetrics = async (props: Partial<Entities.AppMetrics>): Promise<void> => {
    assert(appMetrics, "App metrics currently unavailable.");
    appMetrics = { ...appMetrics, ...props };
}

const appMetricsStore = {
    createAppMetrics,
    readAppMetrics,
    writeAppMetrics,
}

// == GAME HISTORY STORE == //
let gameHistory: Entities.Game[] = [];

export const readGameHistory = async (): Promise<Entities.Game[]> => {
    return structuredClone(gameHistory);
}

export const pushGame = async (results: Entities.Game): Promise<void> => {
    gameHistory.push(results);
    if(gameHistory.length > 5) {
        gameHistory.splice(0, 1);
    }
}

const gameHistoryStore = {
    readGameHistory,
    pushGame,
}

// == PLAYER STORE == //
let players: Record<string, Entities.EnhancedPlayer> = {}

export const readPlayer = async (username: string): Promise<Entities.EnhancedPlayer> => {
    assert(username in players, "Player not found.");
    return structuredClone(players[username]);
}

export const createPlayer = async (username: string, props: Entities.EnhancedPlayer): Promise<void> => {
    players[username] = structuredClone(props);
}

export const writePlayer = async (username: string, props: Partial<Entities.EnhancedPlayer>): Promise<void> => {
    assert(username in players, "Player not found.");
    players[username] = { ...players[username], ...props };
}

export const dropPlayer = async (username: string): Promise<void> => {
    delete players[username];
}

export const pushTaskSubmission = async (username: string, props: Entities.TaskSubmission): Promise<void> => {
    assert(username in players, "Player not found.");
    players[username].tasksSubmitted.push(props);
}

export const dropPlayers = async (): Promise<void> => {
    players = {};
}

const playerStore = {
    readPlayer,
    createPlayer,
    writePlayer,
    dropPlayer,
    pushTaskSubmission,
    dropPlayers,
};

// == ADMIN STORE == //
let admins: Record<string, Entities.Admin> = {}

const readAdmin = async (username: string): Promise<Entities.Admin> => {
    assert(username in admins, "Admin not found.");
    return structuredClone(admins[username]);
}

const readOptionalAdmin = async (username: string): Promise<Entities.Admin | undefined> => {
    if(!(username in admins)) return undefined;
    return structuredClone(admins[username]);
}

const createAdmins = async (props: Entities.Admin[]): Promise<void> => {
    for(const admin of props) {
        if(admin.username in admins) {
            throw new Error("Admin already exists.");
        }
        admins[admin.username] = structuredClone(admin);
    }
}

const writeAdmin = async (username: string, props: Partial<Entities.Admin>): Promise<void> => {
    assert(username in admins, "Admin not found.");
    admins[username] = { ...admins[username], ...props };
}

const dropAdmin = async (username: string): Promise<void> => {
    delete admins[username];
}

const dropAdmins = async (): Promise<void> => {
    admins = {};
}

const adminStore = {
    readAdmin,
    readOptionalAdmin,
    createAdmins,
    writeAdmin,
    dropAdmin,
    dropAdmins,
}

// == LEADERBOARD STORE == //
let leaderboard: Entities.LeaderboardEntry[] = [];

const readLeaderboard = async (): Promise<Entities.LeaderboardEntry[]> => {
    return structuredClone(leaderboard);
}

const getPlayerInfo = async (username: string): Promise<LeaderboardInfo> => {
    const ranking = leaderboard.findIndex(e => e.username == username) + 1;
    assert(ranking != 0, "Player not found");
    return { ...leaderboard[ranking], ranking };
}

const newPlayer = async (username: string): Promise<number> => {
    assert(!leaderboard.find(e => e.username == username), "Player already exists.");
    leaderboard.push({ username, score: 0 });
    return leaderboard.length;
}

const updatePlayerScore = async (username: string, scoreDelta: number): Promise<number> => {
    const entry = leaderboard.find(e => e.username == username);
    assert(entry, "Player not found");
    entry.score += scoreDelta;
    leaderboard.sort((a, b) => a.score - b.score);
    return leaderboard.findIndex(e => e.username == username) + 1;
}

const dropPlayerFromLeaderboard = async (username: string): Promise<void> => {
    leaderboard = leaderboard.filter(e => e.username != username);
}

const dropLeaderboard = async (): Promise<void> => {
    leaderboard = [];
}

const leaderboardStore = {
    readLeaderboard,
    getPlayerInfo,
    newPlayer,
    updatePlayerScore,
    dropPlayer: dropPlayerFromLeaderboard,
    dropLeaderboard,
}

// == GAME STATS STORE == //
let gameStats: Entities.GameStats | undefined;

const createGameStats = async (props: Entities.GameStats): Promise<void> => {
    gameStats = structuredClone(props);
}

const readGameStats = async (): Promise<Entities.GameStats> => {
    assert(gameStats, "Game stats not currently available.");
    return structuredClone(gameStats);
}

const readGameConfig = async (): Promise<Entities.GameConfiguration> => {
    assert(gameStats, "Game config not currently available.");
    return structuredClone(gameStats.configuration);
}

const readTask = async (taskId: string): Promise<Entities.Task> => {
    assert(gameStats, "Unable to retrieve task. Game stats not currently available.");
    const task = gameStats.configuration.tasks.find(t => t.id == taskId);
    assert(task, "Invalid task ID.");
    return structuredClone(task);
}

const isGameLocked = async (): Promise<boolean> => {
    assert(gameStats, "Game stats not currently available.");
    return gameStats.locked;
}

const writeGameStats = async (props: Partial<Entities.GameStats>): Promise<void> => {
    assert(gameStats, "Game stats not currently available.");
    gameStats = { ...gameStats, ...props };
}

const dropGameStats = async (): Promise<void> => {
    gameStats = undefined;
}

const gameStatsStore = {
    createGameStats,
    readGameStats,
    readGameConfig,
    readTask,
    isGameLocked,
    writeGameStats,
    dropGameStats,
};

// == USER STORE == //
let users: Record<string, Entities.User> = {};

const readUser = async (username: string): Promise<Entities.User> => {
    assert(username in users, "Invalid username");
    return structuredClone(users[username]);
}

const readOptionalUser = async (username: string): Promise<Entities.User | undefined> => {
    return username in users ? structuredClone(users[username]) : undefined;
}

const writeUser = async (username: string, props: Entities.User): Promise<void> => {
    users[username] = structuredClone(props);
}

const dropUser = async (username: string): Promise<void> => {
    delete users[username];
}

const dropUsers = async (usernames?: string[]): Promise<void> => {
    users = {};
}

const userStore = {
    readUser,
    readOptionalUser,
    writeUser,
    dropUser,
    dropUsers,
}

// == APP STORE == //
const appStore = {};

// == MEM DB == //
export default {
    appStore,
    appMetricsStore,
    gameHistoryStore,
    playerStore,
    adminStore,
    leaderboardStore,
    gameStatsStore,
    userStore,
} satisfies DatabaseCtx;