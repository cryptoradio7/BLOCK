import styles from './Logo.module.css'

export default function Logo() {
  return (
    <div className={styles.logoContainer}>
      <div className={styles.logo}>
        <div className={styles.circle}>
          <div className={styles.letterA}>A</div>
          <div className={styles.mountain}></div>
        </div>
      </div>
      <div className={styles.text}>
        <div className={styles.agile}>Agile</div>
        <div className={styles.vizion}>Vizion</div>
        <div className={styles.block}>BLOCK</div>
      </div>
    </div>
  )
} 