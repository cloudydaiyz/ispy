import { Readable } from "stream";
import path from "path";
import fs from "fs";
import assert from "assert";
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import stream from 'node:stream';

import { TEMPDIR, UI_CANONICAL } from "../../env";
import { EXPORT_PDF_FILENAME } from "../../constants";
import { FileStorageCtx } from "../../lib/context";

const EXPORT_FILEPATH = path.join(TEMPDIR!, EXPORT_PDF_FILENAME);

async function createExportPdfFile(taskIds: string[]): Promise<void> {
    path.join(UI_CANONICAL!, 'game', taskIds[0]);

    // Create the PDF
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream('output.pdf'));

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
    return new Promise((res, rej) => {
        fs.writeFile(EXPORT_FILEPATH, '', (err) => {
            if(err) rej(err);
            res();
        });
    });
}

async function getExportPdfFile(): Promise<Readable> {
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
    getExportPdfFile,
    deleteExportPdfFile
} satisfies FileStorageCtx;