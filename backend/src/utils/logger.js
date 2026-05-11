const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logDir = path.join(__dirname, '../../logs');
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    formatMessage(level, message) {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] ${level.toUpperCase()}: ${message}\n`;
    }

    writeToFile(filename, message) {
        const filePath = path.join(this.logDir, filename);
        fs.appendFileSync(filePath, message);
    }

    info(message) {
        const formattedMessage = this.formatMessage('info', message);
        console.log('\x1b[32m%s\x1b[0m', formattedMessage.trim()); // Green
        this.writeToFile('combined.log', formattedMessage);
    }

    warn(message) {
        const formattedMessage = this.formatMessage('warn', message);
        console.log('\x1b[33m%s\x1b[0m', formattedMessage.trim()); // Yellow
        this.writeToFile('combined.log', formattedMessage);
    }

    error(message, error = null) {
        let errorMessage = message;
        if (error) {
            errorMessage += `\nStack: ${error.stack}`;
        }
        const formattedMessage = this.formatMessage('error', errorMessage);
        console.log('\x1b[31m%s\x1b[0m', formattedMessage.trim()); // Red
        this.writeToFile('error.log', formattedMessage);
        this.writeToFile('combined.log', formattedMessage);
    }

    debug(message) {
        if (process.env.NODE_ENV === 'development') {
            const formattedMessage = this.formatMessage('debug', message);
            console.log('\x1b[36m%s\x1b[0m', formattedMessage.trim()); // Cyan
            this.writeToFile('debug.log', formattedMessage);
        }
    }
}

module.exports = new Logger();