// API entity models

import { z } from "zod";

// Low level models

export const UsernameModel = z.object({ 
    username: z.string().refine(s => 8 <= s.length && s.length <= 12)
});

export const PasswordModel = z.object({ 
    password: z.string().refine(s => 8 <= s.length && s.length <= 100) 
});

export const AccessTokenModel = z.object({ accessToken: z.string() });
export const RefreshTokenModel = z.object({ refreshToken: z.string() });

export const BasicAuthModel = UsernameModel.merge(PasswordModel);
export const BearerAuthModel = AccessTokenModel.merge(RefreshTokenModel);

export const TaskIdModel = z.object({ taskId: z.string() });
export const GameIdModel = z.object({ gameId: z.string() });
export const GameExportModel = z.object({ link: z.string() });

export type Username = z.infer<typeof UsernameModel>;
export type Password = z.infer<typeof PasswordModel>;
export type AccessToken = z.infer<typeof AccessTokenModel>;
export type RefreshToken = z.infer<typeof RefreshTokenModel>;
export type BasicAuth = z.infer<typeof BasicAuthModel>;
export type BearerAuth = z.infer<typeof BearerAuthModel>;
export type TaskId = z.infer<typeof TaskIdModel>;
export type GameId = z.infer<typeof GameIdModel>;
export type GameExport = z.infer<typeof GameExportModel>;

// Main Entities

export const UserRoleModel = z.enum(["player", "host", "admin"]);

export const UserModel = z.object({
    id: z.string(),
    username: UsernameModel,
    password: PasswordModel,
    role: UserRoleModel,
});

const TaskSuccessValueModel = z.number().int().refine(n => 0 <= n && n <= 100);
const TaskScaleSuccessValueModel = z.number().int().refine(n => -1 <= n && n <= 1);
const TaskFailValueModel = z.number().int().refine(n => 0 <= n && n <= 100);
const TaskScaleFailValueModel = z.number().int().refine(n => -1 <= n && n <= 1);
const TaskResponseModel = z.object({
    // automatically assigned on game creation
    id: z.string().optional(),
    content: z.string().refine(s => s.length <= 150),
    correct: z.boolean(),
});

const RawTaskModel = z.object({
    // automatically assigned on game creation
    id: z.string().optional(),

    title: z.string().refine(s => 0 < s.length && s.length < 50),

    prompt: z.string().refine(s => s.length <= 500),

    type: z.enum(["no response", "single select", "multi select", "multiple choice"]),

    responses: z.array(TaskResponseModel),

	// 0 for indefinite
	// integer, [1, max # of responses - 1]
    maxAttempts: z.number().int().refine(n => n >= 0),

    required: z.boolean(),

    // if true, the success value of this task will be hidden from the player, and hides whether it's scaled over time (both shown by default)
	// false by default
    successValue: TaskSuccessValueModel,

    hideSuccessValue: z.boolean(),

    // integer, [-1, 0, 1]
    // if true, the value for completing this task successfully will be scaled down linearly as time progresses
    // -1 for scaled down, 0 for no scaling, 1 for scaled up
    scaleSuccessValue: TaskScaleSuccessValueModel,

    successMessage: z.string().refine(s => s.length <= 500).optional(),

    failValue: TaskFailValueModel,

    // if true, the fail value of this task will be hidden from the player, and hides whether it's scaled over time (both shown by default)
    // false by default
    hideFailValue: z.boolean(),

    // integer, [-1, 0, 1]
    // if true, the value for failing this task will be scaled down linearly as time progresses
    // -1 for scaled down, 0 for no scaling, 1 for scaled up
    scaleFailValue: TaskScaleFailValueModel,

    // max 500 ASCII characters
    // shows when you have used ALL attempts
    // undefined by default for 0 max attempts
    failMessage: z.string().refine(s => s.length <= 500).optional(),
});

export const TaskModel = RawTaskModel.refine(o => (
    o.maxAttempts <= o.responses.length - 1 
    && o.type == "single select" ? o.responses.length == 1
        : o.type == "multi select" ? 0 <= o.responses.length && o.responses.length <= 4
        : o.type == "multiple choice" ? 2 <= o.responses.length && o.responses.length <= 4
        : o.responses.length == 0
));

export const PublicTaskModel = RawTaskModel.omit({
    successValue: true,
    scaleSuccessValue: true,
    failValue: true,
    scaleFailValue: true,
    responses: true,
}).extend({
    successValue: TaskSuccessValueModel.optional(),
    scaleSuccessValue: TaskScaleSuccessValueModel.optional(),
    failValue: TaskFailValueModel.optional(),
    scaleFailValue: TaskScaleFailValueModel.optional(),
    responses: z.array(TaskResponseModel.omit({ correct: true })),
});

