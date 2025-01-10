import { DatabaseCtx } from "./db"
import { SchedulerCtx } from "./scheduler";

export type Context = {
    db: DatabaseCtx,
    scheduler: SchedulerCtx,
};