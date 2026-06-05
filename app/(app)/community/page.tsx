"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import styles from "./page.module.css";

interface Post {
  id: string;
  title: string;
  content: string;
  upvotes: number;
  createdAt: string;
  user: {
    name: string;
    image: string | null;
  };
}

export default function CommunityPage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/community");
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, content: newContent }),
      });
      if (res.ok) {
        setNewTitle("");
        setNewContent("");
        setShowCreate(false);
        fetchPosts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (postId: string, value: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/community/${postId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      if (res.ok) {
        fetchPosts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Community</h1>
          <p className={styles.subtitle}>Ask questions, share results, and level up with others.</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreate(true)}
        >
          Create Post
        </button>
      </header>

      {loading ? (
        <div className={styles.loader}>
          {[1, 2, 3].map(i => (
            <div key={i} className={`skeleton ${styles.postSkeleton}`} />
          ))}
        </div>
      ) : (
        <div className={styles.feed}>
          {Array.isArray(posts) && posts.map((post) => (
            <div key={post.id} className={`glass-card ${styles.postCard}`}>
              <div className={styles.voteColumn}>
                <div 
                  className={styles.voteBtn}
                  onClick={(e) => handleVote(post.id, 1, e)}
                  role="button"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 15l-6-6-6 6" /></svg>
                </div>
                <span className={styles.voteCount}>{post.upvotes}</span>
                <div 
                  className={styles.voteBtn}
                  onClick={(e) => handleVote(post.id, -1, e)}
                  role="button"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
                </div>
              </div>
              <Link href={`/community/${post.id}`} className={styles.postContent}>
                <div className={styles.postMeta}>
                  <span className={styles.author}>Posted by {post.user?.name || "Anonymous"}</span>
                  <span className={styles.dot}>•</span>
                  <span className={styles.date}>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
                <h2 className={styles.postTitle}>{post.title}</h2>
                <p className={styles.postBody}>{post.content.length > 160 ? post.content.substring(0, 160) + "..." : post.content}</p>
                <div className={styles.postActions}>
                  <div className={styles.actionItem}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                    <span>View Comments</span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div 
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className={`glass-card ${styles.modal}`}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
            >
              <div className={styles.modalHeader}>
                <h2>Create Community Post</h2>
                <button onClick={() => setShowCreate(false)} className={styles.closeBtn}>×</button>
              </div>
              <form onSubmit={handleCreatePost} className={styles.form}>
                <div className={styles.field}>
                  <label>Title</label>
                  <input 
                    type="text" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ask a question or share a tip..."
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label>Content</label>
                  <textarea 
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Tell the community more..."
                    rows={6}
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary w-full"
                  disabled={submitting}
                >
                  {submitting ? "Posting..." : "Post to Community"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
