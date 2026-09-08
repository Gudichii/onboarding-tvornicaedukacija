import Image from 'next/image';
import deliver from '../assets/img/deliver.png';
import styles from '@/styles/Main.module.scss'

const oagenciji = () => {
    return(
        <section className={`${styles.oagenciji} ${styles.agencySection} ${styles.container}`}>
            <div className={styles.contentBlock}>
                <div className={styles.content}>
                    <span className={styles.span}>DELIVER</span>
                    <h2 className={styles.title}>Meet your “impossible” deadline</h2>
                    <p className={styles.paragraph}>
                        Find out how we’ve 
                        launched sites in under two weeks and how quickly 
                        we can turn your project around.
                    </p>
                </div>
            <Image className={styles.agencyImage} src={deliver} alt="Deliver" />
            </div>
        </section>
    )
}

export default oagenciji;