"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import styles from "./page.module.css";

const FREE_FEATURES = [
  { label: "2 AI face scans", included: true },
  { label: "Community posts & comments", included: true },
  { label: "Basic scan results", included: true },
  { label: "Unlimited scans", included: false },
  { label: "PVP Arena", included: false },
  { label: "Progress tracking", included: false },
  { label: "Leaderboard access", included: false },
];

const PREMIUM_FEATURES = [
  { label: "Unlimited AI face scans", included: true },
  { label: "Community posts & comments", included: true },
  { label: "Full detailed scan results", included: true },
  { label: "PVP Arena — real-time battles", included: true },
  { label: "Progress tracking & analytics", included: true },
  { label: "Leaderboard & ranking", included: true },
  { label: "All future features", included: true },
];

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPremium, setIsPremium] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/subscription/status")
      .then((r) => r.json())
      .then((d) => setIsPremium(d.isPremium ?? false))
      .catch(() => setIsPremium(false));
  }, []);

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

  const handlePortal = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className={styles.badge}>👑 Pricing</div>
        <h1 className={styles.title}>Choose Your Plan</h1>
        <p className={styles.subtitle}>
          Start free. Upgrade when you&apos;re ready to go all in.
        </p>
      </motion.div>

      <motion.div
        className={styles.cards}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Free Plan */}
        <motion.div className={`${styles.card} ${styles.freeCard}`} variants={itemVariants}>
          <div className={styles.planLabel}>Free</div>
          <div className={styles.priceRow}>
            <span className={styles.price}>$0</span>
            <span className={styles.period}>/forever</span>
          </div>
          <ul className={styles.featureList}>
            {FREE_FEATURES.map((f) => (
              <li key={f.label} className={`${styles.featureItem} ${!f.included ? styles.featureExcluded : ""}`}>
                <span className={styles.featureCheck}>
                  {f.included ? "✓" : "✗"}
                </span>
                {f.label}
              </li>
            ))}
          </ul>
          <Link href="/dashboard" className={`${styles.planBtn} ${styles.planBtnFree}`}>
            Go to Dashboard
          </Link>
        </motion.div>

        {/* Premium Plan */}
        <motion.div className={`${styles.card} ${styles.premiumCard}`} variants={itemVariants}>
          <div className={styles.popularBadge}>Most Popular</div>
          <div className={styles.planLabel}>Premium</div>
          <div className={styles.priceRow}>
            <span className={`${styles.price} ${styles.priceGold}`}>$3.99</span>
            <span className={styles.period}>/month</span>
          </div>
          <p className={styles.planTagline}>Everything you need to maximize your looks.</p>
          <ul className={styles.featureList}>
            {PREMIUM_FEATURES.map((f) => (
              <li key={f.label} className={styles.featureItem}>
                <span className={`${styles.featureCheck} ${styles.featureCheckGold}`}>✓</span>
                {f.label}
              </li>
            ))}
          </ul>

          {error && <p className={styles.errorMsg}>{error}</p>}

          {isPremium ? (
            <div className={styles.currentPlanWrap}>
              <div className={styles.currentPlanBadge}>✓ Current Plan</div>
              <button
                className={`${styles.planBtn} ${styles.planBtnSecondary}`}
                onClick={handlePortal}
                disabled={loading}
              >
                {loading ? "Loading…" : "Manage Subscription"}
              </button>
            </div>
          ) : (
            <button
              className={`${styles.planBtn} ${styles.planBtnPremium}`}
              onClick={handleUpgrade}
              disabled={loading}
            >
              {loading ? (
                <span className={styles.spinner} />
              ) : (
                "Upgrade to Premium →"
              )}
            </button>
          )}
        </motion.div>
      </motion.div>

      <motion.p
        className={styles.footer}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        Cancel anytime. No hidden fees. Billed securely through Stripe.
      </motion.p>
    </div>
  );
}
