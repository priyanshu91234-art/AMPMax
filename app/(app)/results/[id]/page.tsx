"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import styles from "./page.module.css";
import type { ScanAnalysis, RoadmapStep, ProductRecommendation } from "@/lib/gemini";

interface ResultData {
  id: string;
  rating: number;
  label: string;
  analysis: ScanAnalysis;
  roadmap: RoadmapStep[];
  products: ProductRecommendation[];
  createdAt: string;
}

const TIER_BADGE: Record<string, string> = {
  Sub3: "badge-sub3", Sub5: "badge-sub5", LTN: "badge-ltn",
  MTN: "badge-mtn", HTN: "badge-htn", Chad: "badge-chad", "True Adam": "badge-true-adam",
};

const PRIORITY_COLOR: Record<string, string> = {
  critical: "#ef4444", high: "#f59e0b", medium: "#a78bfa",
};

export default function ResultsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/scan/${id}`);
        if (!res.ok) throw new Error("Result not found");
        const json = await res.json();
        setData(json);
      } catch {
        setError("Could not load scan result.");
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.skeletonRating} />
        <div className={`skeleton ${styles.skeletonBadge}`} />
        {[1, 2, 3].map((i) => (
          <div key={i} className={`skeleton ${styles.skeletonSection}`} />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.page}>
        <div className={styles.errorState}>
          <p className={styles.errorText}>{error || "No result found."}</p>
          <Link href="/scan" className="btn btn-primary">Scan Again</Link>
        </div>
      </div>
    );
  }

  const displayRating = (data.rating / 10).toFixed(1);
  const badgeClass = TIER_BADGE[data.label] || "badge-mtn";

  const ANALYSIS_KEYS: { key: keyof ScanAnalysis; label: string }[] = [
    { key: "overallStructure", label: "Overall Structure" },
    { key: "jawline", label: "Jawline" },
    { key: "symmetry", label: "Symmetry" },
    { key: "skinQuality", label: "Skin Quality" },
    { key: "eyeArea", label: "Eye Area" },
    { key: "noseProfile", label: "Nose Profile" },
  ];

  return (
    <div className={styles.page}>
      {/* Rating Hero */}
      <motion.section
        className={styles.ratingHero}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className={styles.ratingOrb} />
        <motion.div
          className={styles.ratingDisplay}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.7, type: "spring" }}
        >
          <span className={styles.ratingNum}>{displayRating}</span>
          <span className={styles.ratingSlash}>/10</span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <span className={`badge ${badgeClass} ${styles.tierBadge}`}>{data.label}</span>
        </motion.div>
        <motion.p
          className={styles.ratingDate}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          {new Date(data.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </motion.p>
      </motion.section>

      {/* Analysis Breakdown */}
      <motion.section
        className={styles.section}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <h2 className={styles.sectionTitle}>Analysis</h2>
        <div className={styles.analysisGrid}>
          {ANALYSIS_KEYS.map((item) => (
            <div key={item.key} className={`glass-card ${styles.analysisCard}`}>
              <p className={styles.analysisLabel}>{item.label}</p>
              <p className={styles.analysisText}>{data.analysis[item.key]}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Roadmap */}
      <motion.section
        className={styles.section}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.6 }}
      >
        <h2 className={styles.sectionTitle}>Your Roadmap</h2>
        <div className={styles.roadmap}>
          {data.roadmap.map((phase: RoadmapStep, i: number) => (
            <motion.div
              key={i}
              className={`glass-card ${styles.phaseCard}`}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.12 }}
            >
              <div className={styles.phaseHeader}>
                <div className={styles.phaseDot} style={{ background: PRIORITY_COLOR[phase.priority] }} />
                <div>
                  <p className={styles.phaseTimeframe}>{phase.timeframe}</p>
                  <p className={styles.phaseTitle}>{phase.title}</p>
                </div>
                <span className={styles.phasePriority} style={{ color: PRIORITY_COLOR[phase.priority] }}>
                  {phase.priority}
                </span>
              </div>
              <ul className={styles.phaseSteps}>
                {phase.steps.map((step: string, j: number) => (
                  <li key={j} className={styles.phaseStep}>
                    <span className={styles.phaseStepDot} />
                    {step}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Product Recommendations */}
      <motion.section
        className={styles.section}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
      >
        <h2 className={styles.sectionTitle}>Recommended Products</h2>
        <p className={styles.sectionSubtitle}>Curated based on your tier and scan results</p>
        <div className={styles.products}>
          {data.products.map((product: ProductRecommendation, i: number) => (
            <motion.a
              key={i}
              href={product.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`glass-card ${styles.productCard}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75 + i * 0.1 }}
              whileHover={{ y: -2 }}
            >
              <div className={styles.productTop}>
                <div>
                  <p className={styles.productCategory}>{product.category}</p>
                  <p className={styles.productName}>{product.name}</p>
                </div>
                <p className={styles.productPrice}>{product.price}</p>
              </div>
              <p className={styles.productReason}>{product.reason}</p>
              <div className={styles.productBuyRow}>
                <span className={styles.productBuyLink}>View Product →</span>
              </div>
            </motion.a>
          ))}
        </div>
      </motion.section>

      {/* Actions */}
      <div className={styles.resultActions}>
        <Link href="/scan" className="btn btn-chrome btn-lg w-full">
          Scan Again
        </Link>
        <Link href="/progress" className="btn btn-secondary btn-lg w-full">
          View Progress
        </Link>
      </div>
    </div>
  );
}
