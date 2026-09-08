import Image from 'next/image';
import Img from '../assets/RoutesImg/fast.png';
import styles from '@/styles/Main.module.scss'
import Link from 'next/link';
import Head from 'next/head';


const WebsiteOptimization = () => {
    return(
        <>
        <Head>
                <title>Website optimization services | AltroMedia</title>
                <meta name="description" content="Improve your website's visibility and reach your target audience. 
                Expert SEO & marketing services. Contact us now." />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="google-site-verification" content="W-rtCF5w2J8bNo9N3f6zv3ZQgR8lwiN1w0QgnR9tWyQ" />
                <meta name="robots" content="index,follow"></meta>
                <link rel="canonical" href="https://altromedia.com/WebsiteOptimization"/>
        </Head>
        <section className={`${styles.oagenciji} ${styles.container}`}>
            <div className={styles.contentBlock}>
                <div className={styles.content}>
                    <h1 className={styles.leftTitle}>Website optimization</h1>
                    <p className={styles.paragraph}>
                    A well-optimized website helps to attract and retain potential customers, 
                    leading to increased traffic and sales. By optimizing your website, you can 
                    improve its speed, user experience, and position on google. A fast and 
                    well-designed website is important for providing a positive user experience, 
                    which can lead to increased trust and credibility with potential customers.
                    </p>
                    <Link className={`${styles.btn} ${styles.navBtn} ${styles.ContactBtn}`} href={`/#${'contact'}`}>
                       Get in touch
                    </Link>
                </div>
                <Image className={styles.agencyImage} src={Img} alt="A responsive image" />
            </div>
        </section>
        </>
    )                                  
}

export default WebsiteOptimization;