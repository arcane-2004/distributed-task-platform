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