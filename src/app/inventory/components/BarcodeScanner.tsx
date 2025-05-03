'use client';

import { useEffect, useState, useRef } from 'react';
import { InventoryItem } from '@/api';

declare global {
  interface Window {
    Html5QrcodeScanner: any;
    Html5Qrcode: any;
    Html5QrcodeSupportedFormats: {
      QR_CODE: string;
      EAN_13: string;
      UPC_A: string;
      CODE_128: string;
      CODE_39: string;
      EAN_8: string;
      UPC_E: string;
      ITF: string;
    };
  }
}

interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: string) => void;
  onClose: () => void;
}

interface Camera {
  id: string;
  label: string;
}

interface MediaError extends Error {
  name: string;
}

export default function BarcodeScanner({ onBarcodeDetected, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scanningTips, setScanningTips] = useState<string>('');
  const [showGuides, setShowGuides] = useState(false);
  const html5QrCodeRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Camera initialization
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
    script.async = true;
    
    script.onload = () => {
      console.log('Scanner library loaded successfully');
      if (isCameraActive) {
        initializeScanner();
      }
    };

    script.onerror = () => {
      console.error('Failed to load scanner library');
      setError('Failed to load scanner library. Please check your internet connection and refresh the page.');
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
      stopScanner();
    };
  }, [isCameraActive]);

  const handleBarcodeDetected = (decodedText: string) => {
    if (audioRef.current) {
      audioRef.current.play().catch(err => console.error('Error playing sound:', err));
    }
    
    console.log('Barcode detected:', decodedText);
    onBarcodeDetected(decodedText);
    
    const reader = document.getElementById('reader');
    if (reader) {
      reader.classList.add('bg-green-200');
      setTimeout(() => {
        reader.classList.remove('bg-green-200');
      }, 200);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  const initializeScanner = async () => {
    setIsLoading(true);
    setError('');
    setScanningTips('Initializing camera...');
    setShowGuides(false);
    
    try {
      await stopScanner();

      const html5QrCode = new window.Html5Qrcode("reader");
      html5QrCodeRef.current = html5QrCode;

      // iOS specific camera selection
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      if (isIOS) {
        console.log('iOS detected: Using direct facingMode approach');
        
        try {
          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
              disableFlip: false,
              experimentalFeatures: {
                useBarCodeDetectorIfSupported: true
              },
              videoConstraints: {
                facingMode: "environment",
                width: { min: 640, ideal: 1280, max: 1920 },
                height: { min: 480, ideal: 720, max: 1080 }
              },
              showTorchButtonIfSupported: true,
              rememberLastUsedCamera: true,
              formatsToSupport: [
                window.Html5QrcodeSupportedFormats.QR_CODE,
                window.Html5QrcodeSupportedFormats.EAN_13,
                window.Html5QrcodeSupportedFormats.UPC_A,
                window.Html5QrcodeSupportedFormats.CODE_128,
                window.Html5QrcodeSupportedFormats.CODE_39,
                window.Html5QrcodeSupportedFormats.EAN_8,
                window.Html5QrcodeSupportedFormats.UPC_E,
                window.Html5QrcodeSupportedFormats.ITF
              ]
            },
            (decodedText: string) => {
              console.log('Barcode detected:', decodedText);
              handleBarcodeDetected(decodedText);
            },
            (errorMessage: string) => {
              if (!errorMessage.includes('No barcode or QR code found')) {
                console.log('Scanning error:', errorMessage);
              }
            }
          );
        } catch (err) {
          console.error('Failed to start with environment facingMode:', err);
          setError('Failed to initialize camera. Please try again.');
          setIsCameraActive(false);
          setIsLoading(false);
          return;
        }
      } else {
        // For non-iOS devices
        try {
          const cameras = await window.Html5Qrcode.getCameras();
          if (!cameras || cameras.length === 0) {
            throw new Error('No cameras found');
          }

          console.log('Available cameras:', cameras);
          
          let cameraId = cameras[0].id;
          
          // Try to find back camera
          const backCamera = cameras.find((camera: Camera) => {
            const label = camera.label.toLowerCase();
            return (
              label.includes('back') || 
              label.includes('rear') ||
              label.includes('environment') ||
              label.includes('main') ||
              label.includes('primary')
            );
          });
          
          if (backCamera) {
            cameraId = backCamera.id;
            console.log('Selected back camera:', backCamera.label);
          }

          await html5QrCode.start(
            cameraId,
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
              disableFlip: false,
              experimentalFeatures: {
                useBarCodeDetectorIfSupported: true
              },
              videoConstraints: {
                width: { min: 640, ideal: 1280, max: 1920 },
                height: { min: 480, ideal: 720, max: 1080 }
              },
              showTorchButtonIfSupported: true,
              rememberLastUsedCamera: true,
              formatsToSupport: [
                window.Html5QrcodeSupportedFormats.QR_CODE,
                window.Html5QrcodeSupportedFormats.EAN_13,
                window.Html5QrcodeSupportedFormats.UPC_A,
                window.Html5QrcodeSupportedFormats.CODE_128,
                window.Html5QrcodeSupportedFormats.CODE_39,
                window.Html5QrcodeSupportedFormats.EAN_8,
                window.Html5QrcodeSupportedFormats.UPC_E,
                window.Html5QrcodeSupportedFormats.ITF
              ]
            },
            (decodedText: string) => {
              console.log('Barcode detected:', decodedText);
              handleBarcodeDetected(decodedText);
            },
            (errorMessage: string) => {
              if (!errorMessage.includes('No barcode or QR code found')) {
                console.log('Scanning error:', errorMessage);
              }
            }
          );
        } catch (err) {
          console.error('Camera initialization error:', err);
          setError('Failed to initialize camera. Please check your camera permissions and try again.');
          setIsCameraActive(false);
          setIsLoading(false);
          return;
        }
      }

      setScanningTips('Camera ready. Position the barcode in the center of the frame.');
      
      // Show guides after the camera is initialized
      setTimeout(() => {
        setShowGuides(true);
      }, 1000);

    } catch (err) {
      console.error('Scanner initialization error:', err);
      const mediaError = err as MediaError;
      
      if (mediaError.name === 'NotAllowedError') {
        setError('Camera access was denied. Please allow camera access in your browser settings and refresh the page.');
      } else if (mediaError.name === 'NotFoundError') {
        setError('No camera found. Please make sure your camera is connected and try again.');
      } else if (mediaError.name === 'NotReadableError') {
        setError('Camera is in use by another application. Please close other apps using the camera and try again.');
      } else if (mediaError.name === 'OverconstrainedError') {
        setError('Camera does not meet the required specifications. Please try again with different camera settings.');
      } else {
        setError(`Failed to initialize camera: ${mediaError.message || 'Unknown error'}. Please check your camera permissions and try again.`);
      }
      setIsCameraActive(false);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCamera = async () => {
    if (isCameraActive) {
      await stopScanner();
      setIsCameraActive(false);
      setScanningTips('');
      setShowGuides(false);
    } else {
      setIsCameraActive(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Barcode Scanner</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        {error && (
          <div className="text-red-500 p-4 bg-red-100 rounded mb-4">
            {error}
          </div>
        )}

        {scanningTips && (
          <div className="text-blue-600 p-2 bg-blue-50 rounded mb-4 text-center">
            {scanningTips}
          </div>
        )}

        <div className="relative w-full mx-auto">
          <div 
            id="reader" 
            style={{ 
              width: '100%',
              height: 'auto',
              aspectRatio: '4/3'
            }}
            className="transition-colors duration-300"
          ></div>
          
          {/* Scanning guides overlay */}
          {showGuides && (
            <div 
              className="absolute inset-0 pointer-events-none" 
              style={{ 
                zIndex: 10
              }}
            >
              {/* Center target marker */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                            w-[500px] h-[300px] border-2 border-dashed border-blue-500 rounded-md">
                {/* Corner markers */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-500"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-500"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-500"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-500"></div>
                
                {/* Distance guide text */}
                <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 text-xs text-white bg-blue-500 px-2 py-1 rounded shadow-md">
                  Position barcode here
                </div>
              </div>
              
              {/* Distance guide */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 
                             text-white px-3 py-1 rounded-full text-xs shadow-md">
                Hold phone 8-12 inches from barcode
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-center mt-4">
          <button
            onClick={toggleCamera}
            disabled={isLoading}
            className={`px-4 py-2 rounded ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : isCameraActive 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-blue-500 hover:bg-blue-600'
            } text-white`}
          >
            {isLoading ? 'Loading...' : isCameraActive ? 'Stop Camera' : 'Start Camera'}
          </button>
        </div>

        {/* Audio for beep sound on successful scan */}
        <audio ref={audioRef} preload="auto">
          <source src="https://cdn.pixabay.com/download/audio/2021/08/09/audio_0625d4ca44.mp3?filename=success-1-6297.mp3" type="audio/mpeg" />
        </audio>
      </div>
    </div>
  );
} 