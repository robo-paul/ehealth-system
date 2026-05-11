// frontend/src/services/webSerialService.js - Fixed version with proper fingerprint saving
import api from './api';

class WebSerialService {
    constructor() {
        this.port = null;
        this.reader = null;
        this.writer = null;
        this.isConnected = false;
        this.eventListeners = {};
        this.readLoopActive = false;
        this.buffer = '';
        this.enrollmentStep = 0;
        this.enrollmentCallbacks = null;
    }

    async connect() {
        if (!navigator.serial) {
            throw new Error('Web Serial is not supported. Please use Chrome or Edge browser.');
        }

        if (this.isConnected && this.port) {
            console.log('Already connected to a serial port');
            return { success: true };
        }

        try {
            console.log('🔍 Requesting serial port...');
            
            this.port = await navigator.serial.requestPort({
                filters: [
                    { usbVendorId: 0x10c4 },
                    { usbVendorId: 0x1a86 },
                    { usbVendorId: 0x0403 }
                ]
            });
            
            console.log('🔗 Connecting to serial port...');
            await this.port.open({ baudRate: 115200 });
            
            this.isConnected = true;
            console.log('✅ Serial port connected!');
            
            this.startReading();
            
            await this.sendCommand('PING');
            
            return { success: true };
        } catch (error) {
            console.error('❌ Connection error:', error);
            this.isConnected = false;
            this.port = null;
            return { success: false, error: error.message };
        }
    }

    async startReading() {
        if (this.readLoopActive) return;
        this.readLoopActive = true;
        
        while (this.port && this.port.readable) {
            try {
                this.reader = this.port.readable.getReader();
                
                while (true) {
                    const { value, done } = await this.reader.read();
                    if (done) break;
                    
                    const text = new TextDecoder().decode(value);
                    console.log('📨 Raw received:', text);
                    this.buffer += text;
                    
                    let lines = this.buffer.split('\n');
                    this.buffer = lines.pop() || '';
                    
                    for (const line of lines) {
                        if (line.trim()) {
                            const trimmedLine = line.trim();
                            console.log('📨 Processed line:', trimmedLine);
                            
                            let cleanLine = trimmedLine;
                            if (cleanLine.startsWith('Received:')) {
                                cleanLine = cleanLine.substring(8).trim();
                            }
                            
                            this.emit('data', cleanLine);
                            this.processEnrollmentStep(cleanLine);
                            this.processScanStep(cleanLine);
                        }
                    }
                }
            } catch (error) {
                console.error('Read error:', error);
                break;
            } finally {
                if (this.reader) {
                    this.reader.releaseLock();
                }
            }
        }
        
        this.readLoopActive = false;
    }

    processScanStep(response) {
        if (response === 'SCAN_START' || response.includes('SCAN_START')) {
            this.emit('scan-status', {
                status: 'waiting',
                message: 'Waiting for fingerprint...',
                instruction: 'Please place your finger on the sensor'
            });
        }
        else if (response.includes('Finger detected') || response.includes('✓ Finger detected')) {
            this.emit('scan-status', {
                status: 'detected',
                message: 'Finger detected!',
                instruction: 'Processing fingerprint...'
            });
        }
        else if (response.startsWith('SCAN_SUCCESS')) {
            const match = response.match(/ID=(\d+),CONFIDENCE=(\d+)/);
            const userId = match ? parseInt(match[1]) : null;
            const confidence = match ? parseInt(match[2]) : 0;
            this.emit('scan-status', {
                status: 'success',
                message: 'Fingerprint recognized!',
                instruction: `Confidence: ${confidence}%`,
                userId: userId,
                confidence: confidence
            });
        }
        else if (response.startsWith('SCAN_FAIL')) {
            let errorMsg = response.substring('SCAN_FAIL:'.length);
            this.emit('scan-status', {
                status: 'failed',
                message: 'Authentication failed',
                instruction: errorMsg
            });
        }
    }

    async saveFingerprintToBackend(fingerprintId) {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.error('No auth token found');
            return false;
        }
        
