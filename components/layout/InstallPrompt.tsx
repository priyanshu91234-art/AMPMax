"use client";
/**
 * InstallPrompt — Production-grade PWA install experience.
 *
 * • Android: captures the native `beforeinstallprompt` event and triggers
 *   the real system install dialog when the user clicks the button.
 * • iOS:     detects Safari + not-yet-installed, shows a dismissible banner
 *   with Share → Add to Home Screen instructions. Dismissal is persisted
 *   to localStorage so it never nags again.
 * • Already installed (standalone mode): renders nothing.
 *
 * All window / navigator access is safely gated inside useEffect so the
 * component is fully SSR-compatible with Next.js.
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./InstallPrompt.module.css";

// ─── Types ───────────────────────────────────────────────────────────────────
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "android" | "ios" | "other";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const DISMISSED_KEY = "ampmax_ios_banner_dismissed";

function detectPlatform(): Platform {
  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua) && !(window as unknown as Record<string, unknown>).MSStream;
  if (isIOS) return "ios";
  return "other";
}

function isRunningStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

// ─── Component ───────────────────────────────────────────────────────────────
export function InstallPrompt() {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  const [platform, setPlatform] = useState<Platform | null>(null);
  const [showAndroidBtn, setShowAndroidBtn] = useState(false);
  const [showIOSBanner, setShowIOSBanner] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // 1. Already running as installed PWA — hide everything
    if (isRunningStandalone()) {
      setInstalled(true);
      return;
    }

    const p = detectPlatform();
    setPlatform(p);

    // 2. iOS — show sticky banner (unless dismissed before)
    if (p === "ios") {
      const dismissed = localStorage.getItem(DISMISSED_KEY);
      if (!dismissed) setShowIOSBanner(true);
    }

    // 3. Android/Chrome — wait for the native prompt event
    const handlePrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setShowAndroidBtn(true);
    };

    const handleInstalled = () => {
      setInstalled(true);
      setShowAndroidBtn(false);
      setShowIOSBanner(false);
      deferredPrompt.current = null;
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  // ── Android install click ────────────────────────────────────────────────
  const handleAndroidInstall = async () => {
    if (!deferredPrompt.current) return;
    await deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setShowAndroidBtn(false);
    deferredPrompt.current = null;
  };

  // ── iOS dismiss ──────────────────────────────────────────────────────────
  const dismissIOSBanner = () => {
    setShowIOSBanner(false);
    localStorage.setItem(DISMISSED_KEY, "1");
  };

  // Nothing to render if already installed
  if (installed) return null;

  return (
    <>
      {/* ── Android: floating install button ─────────────────────────────── */}
      <AnimatePresence>
        {showAndroidBtn && (
          <motion.div
            className={styles.floatingBtn}
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ delay: 1.5, duration: 0.5, type: "spring", stiffness: 200, damping: 22 }}
          >
            <button
              onClick={handleAndroidInstall}
              className={styles.btn}
              aria-label="Install AMPMAX App"
              id="pwa-install-btn"
            >
              {/* Download icon */}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Install App</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── iOS: sticky bottom banner ─────────────────────────────────────── */}
      <AnimatePresence>
        {showIOSBanner && (
          <motion.div
            className={styles.iosBanner}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ delay: 2, duration: 0.45, type: "spring", stiffness: 200, damping: 24 }}
            id="ios-install-banner"
          >
            <div className={styles.iosBannerContent}>
              {/* App icon */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/icon-72x72.png" alt="AMPMAX" className={styles.iosAppIcon} />
              <div className={styles.iosBannerText}>
                <p className={styles.iosBannerTitle}>Install AMPMAX</p>
                <button
                  className={styles.iosBannerCta}
                  onClick={() => setShowIOSModal(true)}
                  aria-label="Show iOS install instructions"
                >
                  Tap here to add to Home Screen →
                </button>
              </div>
              <button
                className={styles.iosDismiss}
                onClick={dismissIOSBanner}
                aria-label="Dismiss install banner"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── iOS: step-by-step modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {showIOSModal && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowIOSModal(false)}
          >
            <motion.div
              className={styles.modal}
              initial={{ y: 60, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 60, opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHandle} />
              <div className={styles.modalHeader}>
                <span className={styles.modalTitle}>Add to Home Screen</span>
                <button
                  className={styles.closeBtn}
                  onClick={() => setShowIOSModal(false)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className={styles.steps}>
                <div className={styles.step}>
                  <span className={styles.stepNum}>1</span>
                  <p>
                    Tap the{" "}
                    <strong>
                      Share button <ShareIcon />
                    </strong>{" "}
                    at the bottom of Safari
                  </p>
                </div>
                <div className={styles.step}>
                  <span className={styles.stepNum}>2</span>
                  <p>
                    Scroll down and tap{" "}
                    <strong>&ldquo;Add to Home Screen&rdquo;</strong>
                  </p>
                </div>
                <div className={styles.step}>
                  <span className={styles.stepNum}>3</span>
                  <p>
                    Tap <strong>&ldquo;Add&rdquo;</strong> in the top right corner
                  </p>
                </div>
              </div>

              <button
                className={styles.gotItBtn}
                onClick={() => {
                  setShowIOSModal(false);
                  dismissIOSBanner();
                }}
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Inline share icon so there's no extra import
function ShareIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "inline", verticalAlign: "middle", marginLeft: 2 }}
      aria-hidden="true"
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16,6 12,2 8,6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}
