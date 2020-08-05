"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var uuid_1 = require("uuid");
var storage_1 = require("@google-cloud/storage");
var MulterGoogleCloudStorage = /** @class */ (function () {
    function MulterGoogleCloudStorage(opts) {
        var _this = this;
        this.blobFile = { destination: '', filename: '' };
        this._handleFile = function (req, file, cb) {
            var originalname = file.originalname;
            if (_this.setBlobFile(req, file)) {
                var blobName = _this.blobFile.destination + _this.blobFile.filename;
                var blob = _this.bucket.file(blobName);
                var streamOpts = {
                    predefinedAcl: _this.options.acl || 'private'
                };
                var contentType = _this.getContentType(req, file);
                if (contentType)
                    streamOpts.metadata = { contentType: contentType };
                var blobStream = blob.createWriteStream(streamOpts);
                file.stream.pipe(blobStream)
                    .on('error', function (err) { return cb(err); })
                    .on('finish', function (file) {
                    var name = blob.metadata.name;
                    var filename = name.substr(name.lastIndexOf('/') + 1);
                    cb(null, {
                        bucket: blob.metadata.bucket,
                        destination: _this.blobFile.destination,
                        originalname: originalname,
                        filename: filename,
                        path: "" + _this.blobFile.destination + filename,
                        contentType: blob.metadata.contentType,
                        size: blob.metadata.size,
                        uri: "gs://" + blob.metadata.bucket + "/" + _this.blobFile.destination + filename,
                        linkUrl: "https://storage.cloud.google.com/" + blob.metadata.bucket + "/" + _this.blobFile.destination + filename,
                        selfLink: blob.metadata.selfLink
                    });
                });
            }
        };
        this._removeFile = function (req, file, cb) {
            if (_this.setBlobFile(req, file)) {
                var blobName = _this.blobFile.destination + _this.blobFile.filename;
                var blob = _this.bucket.file(blobName);
                blob.delete();
            }
        };
        if (!opts.bucket)
            throw new Error('You have to specify bucket for Google Cloud Storage to work.');
        if (!opts.projectId)
            throw new Error('You have to specify project id for Google Cloud Storage to work.');
        if (!opts.keyFilename && !opts.credentials)
            throw new Error('You have to specify credentials key file for Google Cloud Storage to work.');
        this.options = opts;
        this.storage = new storage_1.Storage({
            projectId: opts.projectId,
            keyFilename: opts.keyFilename,
            credentials: opts.credentials
        });
        this.bucket = this.storage.bucket(opts.bucket);
    }
    MulterGoogleCloudStorage.prototype.getFilename = function (req, file, cb) {
        cb(null, uuid_1.v4());
    };
    MulterGoogleCloudStorage.prototype.getDestination = function (req, file, cb) {
        cb(null, '');
    };
    MulterGoogleCloudStorage.prototype.getContentType = function (req, file) {
        if (typeof file.mimetype === 'string')
            return file.mimetype;
        return undefined;
    };
    MulterGoogleCloudStorage.prototype.setBlobFile = function (req, file) {
        var _this = this;
        this.getDestination(req, file, function (err, destination) {
            if (err)
                return false;
            var escDestination = '';
            escDestination += destination.replace(/^\.+/g, '').replace(/^\/+|\/+$/g, '');
            if (escDestination !== '')
                escDestination = escDestination + '/';
            _this.blobFile.destination = escDestination;
        });
        this.getFilename(req, file, function (err, filename) {
            if (err)
                return false;
            _this.blobFile.filename = filename;
        });
        return true;
    };
    return MulterGoogleCloudStorage;
}());
exports.default = MulterGoogleCloudStorage;
//# sourceMappingURL=index.js.map