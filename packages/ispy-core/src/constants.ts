import { Requests } from "@cloudydaiyz/ispy-shared";
import path from "path";
import { CORE_CANONICAL } from "./env";

export const EXPORT_PDF_FILENAME = "ispy-game-export.pdf";
export const EXPORT_GAME_PDF_ROUTE = CORE_CANONICAL ? path.join(CORE_CANONICAL, Requests.Paths.exportGamePdf, "file") : undefined;
export const AUTH_SALT_ROUNDS = 10;