// Helper functions

export async function delay(timeout: number) {
    return new Promise<void>((resolve) => {
        setTimeout(() => resolve(), timeout);
    });
}

export class Queue { priority?: boolean; }