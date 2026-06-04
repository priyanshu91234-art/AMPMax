"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import styles from "../auth.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed"); setLoading(false); return; }
      const signInRes = await signIn("credentials", { email, password, redirect: false });
      if (signInRes?.error) { setError("Registered but could not sign in. Try logging in."); setLoading(false); return; }
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className={styles.page}>
      <div className={styles.glow} />
      <motion.div
        className={styles.card}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className={styles.logoMark}>
          <span className={styles.logoText}>AMPMAX</span>
        </motion.div>
        <motion.h1 variants={itemVariants} className={styles.title}>
          Create account
        </motion.h1>
        <motion.p variants={itemVariants} className={styles.subtitle}>
          Start your analysis — it&apos;s free
        </motion.p>

        <motion.button
          variants={itemVariants}
          className={styles.googleBtn}
          onClick={handleGoogle}
          disabled={googleLoading}
          type="button"
        >
          {googleLoading ? (
            <div className="spinner" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          <span>{googleLoading ? "Signing up…" : "Continue with Google"}</span>
        </motion.button>

        <motion.div variants={itemVariants} className="divider-text">
          or
        </motion.div>

        <motion.form
          variants={containerVariants}
          onSubmit={handleSubmit}
          className={styles.form}
        >
          <motion.div variants={itemVariants} className="input-group">
            <label className="input-label" htmlFor="reg-name">Display Name</label>
            <input
              id="reg-name"
              className="input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              autoComplete="name"
            />
          </motion.div>
          <motion.div variants={itemVariants} className="input-group">
            <label className="input-label" htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </motion.div>
          <motion.div variants={itemVariants} className="input-group">
            <label className="input-label" htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </motion.div>

          {error && (
            <motion.p
              className={styles.errorMsg}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.p>
          )}

          <motion.button
            variants={itemVariants}
            type="submit"
            className={`btn btn-primary w-full ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading ? <div className="spinner" /> : "Create Account"}
          </motion.button>
        </motion.form>

        <motion.p variants={itemVariants} className={styles.switchText}>
          Already have an account?{" "}
          <Link href="/login" className={styles.switchLink}>
            Sign in
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
