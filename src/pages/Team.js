import Image from 'next/image';
import KarloImia from '../assets/img/KarloiMia.png';
import Karlo from '../assets/img/Karlo.png';
import Mia from '../assets/img/Mia.png';
import styles from '@/styles/Main.module.scss'
import Contact from '@/Navigation/Contact';


const oagenciji = () => {
    return(
        <div>
        <div className={`${styles.oagenciji} ${styles.agencySection} ${styles.container}`}>
            <div className={styles.contentBlock}>
                <div className={styles.content}>
                    <h2 className={styles.leftTitle}>Who we are?</h2>
                    <p className={styles.paragraph}>
                    AltroMeda is team of software engineers and marketers focused on 
                    SEO and improvment of digitial presence. 
                    We aim to direct your digitial future with strategic apporach, 
                    and provide the key to unlock your maximum potential.
                    </p>
                </div>
                <Image className={styles.agencyImage} src={KarloImia} alt="Karlo And Mia" />
            </div>
        </div>
        <div className={`${styles.oagenciji} ${styles.agencySection} ${styles.container}`}>
            <div className={styles.contentBlock}>
                <Image className={styles.agencyImage} src={Karlo} alt="Karlo And Mia" />
                <div className={styles.content}>
                    <span className={styles.span}>CO-FOUNDER</span>
                    <h2 className={styles.title}>Karlo Gudić</h2>
                    <p className={styles.paragraph}>
                    My name is Karlo, and I began my career as a web developer, 
                    but I've spent the last two years focusing solely 
                    on digital marketing and search engine optimization.
                    </p>
                </div>
            </div>
        </div>
        <div className={`${styles.oagenciji} ${styles.agencySection} ${styles.container}`}>
            <div className={styles.contentBlock}>
                <Image className={styles.agencyImage} src={Mia} alt="Karlo And Mia" />
                <div className={styles.content}>
                    <span className={styles.span}>CO-FOUNDER</span>
                    <h2 className={styles.title}>Mia Gudić</h2>
                    <p className={styles.paragraph}>
                    My name is Mia, and I'm in charge of the developer side of things. 
                    My responsibility is to keep the code clean and the website running smoothly.
                    </p>
                </div>
            </div>
        </div>
        < Contact/>
        </div>
    )
}

export default oagenciji;