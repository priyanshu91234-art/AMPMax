"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./page.module.css";
import UpgradeModal from "@/components/UpgradeModal";

type Step = "front" | "side" | "analyzing";

const compressImage = (file: File, maxWidth = 1024, quality = 0.82): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image load failed")); };
    img.src = url;
  });
};

export default function ScanPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("front");
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [sideImage, setSideImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "user", 
          width: { ideal: 1280 }, 
          height: { ideal: 720 } 
        },
      });
      streamRef.current = stream;
      setCameraActive(true);
      setError("");
    } catch (err) {
      console.error("Camera error:", err);
      setError("Camera access denied. Please allow camera access or use gallery upload.");
    }
  };

  // Bind stream to video element when it becomes available in the DOM
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = streamRef.current;
      video.onloadedmetadata = () => {
        video.play().catch(e => console.error("Error playing video:", e));
      };
    }
  }, [cameraActive]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const scale = Math.min(1, 1024 / video.videoWidth);
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth * scale;
    canvas.height = video.videoHeight * scale;
    canvas.getContext("2d")!.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
    stopCamera();
    if (step === "front") { setFrontImage(dataUrl); setStep("side"); }
    else { setSideImage(dataUrl); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select an image file."); return; }
    try {
      const dataUrl = await compressImage(file);
      if (step === "front") { setFrontImage(dataUrl); setStep("side"); }
      else { setSideImage(dataUrl); }
    } catch {
      setError("Failed to process image. Please try again.");
    }
    e.target.value = "";
  };

  const handleAnalyze = async () => {
    if (!frontImage) return;
    setStep("analyzing");
    setError("");
    setProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev;
        return prev + (prev < 60 ? 5 : 2);
      });
    }, 400);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frontImage, sideImage }),
      });
      const data = await res.json();
      clearInterval(interval);
      setProgress(100);

      if (res.status === 403 && data.error === "FREE_LIMIT_REACHED") {
        setStep("front");
        setFrontImage(null);
        setSideImage(null);
        setShowUpgrade(true);
        return;
      }
      
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      
      // Short delay for the 100% to be visible
      setTimeout(() => {
        router.push(`/results/${data.id}`);
      }, 500);
    } catch (err) {
      clearInterval(interval);
      setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
      setStep("side");
    }
  };

  const resetStep = (s: Step) => {
    stopCamera();
    setStep(s);
    if (s === "front") { setFrontImage(null); setSideImage(null); }
    else setSideImage(null);
  };

  const stepLabels = { front: "Front Profile", side: "Side Profile", analyzing: "Analyzing" };
  const currentImage = step === "side" ? frontImage : sideImage;
  const canAnalyze = !!frontImage;

  return (
    <div className={styles.page}>
      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} reason="scan_limit" />
      {/* Step indicator */}
      {step !== "analyzing" && (
        <div className={styles.stepIndicator}>
          {["front", "side"].map((s, i) => (
            <div key={s} className={styles.stepItem}>
              <div className={`${styles.stepDot} ${step === s ? styles.stepDotActive : frontImage && s === "front" ? styles.stepDotDone : ""}`}>
                {frontImage && s === "front" ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                ) : (i + 1)}
              </div>
              {i === 0 && <div className={`${styles.stepLine} ${frontImage ? styles.stepLineDone : ""}`} />}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === "analyzing" ? (
          <motion.div
            key="analyzing"
            className={styles.analyzingState}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className={styles.analyzingOrb} />
            <div className={styles.scannerRing} />
            <p className={styles.analyzingTitle}>Analyzing</p>
            <p className={styles.analyzingSubtitle}>Gemini Vision is processing your photos…</p>
            
            <div className={styles.progressContainer}>
              <motion.div 
                className={styles.progressBar}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
            <p className={styles.progressText}>{progress}%</p>

            <div className={styles.analyzingDots}>
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className={styles.analyzingDot}
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.2 }}
                />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={step}
            className={styles.capture}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className={styles.captureHeader}>
              <h2 className={styles.captureTitle}>{stepLabels[step]}</h2>
              <p className={styles.captureHint}>
                {step === "front"
                  ? "Face the camera directly. Keep neutral expression."
                  : "Turn your head 90°. (Optional: Take side profile for better analysis)"}
              </p>
            </div>

            {/* Previous image thumbnail */}
            {step === "side" && frontImage && (
              <div className={styles.prevThumb}>
                <img src={frontImage} alt="Front profile" className={styles.thumbImg} />
                <div className={styles.thumbLabel}>Front ✓</div>
                <button onClick={() => resetStep("front")} className={styles.retakeThumb}>Retake</button>
              </div>
            )}

            {/* Camera / Preview */}
            <div className={styles.cameraFrame}>
              {cameraActive ? (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className={styles.video} />
                  <div className={styles.cameraScanLine} />
                </>
              ) : step === "side" && sideImage ? (
                <img src={sideImage} alt="Side profile preview" className={styles.previewImg} />
              ) : step === "front" && frontImage ? (
                <img src={frontImage} alt="Front profile preview" className={styles.previewImg} />
              ) : (
                <div className={styles.cameraPlaceholder}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#404040" }}>
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <p className={styles.placeholderText}>Camera or upload</p>
                </div>
              )}
            </div>

            {error && (
              <motion.p
                className={styles.errorMsg}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {error}
              </motion.p>
            )}

            {/* Actions */}
            <div className={styles.cameraActions}>
              {cameraActive ? (
                <motion.button
                  className={styles.captureBtn}
                  onClick={capturePhoto}
                  whileTap={{ scale: 0.93 }}
                >
                  <div className={styles.captureBtnInner} />
                </motion.button>
              ) : (
                <div className={styles.uploadActions}>
                  <button className="btn btn-primary btn-lg w-full" onClick={startCamera}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    Use Camera
                  </button>
                  <button className="btn btn-secondary btn-lg w-full" onClick={() => fileInputRef.current?.click()}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" />
                    </svg>
                    Upload from Gallery
                  </button>
                  {(step === "side" && sideImage) && (
                    <button className="btn btn-ghost w-full" onClick={() => setSideImage(null)}>
                      Retake Side Photo
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Analyze CTA */}
            {canAnalyze && !cameraActive && (
              <motion.button
                className={`btn btn-chrome btn-lg w-full ${styles.analyzeBtn}`}
                onClick={handleAnalyze}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {sideImage ? "Analyze My Face" : "Analyze (Front Only)"}
              </motion.button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className={styles.hiddenInput}
              onChange={handleFileUpload}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
