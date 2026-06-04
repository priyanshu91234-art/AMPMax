"use client";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./page.module.css";

type Step = "front" | "side" | "analyzing";

export default function ScanPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("front");
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [sideImage, setSideImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch {
      setError("Camera access denied. Please allow camera access or use gallery upload.");
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")!.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    stopCamera();
    if (step === "front") { setFrontImage(dataUrl); setStep("side"); }
    else { setSideImage(dataUrl); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select an image file."); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (step === "front") { setFrontImage(dataUrl); setStep("side"); }
      else { setSideImage(dataUrl); }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleAnalyze = async () => {
    if (!frontImage || !sideImage) return;
    setStep("analyzing");
    setError("");
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frontImage, sideImage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      router.push(`/results/${data.id}`);
    } catch (err) {
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
  const bothImages = frontImage && sideImage;

  return (
    <div className={styles.page}>
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
                  : "Turn your head 90° to show your profile."}
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

            {/* Analyze CTA when both images ready */}
            {bothImages && step === "side" && !cameraActive && sideImage && (
              <motion.button
                className={`btn btn-chrome btn-lg w-full ${styles.analyzeBtn}`}
                onClick={handleAnalyze}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Analyze My Face
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
