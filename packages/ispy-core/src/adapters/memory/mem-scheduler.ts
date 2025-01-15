import { ScheduledJob, SchedulerCtx } from "../../lib/context";

import assert from "assert";
import scheduler from "node-schedule";

const jobOperations: Record<string, () => Promise<void>> = {};
const activeJobs: Record<string, scheduler.Job> = {};

const registerJob = async (jobName: ScheduledJob, onInvoke?: () => Promise<void>): Promise<void> => {
    assert(onInvoke, "onInvoke required to register job");
    jobOperations[jobName] = onInvoke;
}

const schedule = async (jobName: ScheduledJob, time: Date): Promise<void> => {
    if(activeJobs[jobName]) {
        activeJobs[jobName].reschedule(time);
        return;
    }

    const onInvoke = () => jobOperations[jobName]().then(() => { delete activeJobs[jobName] });
    const job = scheduler.scheduleJob(time, onInvoke);
    activeJobs[jobName] = job;
}

const cancelSchedule = async (jobName: ScheduledJob): Promise<void> => {
    if(jobName in activeJobs) {
        activeJobs[jobName].cancel();
        delete activeJobs[jobName];
    }
}

export default { registerJob, schedule, cancelSchedule } satisfies SchedulerCtx;