import { Context } from "./context";

function withContext<T, U>(
    ctx: Context, 
    func: (ctx: Context, ...args: T[]) => U
) : (...args: T[]) => U {
    return (...args: T[]) => func(ctx, ...args);
}