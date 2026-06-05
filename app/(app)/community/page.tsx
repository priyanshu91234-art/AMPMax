"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

interface Post {
  id: string;
  title: string;
  content: string;
  upvotes: number;
  createdAt: string;
  userVote?: number | null;
  user: {
    name: string;
    image: string | null;
  };
}

export default function CommunityPage() {
  const { data: session } = useSession();
  const router = useRouter();
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
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    
    if (!session) {
      router.push("/login");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), content: newContent.trim() }),
      });
      
      const data = await res.json();

      if (res.ok) {
        setNewTitle("");
        setNewContent("");
        setShowCreate(false);
        fetchPosts();
      } else {
        const errorMsg = data.details ? `${data.error}: ${data.details}` : (data.error || "Failed to create post.");
        alert(errorMsg);
      }
    } catch (err) {
      console.error(err);
      alert("A network error occurred. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (postId: string, value: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session) {
      router.push("/login");
      return;
    }

    // Optimistic UI
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const oldVote = p.userVote || 0;
        let newCount = p.upvotes;
        
        if (oldVote === value) { // toggle off
          newCount -= value;
          return { ...p, upvotes: newCount, userVote: 0 };
        } else if (oldVote === 0) { // new vote
          newCount += value;
          return { ...p, upvotes: newCount, userVote: value };
        } else { // change vote
          newCount += (2 * value);
          return { ...p, upvotes: newCount, userVote: value };
        }
      }
      return p;
    }));

    try {
      const res = await fetch(`/api/community/${postId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) {
        // Revert on error
        const data = await res.json();
        console.error(data.error);
        fetchPosts();
      }
    } catch (err) {
      console.error(err);
      fetchPosts();
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
          {posts.length > 0 ? posts.map((post) => (
            <div key={post.id} className={`glass-card ${styles.postCard}`}>
              <div className={styles.voteColumn}>
                <div 
                  className={`${styles.voteBtn} ${post.userVote === 1 ? styles.upvoted : ""}`}
                  onClick={(e) => handleVote(post.id, 1, e)}
                  role="button"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={post.userVote === 1 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5"><path d="M18 15l-6-6-6 6" /></svg>
                </div>
                <span className={`${styles.voteCount} ${post.userVote === 1 ? styles.upvotedText : post.userVote === -1 ? styles.downvotedText : ""}`}>
                  {post.upvotes}
                </span>
                <div 
                  className={`${styles.voteBtn} ${post.userVote === -1 ? styles.downvoted : ""}`}
                  onClick={(e) => handleVote(post.id, -1, e)}
                  role="button"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={post.userVote === -1 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
                </div>
              </div>
              <Link href={`/community/${post.id}`} className={styles.postContent}>
                <div className={styles.postMeta}>
                  <span className={styles.author}>Posted by {post.user?.name || "Anonymous"}</span>
                  <span className={styles.dot}>•</span>
                  <span className={styles.date}>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
                <h2 className={styles.postTitle}>{post.title}</h2>
                <p className={styles.postBody}>{post.content.length > 300 ? post.content.substring(0, 300) + "..." : post.content}</p>
                <div className={styles.postActions}>
                  <div className={styles.actionItem}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                    <span>Discussion</span>
                  </div>
                </div>
              </Link>
            </div>
          )) : (
            <div className={styles.empty}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              <h3>No posts yet</h3>
              <p>Be the first to share something with the community!</p>
              <button className="btn btn-secondary" onClick={() => setShowCreate(true)}>Create Post</button>
            </div>
          )}
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
                <div className={styles.modalTitleArea}>
                  <h2>Create Post</h2>
                  {session?.user && (
                    <span className={styles.postingAs}>
                      Posting as <strong>{session.user.name || session.user.email}</strong>
                    </span>
                  )}
                </div>
                <button onClick={() => setShowCreate(false)} className={styles.closeBtn}>×</button>
              </div>
              <form onSubmit={handleCreatePost} className={styles.form}>
                <div className={styles.field}>
                  <input 
                    type="text" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Title"
                    className={styles.titleInput}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <textarea 
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Text (optional)"
                    rows={8}
                    className={styles.contentInput}
                    required
                  />
                </div>
                <div className={styles.modalFooter}>
                  <button 
                    type="button" 
                    onClick={() => setShowCreate(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={submitting || !session}
                  >
                    {submitting ? "Posting..." : "Post"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