        try {
            // Use the api instance which has the correct base URL (port 3001)
            const response = await api.post('/auth/save-fingerprint', { fingerprintId });
            console.log('Fingerprint save response:', response.data);
            return response.data.success === true;
        } catch (error) {
            console.error('Failed to save fingerprint:', error);
            console.error('Error details:', error.response?.data || error.message);
            return false;
        }
    }

    processEnrollmentStep(response) {
        console.log('Processing enrollment step:', response);
        
        // Check for ENROLL_START
        if (response.includes('ENROLL_START')) {
            const match = response.match(/ID=(\d+)/);
            const id = match ? match[1] : 'unknown';
            this.enrollmentStep = 1;
            this.emit('enroll-step', {
                step: 1,
                totalSteps: 3,
                message: 'Place your finger on the sensor',
                instruction: '👉 Gently place your finger on the fingerprint sensor',
                icon: '👆',
                color: '#3B82F6'
            });
        } 
        // Check for STEP 1 completion (First scan successful)
        else if (response.includes('First scan successful') || response.includes('STEP 2')) {
            this.enrollmentStep = 2;
            this.emit('enroll-step', {
                step: 2,
                totalSteps: 3,
                message: 'First scan successful! Remove your finger',
                instruction: '✋ Remove your finger from the sensor',
                icon: '✋',
                color: '#F59E0B'
            });
        }
        // Check for STEP 2 (Remove finger)
        else if (response.includes('Remove your finger')) {
            this.emit('enroll-step', {
                step: 2,
                message: 'Remove your finger',
                instruction: 'Please remove your finger from the sensor',
                icon: '✋',
                color: '#F59E0B'
            });
        }
        // Check for STEP 3 (Place same finger again)
        else if (response.includes('Place the SAME finger') || response.includes('STEP 3')) {
            this.enrollmentStep = 3;
            this.emit('enroll-step', {
                step: 3,
                totalSteps: 3,
                message: 'Place the SAME finger again',
                instruction: '🔄 Place the SAME finger in the same position',
                icon: '🔄',
                color: '#8B5CF6'
            });
        }
        // Check for finger detected during enrollment
        else if (response.includes('Finger detected') || response.includes('✓ Finger detected')) {
            this.emit('enroll-step', {
                step: this.enrollmentStep,
                message: 'Finger detected!',
                instruction: 'Processing...',
                icon: '✓',
                color: '#10B981'
            });
        }
        // Check for ENROLL_SUCCESS
        else if (response.startsWith('ENROLL_SUCCESS')) {
            const match = response.match(/ID=(\d+)/);
            const fingerprintId = match ? parseInt(match[1]) : null;
            console.log('🎉 ENROLL_SUCCESS detected! Fingerprint ID:', fingerprintId);
            this.enrollmentStep = 0;
            
            if (fingerprintId) {
                // Show saving message
                this.emit('enroll-step', {
                    step: 3,
                    message: '💾 Saving fingerprint to database...',
                    instruction: 'Please wait',
                    icon: '💾',
                    color: '#F59E0B'
                });
                
                // Save fingerprint ID to backend
                this.saveFingerprintToBackend(fingerprintId).then((saved) => {
                    if (saved) {
                        this.emit('enroll-step', {
                            step: 4,
                            totalSteps: 3,
                            message: '✅ Enrollment successful!',
                            instruction: `Fingerprint saved with ID: ${fingerprintId}`,
                            icon: '✅',
                            color: '#10B981',
                            success: true,
                            userId: fingerprintId
                        });
                    } else {
                        this.emit('enroll-step', {
                            step: 0,
                            message: '❌ Enrollment failed',
                            instruction: 'Failed to save fingerprint to database. Please try again.',
                            icon: '❌',
                            color: '#EF4444',
                            error: true
                        });
                    }
                    
                    if (this.enrollmentCallbacks) {
                        if (saved) {
                            this.enrollmentCallbacks.resolve({ success: true, userId: fingerprintId });
                        } else {
                            this.enrollmentCallbacks.reject(new Error('Failed to save fingerprint to database'));
                        }
                        this.enrollmentCallbacks = null;
                    }
                });
            } else {
                this.emit('enroll-step', {
                    step: 4,
                    message: '✅ Enrollment successful!',
                    instruction: 'Fingerprint enrolled successfully',
                    icon: '✅',
                    color: '#10B981',
                    success: true,
                    userId: null
                });
                
                if (this.enrollmentCallbacks) {
                    this.enrollmentCallbacks.resolve({ success: true, userId: null });
                    this.enrollmentCallbacks = null;
                }
            }
        }
        // Check for ENROLL_FAIL
        else if (response.startsWith('ENROLL_FAIL')) {
            console.log('❌ ENROLL_FAIL detected:', response);
            this.enrollmentStep = 0;
            let errorMsg = response.substring('ENROLL_FAIL:'.length);
            
            // Make error messages user-friendly
            if (errorMsg.includes("don't match") || errorMsg.includes("ENROLLMISMATCH")) {
                errorMsg = "Fingerprints don't match! Please use the EXACT same finger and position.";
            } else if (errorMsg.includes("No finger")) {
                errorMsg = "No finger detected. Please place your finger firmly on the sensor.";
            } else if (errorMsg.includes("Invalid image")) {
                errorMsg = "Fingerprint quality too low. Clean the sensor and try again.";
            }
            
            this.emit('enroll-step', {
                step: 0,
                message: '❌ Enrollment failed',
                instruction: errorMsg,
                icon: '❌',
                color: '#EF4444',
                error: true
            });
            
            if (this.enrollmentCallbacks) {
                this.enrollmentCallbacks.reject(new Error(errorMsg));
                this.enrollmentCallbacks = null;
            }
        }
    }

    async sendCommand(command) {
        if (!this.isConnected || !this.port || !this.port.writable) {
            throw new Error('Not connected to device');
        }
        
        try {
            this.writer = this.port.writable.getWriter();
            const data = new TextEncoder().encode(command + '\n');
            await this.writer.write(data);
            this.writer.releaseLock();
            console.log('📤 Sent:', command);
        } catch (error) {
            console.error('Send error:', error);
            throw error;
        }
    }

    async scanFingerprint() {
        return new Promise((resolve, reject) => {
            console.log('Starting fingerprint scan...');
            
            let resolved = false;
            let receivedMessages = [];
            let scanStarted = false;
            
            const timeout = setTimeout(() => {
                if (!resolved) {
                    console.log('Scan timeout. Received messages:', receivedMessages);
                    if (!scanStarted) {
                        reject(new Error('No response from sensor. Please check connection.'));
                    } else {
                        reject(new Error('Scan timeout - Please place your finger on the sensor'));
                    }
                    cleanup();
                }
            }, 30000);
            
            const handler = (response) => {
                console.log('Scan response received:', response);
                receivedMessages.push(response);
                
                if (response === 'SCAN_START' || response.includes('SCAN_START')) {
                    scanStarted = true;
                }
                else if (response.startsWith('SCAN_SUCCESS')) {
                    if (!resolved) {
                        resolved = true;
                        clearTimeout(timeout);
                        const match = response.match(/ID=(\d+),CONFIDENCE=(\d+)/);
                        const result = {
                            success: true,
                            userId: match ? parseInt(match[1]) : null,
                            confidence: match ? parseInt(match[2]) : 0
                        };
                        resolve(result);
                        cleanup();
                    }
                }
                else if (response.startsWith('SCAN_FAIL')) {
                    if (!resolved) {
                        resolved = true;
                        clearTimeout(timeout);
                        let errorMsg = response.substring('SCAN_FAIL:'.length);
                        reject(new Error(errorMsg));
                        cleanup();
                    }
                }
            };
            
            const cleanup = () => {
                this.off('data', handler);
            };
            
            this.on('data', handler);
            this.sendCommand('SCAN').catch((err) => {
                cleanup();
                reject(err);
            });
        });
    }

    async enrollFingerprint() {
        return new Promise((resolve, reject) => {
            if (this.enrollmentCallbacks) {
                reject(new Error('Enrollment already in progress'));
                return;
            }
            
            this.enrollmentCallbacks = { resolve, reject };
            this.enrollmentStep = 0;
            
            const timeout = setTimeout(() => {
                if (this.enrollmentCallbacks) {
                    this.enrollmentCallbacks.reject(new Error('Enrollment timeout (90 seconds)'));
                    this.enrollmentCallbacks = null;
                    this.enrollmentStep = 0;
                }
            }, 90000);
            
            const originalReject = reject;
            const wrappedReject = (error) => {
                clearTimeout(timeout);
                originalReject(error);
            };
            
            this.enrollmentCallbacks.reject = wrappedReject;
            
            this.sendCommand('ENROLL').catch((err) => {
                if (this.enrollmentCallbacks) {
                    this.enrollmentCallbacks.reject(err);
                    this.enrollmentCallbacks = null;
                }
            });
        });
    }

    async getStatus() {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Status timeout'));
            }, 5000);
            
            const handler = (response) => {
                if (response === 'STATUS:OK') {
                    clearTimeout(timeout);
                    resolve({ success: true });
                    this.off('data', handler);
                } else if (response === 'STATUS:ERROR') {
                    clearTimeout(timeout);
                    resolve({ success: false });
                    this.off('data', handler);
                }
            };
            
            this.on('data', handler);
            this.sendCommand('STATUS').catch(reject);
        });
    }

    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }

    once(event, callback) {
        const wrapper = (...args) => {
            callback(...args);
            this.off(event, wrapper);
        };
        this.on(event, wrapper);
    }

    off(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
        }
    }

    emit(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => callback(data));
        }
    }

    async disconnect() {
        this.isConnected = false;
        this.enrollmentCallbacks = null;
        this.enrollmentStep = 0;
        
        if (this.reader) {
            await this.reader.cancel();
            this.reader.releaseLock();
        }
        
        if (this.writer) {
            this.writer.releaseLock();
        }
        
        if (this.port) {
            await this.port.close();
            this.port = null;
        }
        
        console.log('Disconnected from serial device');
    }
}

export default WebSerialService;