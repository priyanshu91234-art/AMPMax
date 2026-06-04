"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import styles from "./page.module.css";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className={styles.page}>
        <div className={styles.skeletonHero}>
          <div className={`skeleton ${styles.skeletonTitle}`} />
          <div className={`skeleton ${styles.skeletonSub}`} />
        </div>
        <div className={styles.skeletonCards}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={`skeleton ${styles.skeletonCard}`} />
          ))}
        </div>
      </div>
    );
  }

  const name = session?.user?.name?.split(" ")[0] || "User";

  const QUICK_ACTIONS = [
    {
      label: "New Scan",
      desc: "Analyze your front and side profile",
      href: "/scan",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" />
          <path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
    },
    {
      label: "PVP Arena",
      desc: "Compete against real users live",
      href: "/pvp",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      label: "Progress",
      desc: "Track your improvement over time",
      href: "/progress",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      ),
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className={styles.page}>
      <motion.section
        className={styles.hero}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.p variants={itemVariants} className={styles.greeting}>
          Good to see you,
        </motion.p>
        <motion.h1 variants={itemVariants} className={styles.name}>
          {name}
        </motion.h1>
        <motion.p variants={itemVariants} className={styles.prompt}>
          Ready to run your next scan?
        </motion.p>
        <motion.div variants={itemVariants}>
          <Link href="/scan" className={`btn btn-chrome btn-lg ${styles.mainCta}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" />
              <path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Start Scan
          </Link>
        </motion.div>
      </motion.section>

      <motion.section
        className={styles.actions}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {QUICK_ACTIONS.map((action) => (
          <motion.div key={action.href} variants={itemVariants}>
            <Link href={action.href} className={`glass-card ${styles.actionCard}`}>
              <span className={styles.actionIcon}>{action.icon}</span>
              <div>
                <p className={styles.actionLabel}>{action.label}</p>
                <p className={styles.actionDesc}>{action.desc}</p>
              </div>
              <svg className={styles.actionArrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          </motion.div>
        ))}
      </motion.section>
    </div>
  );
}
