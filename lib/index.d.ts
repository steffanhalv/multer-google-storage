import multer = require('multer');
export default class MulterGoogleCloudStorage implements multer.StorageEngine {
    private bucket;
    private storage;
    private options;
    private blobFile;
    constructor(opts: any);
    getFilename(req: any, file: any, cb: any): void;
    getDestination(req: any, file: any, cb: any): void;
    getContentType(req: any, file: any): any;
    private setBlobFile;
    _handleFile: (req: any, file: any, cb: any) => void;
    _removeFile: (req: any, file: any, cb: any) => void;
}
