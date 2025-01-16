import { $fullAdapter as $mem } from "../adapters/memory/mem-adapter";
import { binding as bindExpress } from "../bindings/express/express-bind";
import { mergeAdapters } from "../lib/context";
import { createLibrary } from "../lib/library";

async function main() {
    const mem = await $mem();
    const globalCtx = await mergeAdapters([mem]);
    const lib = createLibrary(globalCtx);
    bindExpress(lib);
}

main();