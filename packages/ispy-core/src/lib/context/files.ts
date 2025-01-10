export interface FileStorageCtx {
    createFile: () => Promise<void>;
    deleteFile: () => Promise<void>;
}