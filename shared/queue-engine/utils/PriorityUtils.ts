import { JobPriority } from "../enums/JobPriority.js";

export function getPriorityValue(
    priority: JobPriority
): number {

    switch (priority) {

        case JobPriority.HIGH:
            return 3;

        case JobPriority.NORMAL:
            return 2;

        case JobPriority.LOW:
            return 1;

        default:
            return 0;
    }
}

export function getEffectivePriority(
    priority: JobPriority,
    queuedAt: Date,
    now: Date = new Date()
): number {

    const basePriority = getPriorityValue(priority);

    const waitingTimeMs =
        now.getTime() - queuedAt.getTime();

    const waitingTimeSeconds =
        Math.floor(waitingTimeMs / 1000);

    const agingLevels =
        Math.floor(waitingTimeSeconds / 10);

    return Math.min(
        basePriority + agingLevels,
        getPriorityValue(JobPriority.HIGH)
    );
}