import multer = require('multer')
import { v4 as uuid } from 'uuid'
import { Bucket, CreateWriteStreamOptions, Storage } from '@google-cloud/storage'

export default class MulterGoogleCloudStorage implements multer.StorageEngine {

	private bucket: Bucket
	private storage: Storage
	private options: any
	private blobFile: any = { destination: '', filename: '' }

	constructor(opts: any) {

		if (!opts.bucket) throw new Error('You have to specify bucket for Google Cloud Storage to work.')
		if (!opts.projectId) throw new Error('You have to specify project id for Google Cloud Storage to work.')
		if (!opts.keyFilename && !opts.credentials) throw new Error('You have to specify credentials key file for Google Cloud Storage to work.')

		this.options = opts

		this.storage = new Storage({
			projectId: opts.projectId,
			keyFilename: opts.keyFilename,
			credentials: opts.credentials
		})

		this.bucket = this.storage.bucket(opts.bucket)

	}
		
	getFilename( req: any, file: any, cb: any ) {
		cb(null, uuid())
	}

	getDestination( req: any, file: any, cb: any ) {
		cb( null, '' )
	}
	
	getContentType( req: any, file: any ) {
		if (typeof file.mimetype === 'string') return file.mimetype
		return undefined
	}

	private setBlobFile( req: any, file: any ) {

		this.getDestination(req, file, (err: any, destination: any) => {
			if (err) return false
			let escDestination = ''
			escDestination += destination.replace(/^\.+/g, '').replace(/^\/+|\/+$/g, '')
			if (escDestination !== '') escDestination = escDestination + '/'
			this.blobFile.destination = escDestination
		})
		
		this.getFilename(req, file, (err: any, filename: any) => {
			if (err) return false
			this.blobFile.filename = filename
		})

		return true
	}

	_handleFile = (req: any, file: any, cb: any) => {

		let originalname = file.originalname

		if (this.setBlobFile( req, file )) {
			var blobName = this.blobFile.destination + this.blobFile.filename
			var blob = this.bucket.file(blobName)

			const streamOpts: CreateWriteStreamOptions = {
				predefinedAcl: this.options.acl || 'private'
			}

			const contentType = this.getContentType(req, file)
			if (contentType) streamOpts.metadata = { contentType }

			const blobStream = blob.createWriteStream(streamOpts)
			file.stream.pipe(blobStream)
				.on('error', (err: any) => cb(err))
				.on('finish', (file: any) => {
					const name = blob.metadata.name
					const filename = name.substr(name.lastIndexOf('/') + 1)
					cb(null, {
						bucket: blob.metadata.bucket,
						destination: this.blobFile.destination,
						originalname,
						filename,
						path: `${this.blobFile.destination}${filename}`,
						contentType: blob.metadata.contentType,
						size: blob.metadata.size,
						uri: `gs://${blob.metadata.bucket}/${this.blobFile.destination}${filename}`,
						linkUrl: `https://storage.cloud.google.com/${blob.metadata.bucket}/${this.blobFile.destination}${filename}`,
						selfLink: blob.metadata.selfLink
					})
				})
		}
	}
	_removeFile = (req: any, file: any, cb: any) => {
		if (this.setBlobFile( req, file )) {
			var blobName = this.blobFile.destination + this.blobFile.filename
			var blob = this.bucket.file(blobName)
			blob.delete()
		}
	}
}