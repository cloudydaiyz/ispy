// Helper functions

export async function delay(timeout: number): Promise<void> {
    return new Promise<void>((resolve) => {
        setTimeout(() => resolve(), timeout);
    });
}

export function getCurrentPointValue(
    currentTime: number, 
    initialValue: number, 
    startTime: number, 
    endTime: number
) : number {
    return Math.floor(
        (initialValue / (startTime - endTime)) * currentTime 
        - ((initialValue * endTime) / (startTime - endTime))
    );
}

/**
 * This linked list allows you to opt in to use tags stored with elements to:
 * 
 * 1) retrieve data about a specific element in the list and 
 * 2) delete elements from an arbitrary position in the list 
 * 
 * in `O(1)` time.
 */
export class TaggedLinkedList { 
    enqueue() {}
    enqueueWithTag() {}
    peekFront() {}
    peekWithTag() {}
    dequeue() {}
    dequeueWithTag() {}
}