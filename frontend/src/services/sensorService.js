// frontend/src/services/sensorService.js
import WebSerialService from './webSerialService';

class SensorService {
    constructor() {
        this.instance = null;
        this.isConnecting = false;
        this.listeners = [];
    }

    static getInstance() {
        if (!SensorService.instance) {
            SensorService.instance = new SensorService();
        }
        return SensorService.instance;
    }

    async connect() {
        if (this.isConnecting) {
            console.log('Connection already in progress, waiting...');
            return new Promise((resolve) => {
                const checkInterval = setInterval(() => {
                    if (!this.isConnecting) {
                        clearInterval(checkInterval);
                        resolve(this.instance?.isConnected ? { success: true } : { success: false });
                    }
                }, 100);
            });
        }

        if (this.instance?.isConnected) {
            console.log('Already connected');
            return { success: true };
        }

        this.isConnecting = true;
        
        try {
            const service = new WebSerialService();
            service.on('disconnected', () => {
                this.notifyListeners({ connected: false });
            });
            
            const result = await service.connect();
            
            if (result.success) {
                this.instance = service;
                this.notifyListeners({ connected: true });
                return { success: true };
            }
            return result;
        } finally {
            this.isConnecting = false;
        }
    }

    disconnect() {
        if (this.instance) {
            this.instance.disconnect();
            this.instance = null;
            this.notifyListeners({ connected: false });
        }
    }

    getStatus() {
        return {
            connected: this.instance?.isConnected || false,
            port: 'USB Serial'
        };
    }

    async scanFingerprint() {
        if (!this.instance?.isConnected) {
            throw new Error('Not connected to device');
        }
        return this.instance.scanFingerprint();
    }

    async enrollFingerprint() {
        if (!this.instance?.isConnected) {
            throw new Error('Not connected to device');
        }
        return this.instance.enrollFingerprint();
    }

    addListener(callback) {
        this.listeners.push(callback);
    }

    removeListener(callback) {
        this.listeners = this.listeners.filter(cb => cb !== callback);
    }

    notifyListeners(data) {
        this.listeners.forEach(callback => callback(data));
    }
}

export default SensorService.getInstance();