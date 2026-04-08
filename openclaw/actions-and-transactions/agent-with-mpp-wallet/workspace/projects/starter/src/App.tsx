import styles from './App.module.css';

export default function App() {
  return (
    <main className={styles.container}>
      <span className={styles.emoji}>💳</span>
      <h1 className={styles.title}>Agent with Wallet</h1>
      <p className={styles.description}>
        Your purchasing agent is ready. Talk to it to discover and pay for services.
      </p>
    </main>
  );
}
