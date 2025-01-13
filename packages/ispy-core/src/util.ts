export type AnyFunction = (...args: any) => any;
export type Promisified<F extends AnyFunction> = ReturnType<F> extends Promise<any> ? F : (...args: Parameters<F>) => Promise<ReturnType<F>>;
export type PromisifyAll<T extends Record<string, any>> = T[keyof T] extends AnyFunction ? {
    [key in keyof T]: T[key] extends AnyFunction 
        ? ReturnType<T[key]> extends Promise<any> 
            ? T[key]
            : Promisified<T[key]> 
        : T[key];
} : T;

export function getCurrentPointValue(
    currentTime: number, 
    initialValue: number, 
    startTime: number, 
    endTime: number,
    success: boolean,
) : number {
    return success 
        ? Math.floor(
            (initialValue / (startTime - endTime)) * currentTime 
            - ((initialValue * endTime) / (startTime - endTime))
        )
        : Math.floor(
            (initialValue / (endTime - startTime)) * currentTime 
            - ((initialValue * endTime) / (endTime - startTime))
        );
}