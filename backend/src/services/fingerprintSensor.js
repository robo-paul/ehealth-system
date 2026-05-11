// backend/src/services/fingerprintSensor.js
const EventEmitter = require('events');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

class FingerprintSensor extends EventEmitter {
    constructor(portPath = 'COM3', baudRate = 115200) {
        super();
        this.portPath = portPath;
        this.baudRate = baudRate;
        this.isConnected = false;
        this.currentOperation = null;
        this.port = null;
        this.parser = null;
        this.commandQueue = [];
        this.isProcessing = false;
    }

    async connect() {
        return new Promise((resolve, reject) => {
            try {
                console.log(`🔌 Connecting to fingerprint sensor on ${this.portPath}...`);
                
                this.port = new SerialPort({
                    path: this.portPath,
                    baudRate: this.baudRate,
                    autoOpen: false
                });

                this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));

                // Handle incoming data from ESP32
                this.parser.on('data', (data) => {
                    this.handleIncomingData(data.trim());
                });

                // Handle port open
                this.port.open((err) => {
                    if (err) {
                        console.error('❌ Failed to open serial port:', err.message);
                        this.emit('error', err);
                        reject(err);
                        return;
                    }
                    
                    console.log('✅ Serial port opened successfully');
                    this.isConnected = true;
                    
                    // Wait for ESP32 to boot up and send READY message
                    setTimeout(() => {
                        this.emit('connected');
                        resolve();
                    }, 3000);
                });

                // Handle port errors
                this.port.on('error', (err) => {
                    console.error('Serial port error:', err.message);
                    this.emit('error', err);
                    this.isConnected = false;
                });

                // Handle port close
                this.port.on('close', () => {
                    console.log('Serial port closed');
                    this.isConnected = false;
                    this.emit('disconnected');
                });

            } catch (error) {
                console.error('Failed to create serial connection:', error);
                reject(error);
            }
        });
    }

    handleIncomingData(data) {
        console.log('📥 Received:', data);

        // Parse different message types from ESP32
        if (data.startsWith('INSTRUCTION:')) {
            const instruction = data.substring(12);
            this.emit('instruction', { message: instruction });
            
        } else if (data.startsWith('PROGRESS:')) {
            const progressData = data.substring(9);
            const [stepInfo, message] = progressData.split(':');
            const [current, total] = stepInfo.split('/');
            this.emit('progress', {
                current: parseInt(current),
                total: parseInt(total),
                message: message,
                percentage: Math.round((parseInt(current) / parseInt(total)) * 100)
            });
            
        } else if (data.startsWith('STATUS:')) {
            const statusData = data.substring(7);
            const parts = statusData.split(':');
            const status = parts[0];
            const message = parts.slice(1).join(':');
            this.emit('status', { status, message });
            
            // Handle specific status codes
            if (status === 'SCAN_SUCCESS') {
                this.currentOperation = null;
                this.emit('scanComplete', { 
                    success: true, 
                    userId: this.extractId(message),
                    confidence: this.extractConfidence(message)
                });
            } else if (status === 'SCAN_FAIL') {
                this.currentOperation = null;
                this.emit('scanComplete', { 
                    success: false, 
                    error: message 
                });
            } else if (status === 'ENROLL_SUCCESS') {
                this.currentOperation = null;
                this.emit('enrollComplete', { 
                    success: true, 
                    userId: this.extractId(message)
                });
            } else if (status === 'ENROLL_FAIL') {
                this.currentOperation = null;
                this.emit('enrollComplete', { 
                    success: false, 
                    error: message 
                });
            } else if (status === 'CAPACITY') {
                this.emit('capacity', { message });
            }
            
        } else if (data.startsWith('SCAN_SUCCESS:')) {
            const match = data.match(/ID=(\d+),CONFIDENCE=(\d+)/);
            if (match) {
                this.emit('scanComplete', {
                    success: true,
                    userId: parseInt(match[1]),
                    confidence: parseInt(match[2])
                });
            }
            
        } else if (data.startsWith('ENROLL_SUCCESS:')) {
            const match = data.match(/ID=(\d+)/);
            if (match) {
                this.emit('enrollComplete', {
                    success: true,
                    userId: parseInt(match[1])
                });
            }
            
        } else if (data.startsWith('CAPACITY:')) {
            const match = data.match(/Total=(\d+),Used=(\d+),Free=(\d+)/);
            if (match) {
                this.emit('capacity', {
                    total: parseInt(match[1]),
                    used: parseInt(match[2]),
                    free: parseInt(match[3])
                });
            }
            
        } else if (data.startsWith('ERROR:')) {
            this.emit('error', { message: data.substring(6) });
            
        } else if (data.includes('READY')) {
            this.emit('ready');
        }
    }

    extractId(message) {
        const match = message.match(/ID:\s*(\d+)/);
        return match ? parseInt(match[1]) : null;
    }

    extractConfidence(message) {
        const match = message.match(/Confidence:\s*(\d+)/);
        return match ? parseInt(match[1]) : null;
    }

    async sendCommand(command) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected || !this.port) {
                reject(new Error('Sensor not connected'));
                return;
            }

            console.log(`📤 Sending: ${command}`);
            this.port.write(command + '\n', (err) => {
                if (err) {
                    console.error('Failed to send command:', err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    async scanFingerprint() {
        console.log('🔍 Starting fingerprint scan...');
        
        if (!this.isConnected) {
            return { success: false, error: 'Sensor not connected' };
        }

        return new Promise(async (resolve, reject) => {
            const timeout = setTimeout(() => {
                this.removeListener('scanComplete', scanHandler);
                reject(new Error('Scan timeout'));
            }, 15000); // 15 second timeout

            const scanHandler = (result) => {
                clearTimeout(timeout);
                resolve(result);
            };

            this.once('scanComplete', scanHandler);
            
            try {
                await this.sendCommand('SCAN');
            } catch (error) {
                clearTimeout(timeout);
                this.removeListener('scanComplete', scanHandler);
                reject(error);
            }
        });
    }

    async enrollFingerprint(userId = null) {
        console.log('📝 Starting fingerprint enrollment...');
        
        if (!this.isConnected) {
            return { success: false, error: 'Sensor not connected' };
        }

        // First check if there's space in the database
        try {
            const capacity = await this.getCapacity();
            if (capacity.free === 0) {
                return { 
                    success: false, 
                    error: 'Database is full. Please delete some fingerprints first.' 
                };
            }
        } catch (error) {
            console.warn('Could not check capacity:', error);
        }

        return new Promise(async (resolve, reject) => {
            const timeout = setTimeout(() => {
                this.removeListener('enrollComplete', enrollHandler);
                this.removeListener('instruction', instructionHandler);
                this.removeListener('progress', progressHandler);
                reject(new Error('Enrollment timeout'));
            }, 60000); // 60 second timeout for enrollment

            const enrollHandler = (result) => {
                clearTimeout(timeout);
                this.removeListener('instruction', instructionHandler);
                this.removeListener('progress', progressHandler);
                resolve(result);
            };

            const instructionHandler = (instruction) => {
                this.emit('instruction', instruction);
            };

            const progressHandler = (progress) => {
                this.emit('progress', progress);
            };

            this.once('enrollComplete', enrollHandler);
            this.on('instruction', instructionHandler);
            this.on('progress', progressHandler);
            
            try {
                await this.sendCommand('ENROLL');
            } catch (error) {
                clearTimeout(timeout);
                this.removeListener('enrollComplete', enrollHandler);
                this.removeListener('instruction', instructionHandler);
                this.removeListener('progress', progressHandler);
                reject(error);
            }
        });
    }

    async getCapacity() {
        console.log('📊 Checking database capacity...');
        
        if (!this.isConnected) {
            throw new Error('Sensor not connected');
        }

        return new Promise(async (resolve, reject) => {
            const timeout = setTimeout(() => {
                this.removeListener('capacity', capacityHandler);
                reject(new Error('Capacity check timeout'));
            }, 10000);

            const capacityHandler = (result) => {
                clearTimeout(timeout);
                resolve(result);
            };

            this.once('capacity', capacityHandler);
            
            try {
                await this.sendCommand('CAPACITY');
            } catch (error) {
                clearTimeout(timeout);
                this.removeListener('capacity', capacityHandler);
                reject(error);
            }
        });
    }

    async deleteFingerprint(id) {
        console.log(`🗑️ Deleting fingerprint ID ${id}...`);
        
        if (!this.isConnected) {
            throw new Error('Sensor not connected');
        }

        return new Promise(async (resolve, reject) => {
            const timeout = setTimeout(() => {
                this.removeListener('status', statusHandler);
                reject(new Error('Delete timeout'));
            }, 5000);

            const statusHandler = (status) => {
                if (status.status === 'DELETE_SUCCESS' || status.status === 'DELETE_FAIL') {
                    clearTimeout(timeout);
                    this.removeListener('status', statusHandler);
                    resolve({
                        success: status.status === 'DELETE_SUCCESS',
                        message: status.message
                    });
                }
            };

            this.on('status', statusHandler);
            
            try {
                await this.sendCommand(`DELETE:${id}`);
            } catch (error) {
                clearTimeout(timeout);
                this.removeListener('status', statusHandler);
                reject(error);
            }
        });
    }

    async emptyDatabase() {
        console.log('⚠️ Emptying entire database...');
        
        if (!this.isConnected) {
            throw new Error('Sensor not connected');
        }

        return new Promise(async (resolve, reject) => {
            const timeout = setTimeout(() => {
                this.removeListener('status', statusHandler);
                reject(new Error('Empty database timeout'));
            }, 5000);

            const statusHandler = (status) => {
                if (status.status === 'EMPTY_SUCCESS' || status.status === 'EMPTY_FAIL') {
                    clearTimeout(timeout);
                    this.removeListener('status', statusHandler);
                    resolve({
                        success: status.status === 'EMPTY_SUCCESS',
                        message: status.message
                    });
                }
            };

            this.on('status', statusHandler);
            
            try {
                await this.sendCommand('EMPTY');
            } catch (error) {
                clearTimeout(timeout);
                this.removeListener('status', statusHandler);
                reject(error);
            }
        });
    }

    async ping() {
        if (!this.isConnected) {
            return false;
        }

        return new Promise(async (resolve) => {
            const timeout = setTimeout(() => {
                resolve(false);
            }, 2000);

            const readyHandler = () => {
                clearTimeout(timeout);
                resolve(true);
            };

            this.once('ready', readyHandler);
            
            try {
                await this.sendCommand('PING');
                // If we get a PONG response, it will be handled by handleIncomingData
                // which will emit 'ready' event
            } catch (error) {
                clearTimeout(timeout);
                this.removeListener('ready', readyHandler);
                resolve(false);
            }
        });
    }

    disconnect() {
        console.log('Disconnecting from fingerprint sensor...');
        
        if (this.port) {
            this.port.close((err) => {
                if (err) {
                    console.error('Error closing port:', err);
                }
            });
        }
        
        this.isConnected = false;
        this.emit('disconnected');
    }
}

module.exports = FingerprintSensor;