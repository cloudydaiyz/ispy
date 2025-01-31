export type ScheduledJob = "start-game" | "end-game";

export interface SchedulerCtx {
    // Sets up information about a specific job
    registerJob?: (jobName: ScheduledJob, onInvoke?: () => Promise<void>) => Promise<void>,
    // Schedule job at a specific time
    // Reschedules job if it already exists
    schedule: (jobName: ScheduledJob, time: Date) => Promise<void>;
    // Removes the job if it's not already removed
    // Does nothing if it's already removed
    cancelSchedule: (jobName: ScheduledJob) => Promise<void>;
}