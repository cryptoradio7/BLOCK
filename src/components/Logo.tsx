import styles from './Logo.module.css'

export default function Logo() {
  return (
    <div className={styles.logoContainer}>
      <div className={styles.logo}>
        <div className={styles.circle}>
          <div className={styles.letterB}>B</div>
        </div>
      </div>
      <div className={styles.text}>
        <div className={styles.block}>BLOCK</div>
      </div>
    </div>
  )
} 