export const GameConfigurationModel = z.object({
    title: z.string(),

    // between 1 and 20 tasks must be defined
    // at least 1 required task must be defined
    tasks: z.array(TaskModel).refine(a => 1 <= a.length && a.length <= 20 && a.find(t => t.required)),

    // the number of users who must complete all required tasks before the game is considered complete
    // integer, [0, maxPlayers]
    // cannot equal 0 if `continueOnCompletion` is true
    minPlayersToComplete: z.number().int().refine(n => 0 <= n),

	// true if the game should continue even if it's completed
    continueOnCompletion: z.boolean(),

	// integer, [0, 100]
    minPlayers: z.number().int().refine(n => 0 <= n && n <= 100),

	// integer, [minPlayers, 100]
    maxPlayers: z.number().int().refine(n => n <= 100),

    // date, [60 + current time, 86400 + current time]
    startDate: z.date(),

    // date, [60 + startDate, 86400 + startDate]
    // cannot be defined if time limit is defined
    // host can always manually end the game even if the time limit isn't reached
    endDate: z.date(),

    // default: false
    lockedWhileRunning: z.boolean(),
}).refine(o => {
    const timeDelta = o.endDate.getTime() - o.startDate.getTime();
    return (
        (!o.continueOnCompletion || o.minPlayersToComplete !== 0) 
        && o.minPlayersToComplete <= o.maxPlayers
        && o.minPlayers <= o.maxPlayers
        && 60000 <= timeDelta && timeDelta <= 86400000
    );
});

export const GameStateModel = z.enum(["not ready", "ready", "running", "ended"]);

export const GameStatsModel = z.object({
    id: z.string(),

    // username of the host
    host: z.string(),

    configuration: GameConfigurationModel,

    state: GameStateModel,

    locked: z.boolean(),

    players: z.string().array(),

    admins: z.string().array(),

    startTime: z.date().nullable(),

    endTime: z.date().nullable(),

    completed: z.boolean(),
});

export const PublicGameStatsModel = GameStatsModel.omit({
    host: true,
    configuration: true,
    players: true,
    admins: true,
});

export const LeaderboardEntryModel = z.object({ 
    username: z.string(), 
    score: z.number() 
});

export const AdminModel = z.object({
    username: z.string(),
    password: z.string(),
    userId: z.string().optional(),
});

export const TaskSubmissionModel = z.object({
    taskId: z.string(),
    title: z.string(),
    submitTime: z.date(),
    responseId: z.string(),
    responseContent: z.string(),
    correct: z.boolean(),
    pointsDelta: z.number(),
});

export const PlayerModel = z.object({
    username: z.string(),
    points: z.number(),
    ranking: z.number(),
    completed: z.boolean(),
    pointsForNextRank: z.number(),
});

export const EnhancedPlayerModel = PlayerModel.extend({
    tasksSubmitted: TaskSubmissionModel.array(),
});

export const GameModel = z.object({
    gameStats: GameStatsModel,
    leaderboard: LeaderboardEntryModel.array(),
});

export const GameResultsModel = z.object({
    host: z.string(),
    players: EnhancedPlayerModel.array(),
});

export const GameHistoryModel = z.object({
    results: GameResultsModel.array(),
});

export type UserRole = z.infer<typeof UserRoleModel>;
export type User = z.infer<typeof UserModel>;
export type Task = z.infer<typeof TaskModel>;
export type PublicTask = z.infer<typeof PublicTaskModel>;
export type GameConfiguration = z.infer<typeof GameConfigurationModel>;
export type GameState = z.infer<typeof GameStateModel>;
export type GameStats = z.infer<typeof GameStatsModel>;
export type PublicGameStats = z.infer<typeof PublicGameStatsModel>;
export type LeaderboardEntry = z.infer<typeof LeaderboardEntryModel>;
export type Admin = z.infer<typeof AdminModel>;
export type TaskSubmission = z.infer<typeof TaskSubmissionModel>;
export type Player = z.infer<typeof PlayerModel>;
export type EnhancedPlayer = z.infer<typeof EnhancedPlayerModel>;
export type Game = z.infer<typeof GameModel>;
export type GameResults = z.infer<typeof GameResultsModel>;
export type GameHistory = z.infer<typeof GameHistoryModel>;

export type AppMetrics = {
    numPlayers: number;
    numAdmins: number;
    gameRunning: boolean;
    gameState: GameState;
    gameLocked: boolean;
}