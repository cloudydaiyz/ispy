import * as Api from "./entities";

// Utility Types

export type OmitAuth<T> = Omit<T, keyof Api.BasicAuth | keyof Api.BearerAuth>;