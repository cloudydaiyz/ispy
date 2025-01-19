import { Readable } from "stream";

export interface FileStorageCtx {
    createExportPdfFile: (taskIds: string[]) => Promise<void>;
    getExportPdfFile: () => Promise<Readable>;
    deleteExportPdfFile: () => Promise<void>;
}