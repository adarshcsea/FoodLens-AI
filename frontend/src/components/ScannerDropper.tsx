import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, RefreshCw, UploadCloud, AlertCircle } from 'lucide-react';
import { preprocessImage } from '../utils/imagePreprocessor';
import { useScanStore } from '../store/useScanStore';
import { createWorker } from 'tesseract.js';

// Environment-aware Base API URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

export const ScannerDropper: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const { isScanning, progress, setIsScanning, setProgress, setScanResults, resetScan } =
    useScanStore();

  // Cleanup Object URLs to prevent memory leaks in SPAs
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleReset = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setScanError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear native file input state
    }
    resetScan();
  }, [preview, resetScan]);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setScanError('Please upload a valid image file (PNG, JPEG, WEBP).');
      return;
    }

    // Reset error state and start process
    setScanError(null);
    setIsScanning(true);
    setProgress(5);

    // Create & track preview URL
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    let worker: Tesseract.Worker | null = null;

    try {
      // Step 1: Pre-process image on Canvas
      setProgress(20);
      const processedBase64 = await preprocessImage(file, {
        minWidth: 1800,
        contrastBoost: 1.2,
      });

      // Step 2: Initialize Web Worker for OCR (Tesseract.js v5 API)
      setProgress(35);
      const worker = await createWorker('eng', undefined, {        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(35 + Math.floor(m.progress * 50));
          }
        },
      });

      // Step 3: Text Extraction
      const { data } = await worker.recognize(processedBase64);
      const extractedText = data.text ? data.text.trim() : '';

      // Clean up worker memory
      await worker.terminate();

      if (!extractedText || extractedText.length < 5) {
        throw new Error('Could not detect readable text on label. Ensure sharp focus and good lighting.');
      }

      setProgress(90);

      // Step 4: Send raw text to Spring Boot Matching Engine
      const response = await fetch(`${API_BASE_URL}/ingredients/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: extractedText }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}: Failed to match ingredients.`);
      }

      const matchedIngredients = await response.json();
      setProgress(100);
      setScanResults(extractedText, matchedIngredients);

    } catch (err: any) {
      console.error('OCR Scanning pipeline error:', err);
      setScanError(err.message || 'An error occurred while analyzing the ingredient label.');
      
      // CRITICAL FIX: Gracefully recover state on failure!
      setIsScanning(false);
      setProgress(0);

      if (worker) {
        await (worker as Tesseract.Worker).terminate();
      }
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovered(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        accept="image/*"
        className="hidden"
      />

      <motion.div
        onDragOver={(e) => {
          e.preventDefault();
          setIsHovered(true);
        }}
        onDragLeave={() => setIsHovered(false)}
        onDrop={onDrop}
        whileHover={{ scale: preview ? 1 : 1.01 }}
        onClick={() => !isScanning && !preview && fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 transition-all duration-300 backdrop-blur-xl ${
          isHovered
            ? 'border-indigo-500 bg-indigo-950/30 ring-4 ring-indigo-500/20'
            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
        }`}
      >
        {preview ? (
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-full h-64 rounded-xl overflow-hidden border border-slate-800 bg-black">
              <img src={preview} alt="Scanned food label preview" className="w-full h-full object-contain" />

              {/* Scanning Overlay State */}
              <AnimatePresence>
                {isScanning && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center gap-3"
                  >
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-mono font-semibold text-indigo-300 tracking-wider">
                      ANALYZING TEXT MATRIX ({progress}%)
                    </span>
                    <div className="w-56 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Error Message Box */}
            {scanError && (
              <div className="flex items-center gap-2 px-4 py-2 bg-rose-950/60 border border-rose-800/80 rounded-lg text-rose-200 text-xs w-full">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{scanError}</span>
              </div>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
              disabled={isScanning}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" /> Reset & Scan New Package
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-950/80 border border-indigo-800/50 flex items-center justify-center text-indigo-400 mb-4 shadow-xl shadow-indigo-950/50">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200 mb-1">
              Drop Food Label Image or <span className="text-indigo-400 underline">Browse Files</span>
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mb-4">
              High-resolution OCR scanner with real-time adaptive contrast enrichment and fuzzy ingredient lookup.
            </p>
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-full border border-slate-800">
              <UploadCloud className="w-3 h-3 text-indigo-400" /> Pre-processes canvas client-side for ultra-fast extraction
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};