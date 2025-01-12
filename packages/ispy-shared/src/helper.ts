// Helper functions

export async function delay(timeout: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, timeout));
}

/**
 * This linked list allows you to opt in to use an index stored with elements to:
 * 
 * 1) retrieve data about a specific element in the list and 
 * 2) delete elements from an arbitrary position in the list 
 * 
 * in `O(1)` time.
 */
export class IndexedLinkedList { 
    enqueue() {}
    enqueueWithIndex() {}
    peekFront() {}
    peekWithTag() {}
    dequeue() {}
    dequeueWithIndex() {}
}