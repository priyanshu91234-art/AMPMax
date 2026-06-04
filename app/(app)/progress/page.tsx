"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import styles from "./page.module.css";

interface HistoryItem {
  id: string;
  rating: number;
  label: string;
  createdAt: string;
}

const TIER_BADGE: Record<string, string> = {
  Sub3: "badge-sub3", Sub5: "badge-sub5", LTN: "badge-ltn",
  MTN: "badge-mtn", HTN: "badge-htn", Chad: "badge-chad", "True Adam": "badge-true-adam",
};

export default function ProgressPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/history")
      .then((r) => r.json())
      .then((d) => { setHistory(d.results || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const best = history.length ? Math.max(...history.map((h) => h.rating)) : null;
  const latest = history[0];
  const prev = history[1];
  const delta = latest && prev ? latest.rating - prev.rating : null;

  return (
    <div className={styles.page}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className={styles.title}>Progress</h1>
        <p className={styles.subtitle}>Track how your rating evolves over time</p>
      </motion.div>

      {loading ? (
        <div className={styles.skeletons}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={`skeleton ${styles.skeletonItem}`} />
          ))}
        </div>
      ) : history.length === 0 ? (
        <motion.div
          className={styles.emptyState}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className={styles.emptyIcon}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#303030" }}>
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <p className={styles.emptyTitle}>No scans yet</p>
          <p className={styles.emptyDesc}>Complete your first scan to start tracking your progress</p>
          <Link href="/scan" className="btn btn-chrome">Start First Scan</Link>
        </motion.div>
      ) : (
        <>
          {/* Stats row */}
          <motion.div
            className={styles.statsRow}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className={`glass-card ${styles.statCard}`}>
              <p className={styles.statLabel}>Best</p>
              <p className={styles.statVal}>{best !== null ? (best / 10).toFixed(1) : "—"}</p>
            </div>
            <div className={`glass-card ${styles.statCard}`}>
              <p className={styles.statLabel}>Latest</p>
              <p className={styles.statVal}>{latest ? (latest.rating / 10).toFixed(1) : "—"}</p>
            </div>
            <div className={`glass-card ${styles.statCard}`}>
              <p className={styles.statLabel}>Scans</p>
              <p className={styles.statVal}>{history.length}</p>
            </div>
            {delta !== null && (
              <div className={`glass-card ${styles.statCard}`}>
                <p className={styles.statLabel}>Change</p>
                <p className={`${styles.statVal} ${delta >= 0 ? styles.deltaPositive : styles.deltaNegative}`}>
                  {delta >= 0 ? "+" : ""}{(delta / 10).toFixed(1)}
                </p>
              </div>
            )}
          </motion.div>

          {/* History list */}
          <div className={styles.historyList}>
            {history.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.07 }}
              >
                <Link href={`/results/${item.id}`} className={`glass-card ${styles.historyItem}`}>
                  <div className={styles.historyLeft}>
                    <span className={`badge ${TIER_BADGE[item.label] || "badge-mtn"}`}>{item.label}</span>
                    <span className={styles.historyDate}>
                      {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <div className={styles.historyRight}>
                    <span className={styles.historyRating}>{(item.rating / 10).toFixed(1)}</span>
                    <span className={styles.historySlash}>/10</span>
                    {i === 0 && <span className={styles.latestTag}>Latest</span>}
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "#404040", flexShrink: 0 }}>
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              </motion.div>
            ))}
          </div>
        </>
      )}

      <motion.div
        className={styles.ctaRow}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Link href="/scan" className="btn btn-chrome w-full">
          New Scan
        </Link>
      </motion.div>
    </div>
  );
}
