"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./UpgradeModal.module.css";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: "scan_limit" | "pvp" | "progress" | "generic";
}

const REASONS: Record<string, { title: string; desc: string }> = {
  scan_limit: {
    title: "You've Used All Free Scans",
    desc: "You've hit the 2-scan free limit. Upgrade to Premium for unlimited AI face analyses.",
  },
  pvp: {
    title: "PVP Arena — Premium Only",
    desc: "Compete against real users in real-time. This feature is exclusive to Premium members.",
  },
  progress: {
    title: "Progress Tracking — Premium Only",
    desc: "Track your improvement over time with detailed analytics. Upgrade to unlock.",
  },
  generic: {
    title: "Upgrade to Premium",
    desc: "Unlock all AMPMax features with a Premium subscription.",
  },
};

const FEATURES = [
  { icon: "♾️", label: "Unlimited AI scans" },
  { icon: "⚔️", label: "PVP Arena access" },
  { icon: "📈", label: "Progress tracking" },
  { icon: "🏆", label: "Leaderboard & ranking" },
  { icon: "💬", label: "Community posts & comments" },
  { icon: "🔓", label: "All future features" },
];

export default function UpgradeModal({ isOpen, onClose, reason = "generic" }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { title, desc } = REASONS[reason] ?? REASONS.generic;

  const handleUpgrade = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.backdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow orb */}
            <div className={styles.glowOrb} />

            {/* Header */}
            <div className={styles.header}>
              <div className={styles.crownIcon}>👑</div>
              <h2 className={styles.title}>{title}</h2>
              <p className={styles.desc}>{desc}</p>
            </div>

            {/* Pricing card */}
            <div className={styles.pricingCard}>
              <div className={styles.priceRow}>
                <span className={styles.price}>$3.99</span>
                <span className={styles.period}>/month</span>
              </div>
              <p className={styles.pricingLabel}>AMPMax Premium</p>
            </div>

            {/* Features */}
            <ul className={styles.featureList}>
              {FEATURES.map((f) => (
                <li key={f.label} className={styles.featureItem}>
                  <span className={styles.featureIcon}>{f.icon}</span>
                  <span className={styles.featureLabel}>{f.label}</span>
                </li>
              ))}
            </ul>

            {error && <p className={styles.errorMsg}>{error}</p>}

            {/* CTA */}
            <button
              className={styles.upgradeBtn}
              onClick={handleUpgrade}
              disabled={loading}
            >
              {loading ? (
                <span className={styles.spinner} />
              ) : (
                "Upgrade to Premium"
              )}
            </button>

            <button className={styles.skipBtn} onClick={onClose}>
              Maybe later
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
