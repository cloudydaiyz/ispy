import { ContextAdapter, GlobalContext } from "../../lib/context";
import { PartialAll } from "../../util";

import MemDb from "./mem-db";
import MemWs from "./mem-ws";
import MemScheduler from "./mem-scheduler";
import MemFs from "./mem-file";
import assert from "assert";
import { CORE_CANONICAL, TEMPDIR, UI_CANONICAL } from "../../env";

export async function $dbAdapter(): Promise<ContextAdapter> {
    return async function adapter(c: PartialAll<GlobalContext>) {
        c.app ? c.app.db = MemDb : c.app = { db: MemDb };
    }
}

export async function $scheduleAdapter(): Promise<ContextAdapter> {
    return async function adapter(c: PartialAll<GlobalContext>) {
        c.app ? c.app.scheduler = MemScheduler : c.app = { scheduler: MemScheduler };
    }
}

export async function $fileAdapter(): Promise<ContextAdapter> {
    assert(TEMPDIR, "Invalid app setup, must have ISPY_CORE_TEMPDIR environment variable defined.");
    assert(UI_CANONICAL, "Invalid app setup, must have ISPY_UI_CANONICAL environment variable defined.");
    assert(CORE_CANONICAL, "Invalid app setup, must have ISPY_CORE_CANONICAL environment variable defined.");
    return async function adapter(c: PartialAll<GlobalContext>) {
        c.app ? c.app.files = MemFs : c.app = { files: MemFs };
    }
}

export async function $websocketAdapter(): Promise<ContextAdapter> {
    return async function adapter(c: PartialAll<GlobalContext>) {
        c.sock = new MemWs();
    }
}

export async function $fullAdapter(): Promise<ContextAdapter> {
    const adapters = await Promise.all([
        $dbAdapter(),
        $scheduleAdapter(),
        $fileAdapter(),
        $websocketAdapter(),
    ]);

    return async function adapter(c: PartialAll<GlobalContext>) {
        for(const a of adapters) { await a(c) }
    }
}