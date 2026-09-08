import Image from 'next/image';
import Img from '../assets/RoutesImg/consulting.png';
import styles from '@/styles/Main.module.scss'
import Link from 'next/link';
import Head from 'next/head';

const Consulting = () => {
    return(
        <div>
        <section className={`${styles.oagenciji} ${styles.container}`}>
            <Head>
                <title>Bussnes consulting services | AltroMedia</title>
                <meta name="description" content="Looking to boost your online presence and drive more traffic to your website? 
                Our web consulting services can help. 
                We'll help you achieve your online goals." />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="google-site-verification" content="W-rtCF5w2J8bNo9N3f6zv3ZQgR8lwiN1w0QgnR9tWyQ" />
                <meta name="robots" content="index,follow"></meta>
                <link rel="canonical" href="https://altromedia.com/Copwriting"/>
            </Head>
            <div className={styles.contentBlock}>
                <div className={styles.content}>
                    <h1 className={styles.leftTitle}>Consulting</h1>
                    <p className={styles.paragraph}>
                    You're confused in the modern world. To avoid wasting 
                    time wandering and to ensure a future in the digital age, 
                    let us drive you, identify your issue, 
                    and point your company in the right path.
                    </p>
                    <Link className={`${styles.btn} ${styles.navBtn} ${styles.ContactBtn}`} href={`/#${'contact'}`}>
                       Get in touch
                    </Link>
                </div>
                <Image className={styles.agencyImage} src={Img} alt="A responsive image" />
            </div>
        </section>
        </div>
    )                                  
}

export default Consulting;