export interface SchedulerCtx {
    schedule: (jobName: string, time: Date, onInvoke: () => void) => Promise<void>;
    earlyInvoke: (jobName: string) => Promise<void>;
    cancelSchedule: (jobName: string) => Promise<void>;
    cancelAllSchedules: () => Promise<void>;
}