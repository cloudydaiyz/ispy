import { DatabaseCtx } from "./db"
import { SchedulerCtx } from "./scheduler";

export type AppContext = {
    db: DatabaseCtx,
    scheduler: SchedulerCtx,
}

type RequestContext = {
    username?: string,
}

export type Context = {
    app: AppContext,
    req: RequestContext,
};