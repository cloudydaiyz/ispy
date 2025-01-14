export type ScheduledJob = "start-game" | "end-game";

export interface SchedulerCtx {
    // sets up information about a specific job
    registerJob?: (jobName: ScheduledJob, onInvoke?: () => Promise<void>) => Promise<void>,
    // schedule job at a specific time
    // reschedules job if it already exists
    schedule: (jobName: ScheduledJob, time: Date) => Promise<void>;
    // removes the job if it's not already removed
    // does nothing if it's already removed
    cancelSchedule: (jobName: ScheduledJob) => Promise<void>;
}