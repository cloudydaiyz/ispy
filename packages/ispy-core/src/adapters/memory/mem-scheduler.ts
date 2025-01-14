import { SchedulerCtx } from "../../lib/context";

const schedule = async (jobName: string, time: Date, onInvokeFunction: string): Promise<void> => {
        
}

const cancelSchedule = async (jobName: string): Promise<void> => {

}

export default { schedule, cancelSchedule } satisfies SchedulerCtx;