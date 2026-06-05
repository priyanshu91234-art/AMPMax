"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import styles from "./page.module.css";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    name: string;
    image: string | null;
  };
}

interface PostDetail {
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
  comments: Comment[];
}

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const res = await fetch(`/api/community/${id}`);
      if (!res.ok) {
        router.push("/community");
        return;
      }
      const data = await res.json();
      setPost(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText || !session) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/community/${id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText }),
      });
      if (res.ok) {
        setCommentText("");
        fetchPost();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (value: number) => {
    if (!post) return;
    try {
      const res = await fetch(`/api/community/${post.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      if (res.ok) {
        fetchPost();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className={styles.loader}><div className="skeleton" style={{ height: "400px", borderRadius: "20px" }} /></div>;
  if (!post) return null;

  return (
    <div className={styles.page}>
      <button onClick={() => router.back()} className={styles.backBtn}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        Back to Community
      </button>

      <div className={`glass-card ${styles.postCard}`}>
        <div className={styles.voteColumn}>
          <button className={styles.voteBtn} onClick={() => handleVote(1)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 15l-6-6-6 6" /></svg>
          </button>
          <span className={styles.voteCount}>{post.upvotes}</span>
          <button className={styles.voteBtn} onClick={() => handleVote(-1)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
          </button>
        </div>
        <div className={styles.postContent}>
          <div className={styles.postMeta}>
            <span className={styles.author}>Posted by {post.user?.name || "Anonymous"}</span>
            <span className={styles.dot}>•</span>
            <span className={styles.date}>{new Date(post.createdAt).toLocaleDateString()}</span>
          </div>
          <h1 className={styles.postTitle}>{post.title}</h1>
          <p className={styles.postBody}>{post.content}</p>
        </div>
      </div>

      <div className={styles.commentSection}>
        <h3 className={styles.sectionTitle}>{post.comments.length} Comments</h3>
        
        {session && (
          <form onSubmit={handleCreateComment} className={styles.commentForm}>
            <textarea 
              placeholder="What are your thoughts?"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
              required
            />
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? "Posting..." : "Comment"}
            </button>
          </form>
        )}

        <div className={styles.commentsList}>
          {post.comments.map((comment) => (
            <div key={comment.id} className={styles.commentItem}>
              <div className={styles.commentMeta}>
                <span className={styles.commentAuthor}>{comment.user?.name || "Anonymous"}</span>
                <span className={styles.dot}>•</span>
                <span className={styles.commentDate}>{new Date(comment.createdAt).toLocaleDateString()}</span>
              </div>
              <p className={styles.commentBody}>{comment.content}</p>
            </div>
          ))}
          {post.comments.length === 0 && (
            <p className={styles.noComments}>No comments yet. Be the first to share your thoughts!</p>
          )}
        </div>
      </div>
    </div>
  );
}
