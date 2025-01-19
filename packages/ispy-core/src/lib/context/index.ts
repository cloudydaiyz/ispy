import { PartialAll } from "../../util";
import { DatabaseCtx } from "./db"
import { SchedulerCtx } from "./scheduler";
import { CurrentRequest } from "./request";
import { WebsocketOperationsContext } from "./ws-ctx";
import assert from "assert";
import { FileStorageCtx } from "./files";

export * from "./db";
export * from "./files";
export * from "./scheduler";
export * from "./ws-ctx";
export * from "./request";

// Interaction between the app and its infrastructure
// Setup on app setup
export type AppContext = {
    db: DatabaseCtx,
    scheduler: SchedulerCtx,
    files: FileStorageCtx,
}

// Even if not explicitly assigned, all operation functions satisfy this type
export type Operation<I, O> = (c: Context, input: I) => Promise<O>;

// Portion of the context defined once per app, globally
export type GlobalContext = {
    app: AppContext,
    sock: WebsocketOperationsContext,
}

// Portion of the context defined once per request
export type LocalContext = {
    readonly req: CurrentRequest,
}

// Global context is defined initially, and local context is lazily defined during the start of a request.
// For websocket connections, the local context is populated on authenticate.
export type Context = GlobalContext & { local?: LocalContext };

export type ContextAdapter = (c: PartialAll<GlobalContext>) => Promise<void>;

// Merges all partial adapters into a complete adapter
export async function mergeAdapters(adapters: ContextAdapter[]): Promise<GlobalContext> {
    const ctx: PartialAll<Context> = {};
    adapters.forEach(async (adapter) => await adapter(ctx));
    return ctx as GlobalContext;
}