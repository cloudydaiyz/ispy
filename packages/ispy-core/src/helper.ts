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