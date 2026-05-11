// frontend/src/hooks/useSensor.js
import { useSerialSensor } from './useSerialSensor';

export const useSensor = () => {
    const serialSensor = useSerialSensor();
    
    return {
        status: {
            connected: serialSensor.status.connected,
            port: 'USB Serial'
        },
        loading: serialSensor.loading,
        error: serialSensor.error,
        connect: serialSensor.connect,
        disconnect: serialSensor.disconnect,
        scanFingerprint: serialSensor.scanFingerprint,
        enrollFingerprint: serialSensor.enrollFingerprint,
        isSupported: serialSensor.isSerialSupported
    };
};