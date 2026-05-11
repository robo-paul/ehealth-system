// backend/services/uploadService.js
const fs = require('fs');
const path = require('path');

class UploadService {
    constructor() {
        this.uploadDir = path.join(__dirname, '../uploads');
        this.ensureUploadDirectory();
    }

    ensureUploadDirectory() {
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    async saveFile(file, userId, recordId) {
        const timestamp = Date.now();
        const safeFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${userId}_${recordId}_${timestamp}_${safeFileName}`;
        const filePath = path.join(this.uploadDir, fileName);
        
        return new Promise((resolve, reject) => {
            const writeStream = fs.createWriteStream(filePath);
            writeStream.write(file.buffer);
            writeStream.end();
            
            writeStream.on('finish', () => {
                resolve({
                    fileName: file.originalname,
                    storedName: fileName,
                    filePath,
                    fileSize: file.size,
                    fileType: file.mimetype
                });
            });
            
            writeStream.on('error', reject);
        });
    }

    async deleteFile(filePath) {
        return new Promise((resolve, reject) => {
            fs.unlink(filePath, (err) => {
                if (err && err.code !== 'ENOENT') {
                    reject(err);
                } else {
                    resolve(true);
                }
            });
        });
    }
}

module.exports = new UploadService();