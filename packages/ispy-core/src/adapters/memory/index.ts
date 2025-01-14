import { ContextAdapter, GlobalContext } from "../../lib/context";
import { PartialAll } from "../../util";

import MemDb from "./mem-db";
import MemWs from "./mem-ws";

export async function $dbAdapter(): Promise<ContextAdapter> {
    return async function adapter(c: PartialAll<GlobalContext>) {
        c.app ? c.app.db = MemDb : c.app = { db: MemDb };
    }
}

export async function $scheduleAdapter(): Promise<ContextAdapter> {
    return async function adapter(c: PartialAll<GlobalContext>) {
        c.app ? c.app.scheduler = undefined : c.app = { scheduler: undefined };
    }
}

export async function $fileAdapter(): Promise<ContextAdapter> {
    return async function adapter(c: PartialAll<GlobalContext>) {
        
    }
}

export async function $websocketAdapter(): Promise<ContextAdapter> {
    return async function adapter(c: PartialAll<GlobalContext>) {
        c.sock = new MemWs();
    }
}

export async function $allAdapter(): Promise<ContextAdapter> {
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