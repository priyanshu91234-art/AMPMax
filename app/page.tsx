"use client";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
import styles from "./page.module.css";

export default function LandingPage() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 15 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 15 });
  const rotateX = useTransform(springY, [-300, 300], [5, -5]);
  const rotateY = useTransform(springX, [-300, 300], [-5, 5]);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left - rect.width / 2);
      mouseY.set(e.clientY - rect.top - rect.height / 2);
    };
    el.addEventListener("mousemove", handleMove);
    return () => el.removeEventListener("mousemove", handleMove);
  }, [mouseX, mouseY]);

  const FEATURES = [
    {
      icon: "⬡",
      title: "AI Facial Analysis",
      desc: "Gemini Vision analyzes symmetry, structure, skin quality, and more — front and side profile.",
    },
    {
      icon: "◈",
      title: "Tier Classification",
      desc: "Your rating maps to a tier: Sub3, LTN, MTN, HTN, Chad, or True Adam. No sugarcoating.",
    },
    {
      icon: "⊕",
      title: "Personal Roadmap",
      desc: "A tailored, phase-by-phase improvement plan based on your specific scan results.",
    },
    {
      icon: "⚔",
      title: "PVP Arena",
      desc: "Face off against real users in real time. The better-looking one walks away crowned Mogger.",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <div className={styles.page}>
      {/* Background gradient orbs */}
      <div className={styles.orb1} />
      <div className={styles.orb2} />

      {/* Hero */}
      <section className={styles.hero} ref={heroRef}>
        <motion.div
          className={styles.heroInner}
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />
            <span>Facial Intelligence Platform</span>
          </motion.div>

          <motion.h1 variants={itemVariants} className={`display-xl ${styles.headline}`}>
            <span className="text-gradient">Know</span>
            <br />
            Your Level.
          </motion.h1>

          <motion.p variants={itemVariants} className={styles.subheadline}>
            Upload your front and side profile. Our AI delivers a score, tier classification,
            and a personalized transformation roadmap — in seconds.
          </motion.p>

          <motion.div variants={itemVariants} className={styles.ctaRow}>
            <Link href="/register" className={`btn btn-chrome btn-lg ${styles.primaryCta}`}>
              Get Rated Free
            </Link>
            <Link href="/login" className={`btn btn-secondary btn-lg`}>
              Sign In
            </Link>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className={styles.heroCard}
            style={{ rotateX, rotateY, transformPerspective: 1200 }}
          >
            <div className={styles.heroCardInner}>
              <div className={styles.heroRating}>
                <span className={styles.heroRatingNum}>8.4</span>
                <span className={styles.heroRatingSlash}>/10</span>
              </div>
              <div className={`badge badge-htn ${styles.heroBadge}`}>HTN</div>
              <div className={styles.heroBars}>
                {[
                  { label: "Jawline", val: 82 },
                  { label: "Symmetry", val: 79 },
                  { label: "Skin", val: 91 },
                  { label: "Structure", val: 84 },
                ].map((bar) => (
                  <div key={bar.label} className={styles.heroBar}>
                    <span className={styles.heroBarLabel}>{bar.label}</span>
                    <div className={styles.heroBarTrack}>
                      <motion.div
                        className={styles.heroBarFill}
                        initial={{ width: 0 }}
                        animate={{ width: `${bar.val}%` }}
                        transition={{ duration: 1.2, delay: 1, ease: "easeOut" }}
                      />
                    </div>
                    <span className={styles.heroBarVal}>{bar.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <motion.div
          className={styles.featuresGrid}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={containerVariants}
        >
          {FEATURES.map((f) => (
            <motion.div key={f.title} variants={itemVariants} className={`glass-card ${styles.featureCard}`}>
              <span className={styles.featureIcon}>{f.icon}</span>
              <h3 className={`heading-md ${styles.featureTitle}`}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Tier Scale */}
      <section className={styles.tiers}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2 className={`display-md text-center ${styles.tiersTitle}`}>The Scale</h2>
          <p className="text-secondary text-center" style={{ marginTop: 8, marginBottom: 40 }}>
            Where do you land?
          </p>
          <div className={styles.tiersList}>
            {[
              { label: "Sub3", range: "0.0 – 2.5", className: "badge-sub3", desc: "Starting point" },
              { label: "Sub5", range: "2.6 – 3.0", className: "badge-sub5", desc: "Below average" },
              { label: "LTN", range: "3.1 – 5.0", className: "badge-ltn", desc: "Lower tier normal" },
              { label: "MTN", range: "5.1 – 7.5", className: "badge-mtn", desc: "Mid tier normal" },
              { label: "HTN", range: "7.6 – 8.5", className: "badge-htn", desc: "Upper tier normal" },
              { label: "Chad", range: "8.6 – 9.5", className: "badge-chad", desc: "Elite" },
              { label: "True Adam", range: "9.6 – 10.0", className: "badge-true-adam", desc: "Top 0.1%" },
            ].map((tier, i) => (
              <motion.div
                key={tier.label}
                className={styles.tierRow}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
              >
                <span className={`badge ${tier.className}`}>{tier.label}</span>
                <span className={styles.tierRange}>{tier.range}</span>
                <span className={styles.tierDesc}>{tier.desc}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <motion.div
          className={styles.ctaBox}
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2 className={`display-md text-gradient`}>Ready to find out?</h2>
          <p className="text-secondary" style={{ marginTop: 12, marginBottom: 32 }}>
            Upload your photos. Get your rating. Build your roadmap.
          </p>
          <Link href="/register" className="btn btn-chrome btn-lg">
            Start Your Scan
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
