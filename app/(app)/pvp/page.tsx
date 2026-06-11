"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./page.module.css";
import UpgradeModal from "@/components/UpgradeModal";

type PVPState = "lobby" | "searching" | "connected" | "analyzing" | "result";

interface PVPResult {
  myRating: number;
  theirRating: number;
  winner: "me" | "them";
}

// Simple WebRTC PVP using BroadcastChannel for same-origin demo
// In production, this would use a WebSocket signaling server
export default function PVPPage() {
  const [pvpState, setPvpState] = useState<PVPState>("lobby");
  const [result, setResult] = useState<PVPResult | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const [isInitiator, setIsInitiator] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isPremium, setIsPremium] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/subscription/status")
      .then((r) => r.json())
      .then((d) => setIsPremium(d.isPremium ?? false))
      .catch(() => setIsPremium(false));
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      return stream;
    } catch {
      setCameraError("Camera access required for PVP mode");
      return null;
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (channelRef.current) {
      channelRef.current.close();
      channelRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => () => stopCamera(), [stopCamera]);

  const handleEnterQueue = async () => {
    if (!isPremium) {
      setShowUpgrade(true);
      return;
    }
    const stream = await startCamera();
    if (!stream) return;
    setPvpState("searching");

    // BroadcastChannel for same-browser PVP demo
    // In production: use WebSocket signaling with STUN/TURN
    const channel = new BroadcastChannel("ampmax-pvp");
    channelRef.current = channel;

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });
    pcRef.current = pc;

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.ontrack = (e) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
      setPvpState("connected");
      startCountdown();
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        channel.postMessage({ type: "ice", candidate: e.candidate });
      }
    };

    let thisIsInitiator = false;

    channel.onmessage = async (e) => {
      const msg = e.data;
      if (msg.type === "hello" && !thisIsInitiator) {
        // We become the initiator
        thisIsInitiator = true;
        setIsInitiator(true);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        channel.postMessage({ type: "offer", sdp: offer });
      }
      if (msg.type === "offer" && thisIsInitiator === false) {
        await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        channel.postMessage({ type: "answer", sdp: answer });
      }
      if (msg.type === "answer" && thisIsInitiator) {
        await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
      }
      if (msg.type === "ice") {
        try { await pc.addIceCandidate(new RTCIceCandidate(msg.candidate)); } catch {}
      }
      if (msg.type === "result") {
        // Opponent's result
        handleFinalResult(msg.rating);
      }
    };

    // Announce presence
    channel.postMessage({ type: "hello" });
  };

  const startCountdown = () => {
    let count = 5;
    setCountdown(count);
    const interval = setInterval(() => {
      count--;
      setCountdown(count);
      if (count === 0) {
        clearInterval(interval);
        setCountdown(null);
        runAnalysis();
      }
    }, 1000);
  };

  const runAnalysis = async () => {
    setPvpState("analyzing");
    if (!localVideoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = localVideoRef.current.videoWidth || 640;
    canvas.height = localVideoRef.current.videoHeight || 480;
    canvas.getContext("2d")!.drawImage(localVideoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frontImage: dataUrl, sideImage: dataUrl }),
      });
      const data = await res.json();
      const myRating = data.rating || 50;
      channelRef.current?.postMessage({ type: "result", rating: myRating });
      handleFinalResult(null, myRating);
    } catch {
      handleFinalResult(null, 50);
    }
  };

  const pvpResultRef = useRef<{ myRating?: number; theirRating?: number }>({});

  const handleFinalResult = (theirRating: number | null, myRating?: number) => {
    if (myRating !== undefined) pvpResultRef.current.myRating = myRating;
    if (theirRating !== null) pvpResultRef.current.theirRating = theirRating;

    if (pvpResultRef.current.myRating !== undefined && pvpResultRef.current.theirRating !== undefined) {
      const { myRating: my, theirRating: their } = pvpResultRef.current;
      setResult({ myRating: my!, theirRating: their!, winner: my! >= their! ? "me" : "them" });
      setPvpState("result");
      stopCamera();
    }
  };

  const handleReset = () => {
    stopCamera();
    setResult(null);
    setPvpState("lobby");
    pvpResultRef.current = {};
  };

  return (
    <div className={styles.page}>
      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} reason="pvp" />
      <AnimatePresence mode="wait">
        {pvpState === "lobby" && (
          <motion.div
            key="lobby"
            className={styles.lobby}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className={styles.pvpHeroOrb} />
            <h1 className={styles.pvpTitle}>
              <span className="text-gradient">PVP</span> Arena
            </h1>
            <p className={styles.pvpDesc}>
              Face off against another user in real-time. Your cameras are analyzed simultaneously.
              The higher-rated face wins the title of <strong className={styles.moggerText}>Mogger</strong>.
            </p>
            <div className={styles.pvpRules}>
              {[
                "Both cameras activate simultaneously",
                "5-second countdown before analysis",
                "AI rates both faces live",
                "Winner crowned Mogger 👑",
              ].map((rule, i) => (
                <div key={i} className={styles.pvpRule}>
                  <span className={styles.pvpRuleNum}>{i + 1}</span>
                  <span>{rule}</span>
                </div>
              ))}
            </div>
            {cameraError && <p className={styles.errorMsg}>{cameraError}</p>}
            <button className="btn btn-chrome btn-lg w-full" onClick={handleEnterQueue}>
              Enter Arena
            </button>
            <p className={styles.pvpNote}>
              Open this page in two tabs to test PVP locally
            </p>
          </motion.div>
        )}

        {pvpState === "searching" && (
          <motion.div
            key="searching"
            className={styles.searchingState}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className={styles.searchingRing} />
            <div className={styles.searchingRing2} />
            <p className={styles.searchingTitle}>Finding opponent…</p>
            <p className={styles.searchingSubtitle}>Open another tab to start a match</p>
            <div className={styles.localPreviewSmall}>
              <video ref={localVideoRef} autoPlay playsInline muted className={styles.localVideoSmall} />
              <p className={styles.localLabel}>You</p>
            </div>
            <button className="btn btn-ghost" onClick={handleReset}>Cancel</button>
          </motion.div>
        )}

        {(pvpState === "connected" || pvpState === "analyzing") && (
          <motion.div
            key="arena"
            className={styles.arena}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className={styles.arenaVideos}>
              <div className={styles.videoSlot}>
                <video ref={localVideoRef} autoPlay playsInline muted className={styles.arenaVideo} />
                <p className={styles.videoLabel}>YOU</p>
              </div>
              <div className={styles.vsLabel}>VS</div>
              <div className={styles.videoSlot}>
                <video ref={remoteVideoRef} autoPlay playsInline className={styles.arenaVideo} />
                <p className={styles.videoLabel}>THEM</p>
              </div>
            </div>

            {countdown !== null && (
              <motion.div
                className={styles.countdownOverlay}
                key={countdown}
                initial={{ scale: 1.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <span className={styles.countdownNum}>{countdown}</span>
              </motion.div>
            )}

            {pvpState === "analyzing" && (
              <div className={styles.analyzingBanner}>
                <div className={styles.analyzeSpinner} />
                <span>Analyzing faces…</span>
              </div>
            )}
          </motion.div>
        )}

        {pvpState === "result" && result && (
          <motion.div
            key="result"
            className={styles.results}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className={styles.resultCards}>
              {/* My card */}
              <motion.div
                className={`${styles.resultCard} ${result.winner === "me" ? styles.winnerCard : styles.loserCard}`}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {result.winner === "me" && (
                  <motion.div
                    className={styles.crownBadge}
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6, type: "spring" }}
                  >
                    👑 MOGGER
                  </motion.div>
                )}
                {result.winner === "them" && (
                  <motion.div
                    className={styles.moggedStamp}
                    initial={{ scale: 1.5, opacity: 0, rotate: -15 }}
                    animate={{ scale: 1, opacity: 1, rotate: -12 }}
                    transition={{ delay: 0.6, type: "spring" }}
                  >
                    MOGGED
                  </motion.div>
                )}
                <p className={styles.resultName}>YOU</p>
                <p className={styles.resultRatingNum}>
                  {(result.myRating / 10).toFixed(1)}
                  <span className={styles.resultSlash}>/10</span>
                </p>
              </motion.div>

              {/* Their card */}
              <motion.div
                className={`${styles.resultCard} ${result.winner === "them" ? styles.winnerCard : styles.loserCard}`}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                {result.winner === "them" && (
                  <motion.div
                    className={styles.crownBadge}
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7, type: "spring" }}
                  >
                    👑 MOGGER
                  </motion.div>
                )}
                {result.winner === "me" && (
                  <motion.div
                    className={styles.moggedStamp}
                    initial={{ scale: 1.5, opacity: 0, rotate: -15 }}
                    animate={{ scale: 1, opacity: 1, rotate: -12 }}
                    transition={{ delay: 0.7, type: "spring" }}
                  >
                    MOGGED
                  </motion.div>
                )}
                <p className={styles.resultName}>THEM</p>
                <p className={styles.resultRatingNum}>
                  {(result.theirRating / 10).toFixed(1)}
                  <span className={styles.resultSlash}>/10</span>
                </p>
              </motion.div>
            </div>

            <motion.div
              className={styles.resultFooter}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <p className={styles.resultVerdict}>
                {result.winner === "me"
                  ? "You dominated. The streets are yours."
                  : "You got mogged. Time to level up."}
              </p>
              <button className="btn btn-chrome btn-lg w-full" onClick={handleReset}>
                Play Again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
