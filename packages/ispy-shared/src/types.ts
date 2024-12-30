import * as Api from "./models";

export type GameExportPdf = { link: string };

export type AppMetrics = {
    numPlayers: number;
    numAdmins: number;
    gameRunning: boolean;
    gameState: Api.GameState;
    gameLocked: boolean;
}