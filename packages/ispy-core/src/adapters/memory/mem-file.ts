import path from "path";
import fs from "fs";
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import stream, { Readable } from "stream";

import { TEMPDIR, UI_CANONICAL } from "../../env";
import { EXPORT_GAME_PDF_ROUTE, EXPORT_PDF_FILENAME } from "../../constants";
import { FileStorageCtx } from "../../lib/context";
import { IllegalStateError } from "../../lib/errors";

const EXPORT_FILEPATH = path.join(TEMPDIR!, EXPORT_PDF_FILENAME);

async function createExportPdfFile(taskIds: string[]): Promise<void> {
    path.join(UI_CANONICAL!, 'game', taskIds[0]);

    // Create the PDF
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(EXPORT_FILEPATH));

    // Document header
    doc
        .font('Helvetica-Bold')
        .fontSize(20)
        .text('ispy Game Export', { align: 'center' })
        .moveDown(1);

    for(let i = 0; i < taskIds.length; i++) {
        const taskId = taskIds[i];

        // Construct the URL to embed as link in PDF for current task
        const params = new URLSearchParams({ taskId: taskIds[0] });
        const url = new URL(path.join(UI_CANONICAL!, 'game'));
        url.search = params.toString();
        const link = url.toString();

        // Add task header
        doc
            .font('Helvetica-Bold')
            .fillColor('black')
            .text(`Task ${i + 1} (ID: ${taskId})`);
        doc
            .font('Helvetica')
            .fillColor('blue')
            .text('URL: ' + link, { link });

        let qrstream = new stream.PassThrough();
        let buf = Buffer.alloc(0);
        let bufs: Buffer[] = [];
        
        // Add QR code for the task
        const createimg = new Promise<void>(async (res, rej) => {
            qrstream
            .on('data', (d) => {
                bufs.push(d);
            })
            .on('end', () => {
                buf = Buffer.concat(bufs);

                doc.image(buf, {
                    link,
                    fit: [100, 100],
                    align: 'center',
                    valign: 'center',
                });
                res();
            })
            .on('error', rej);
            await QRCode.toFileStream(qrstream, 'I am a pony!');
        });
        await createimg;
        doc.moveDown(7);
        doc.save();
    }
    
    // Finalize and persist PDF file
    doc.end();
}

async function getExportPdfLink(): Promise<string> {
    IllegalStateError.assert(fs.existsSync(EXPORT_FILEPATH), "Game export does not currently exist.");
    return EXPORT_GAME_PDF_ROUTE!;
}

async function getExportPdfFile(): Promise<Readable> {
    IllegalStateError.assert(fs.existsSync(EXPORT_FILEPATH), "Game export does not currently exist.");
    return fs.createReadStream(EXPORT_FILEPATH);
}

async function deleteExportPdfFile(): Promise<void> {
    if(fs.existsSync(EXPORT_FILEPATH)) {
        return new Promise((res) => {
            fs.rm(EXPORT_FILEPATH, (err) => {
                if(err) {
                    console.warn('Unable to delete game export. Reason:');
                    console.warn(err);
                }
                res();
            });
        });
    };
}

export default {
    createExportPdfFile,
    getExportPdfLink,
    getExportPdfFile,
    deleteExportPdfFile
} satisfies FileStorageCtx;