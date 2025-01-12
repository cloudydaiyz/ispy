export interface SchedulerCtx {
    // schedule job at a specific time
    // reschedules job if it already exists
    schedule: (jobName: string, time: Date, onInvokeFunction: string, interval?: number) => Promise<void>;
    // invokes job if it hasn't been invoked already
    // does nothing if it's already removed
    earlyInvoke: (jobName: string) => Promise<void>;
    // removes the job if it's not already removed
    // does nothing if it's already removed
    cancelSchedule: (jobName: string) => Promise<void>;
    // removes all jobs
    cancelAllSchedules: () => Promise<void>;
}