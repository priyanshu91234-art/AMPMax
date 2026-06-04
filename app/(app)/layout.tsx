import { AppNav } from "@/components/layout/AppNav";
import styles from "./layout.module.css";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <AppNav />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
