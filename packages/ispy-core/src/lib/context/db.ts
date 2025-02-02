import { Entities } from "@cloudydaiyz/ispy-shared";

// In redis adapter: Redis hash
interface UserStore {
    readUser: (username: string) => Promise<Entities.User>;
    readOptionalUser: (username: string) => Promise<Entities.User | undefined>;
    // Cannot edit user info once it's stored
    // User w/ username must not already exist in the db
    writeUser: (username: string, props: Entities.User) => Promise<void>;
    dropUser: (username: string) => Promise<void>;
    dropUsers: (usernames?: string[]) => Promise<void>;
}

// In redis adapter: Redis json
interface GameStatsStore {
    readGameStats: () => Promise<Entities.GameStats>;
    readGameConfig: () => Promise<Entities.GameConfiguration>;
    readTask: (taskId: string) => Promise<Entities.Task>;
    isGameLocked: () => Promise<boolean>;
    createGameStats: (props: Entities.GameStats) => Promise<void>;
    writeGameStats: (props: Partial<Entities.GameStats>) => Promise<void>;
    dropGameStats: () => Promise<void>;
}

// In redis adapter: Redis sorted set
export type LeaderboardInfo = Entities.LeaderboardEntry & { ranking: number };
interface LeaderboardStore {
    readLeaderboard: () => Promise<Entities.LeaderboardEntry[]>;
    getPlayerInfo: (username: string) => Promise<LeaderboardInfo>;
    // Returns the player's rank
    newPlayer: (username: string) => Promise<number>;
    // Returns the player's new rank
    updatePlayerScore: (username: string, scoreDelta: number) => Promise<number>;
    dropPlayer: (username: string) => Promise<void>;
    // Clears the leaderboard
    dropLeaderboard: () => Promise<void>;
}

// In redis adapter: Redis sorted set + hash
interface AdminStore {
    readAdmin: (username: string) => Promise<Entities.Admin>;
    readOptionalAdmin: (username: string) => Promise<Entities.Admin | undefined>;
    createAdmins: (props: Entities.Admin[]) => Promise<void>;
    writeAdmin: (username: string, props: Partial<Entities.Admin>) => Promise<void>;
    dropAdmin: (username: string) => Promise<void>;
    dropAdmins: () => Promise<void>;
}

// In redis adapter: Redis json
// Not redis hash (for player) + stream (for tasks submitted) since the data is always updated & accessed together
// Serialize responses in task submission to a string
interface PlayerStore {
    readPlayer: (username: string) => Promise<Entities.EnhancedPlayer>;
    createPlayer: (username: string, props: Entities.EnhancedPlayer) => Promise<void>;
    writePlayer: (username: string, props: Partial<Entities.EnhancedPlayer>) => Promise<void>;
    dropPlayer: (username: string) => Promise<void>;
    pushTaskSubmission: (username: string, props: Entities.TaskSubmission) => Promise<void>;
    dropPlayers: () => Promise<void>;
}

// In redis adapter: Redis json
interface GameHistoryStore {
    readGameHistory: () => Promise<Entities.Game[]>;
    pushGame: (results: Entities.Game) => Promise<void>;
}

// In redis adapter: Redis hash
interface AppMetricsStore {
    readAppMetrics: () => Promise<Entities.AppMetrics>;
    createAppMetrics: () => Promise<void>;
    writeAppMetrics: (props: Partial<Entities.AppMetrics>) => Promise<void>;
}

interface AppStore {
    // // Watches the keys used in subsequent calls to the database up until
    // // `commitTransaction` is called. Only available in Redis adapter
    // startWatch?: () => Promise<void>;
    // startTransaction: () => Promise<void>;
    // commitTransaction: () => Promise<void>;
    // // Cancel, but not roll back, the transaction
    // // https://redis.io/docs/latest/develop/interact/transactions/#what-about-rollbacks
    // cancelTransaction: () => Promise<void>;
}

export type DatabaseCtx = {
    appStore: AppStore,
    appMetricsStore: AppMetricsStore,
    gameHistoryStore: GameHistoryStore,
    playerStore: PlayerStore,
    adminStore: AdminStore,
    leaderboardStore: LeaderboardStore,
    gameStatsStore: GameStatsStore,
    userStore: UserStore,
}