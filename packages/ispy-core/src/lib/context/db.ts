import { Entities } from "@cloudydaiyz/ispy-shared";

// redis hash
interface UserStore {
    readUser: (username: string) => Promise<Entities.User>;
    writeUser: (username: string, props: Partial<Entities.User>) => Promise<void>;
    dropUser: (username: string) => Promise<void>;
}

// redis json
interface GameStatsStore {
    readGameStats: () => Promise<Entities.GameStats>;
    writeGameStats: (props: Partial<Entities.GameStats>) => Promise<void>;
    dropGameStats: () => Promise<void>;
}

// redis sorted set
type LeaderboardInfo = Entities.LeaderboardEntry & { ranking: number };
interface LeaderboardStore {
    readLeaderboard: () => Promise<Entities.LeaderboardEntry[]>;
    getPlayerInfo: (username: string) => Promise<LeaderboardInfo>;
    // returns the player's rank
    newPlayer: (username: string) => Promise<number>;
    // returns the player's new rank
    updatePlayerScore: (username: string, score: number) => Promise<number>;
    dropPlayer: (username: string) => Promise<void>;
    dropLeaderboard: () => Promise<void>;
}

// redis sorted set + hash
interface AdminStore {
    readAdmin: (username: string) => Promise<Entities.Admin>;
    writeAdmin: (username: string, props: Partial<Entities.Admin>) => Promise<void>;
    dropAdmins: () => Promise<void>;
}

// redis json
interface PlayerStore {
    readPlayer: (username: string) => Promise<Entities.EnhancedPlayer>;
    writePlayer: (username: string, props: Partial<Entities.EnhancedPlayer>) => Promise<void>;
    dropPlayer: (username: string) => Promise<void>;
    dropPlayers: () => Promise<void>;
}

// redis json
interface GameHistoryStore {
    readGameHistory: () => Promise<Entities.Game[]>;
    pushGame: (results: Entities.Game) => Promise<void>;
    dropGameHistory: () => Promise<void>;
}

// redis hash
interface AppMetricsStore {
    readAppMetrics: () => Promise<Entities.AppMetrics>;
    writeAppMetrics: (props: Entities.AppMetrics) => Promise<void>;
}

interface AppStore {
    // clears everything except game history
    clearGame: () => Promise<void>;
}

export type DatabaseCtx = AppStore
    & AppMetricsStore
    & GameHistoryStore
    & PlayerStore
    & AdminStore
    & LeaderboardStore
    & GameStatsStore
    & UserStore;