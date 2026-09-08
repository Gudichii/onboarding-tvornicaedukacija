import Image from 'next/image';
import rankHigher from '../assets/img/rankHigher.png';
import styles from '@/styles/Main.module.scss'

const oagenciji = () => {
    return(
        <section className={`${styles.oagenciji} ${styles.agencySection} ${styles.container}`}>
            <div className={`${styles.contentBlock} ${styles.RankContentBlock}`}>
                <Image className={styles.agencyImage} src={rankHigher} alt="Rank Higher" />
                <div className={styles.content}>
                    <span className={styles.span}>RANK HIGHER</span>
                    <h2 className={styles.title}>Rank higher</h2>
                    <p className={styles.paragraph}>
                        You can have a wonderfully designed website, 
                        but it will be useless if it does not match the optimization requirement 
                        since users will be unable to access you. 
                        Our mission statement is to develop a well-designed and optimized web solution.
                    </p>
                </div>
            </div>
        </section>
    )
}

export default oagenciji;