import { Readable } from "stream";

export interface FileStorageCtx {
    createExportPdfFile: (taskIds: string[]) => Promise<void>;
    getExportPdfLink: () => Promise<string>;
    getExportPdfFile: () => Promise<Readable>;
    deleteExportPdfFile: () => Promise<void>;
}