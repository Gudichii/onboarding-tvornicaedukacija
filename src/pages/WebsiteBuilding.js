import Image from 'next/image';
import fastImg from '../assets/RoutesImg/position.png';
import styles from '@/styles/Main.module.scss'
import Link from 'next/link';
import Head from 'next/head';

const WebsiteBuilding = () => {
    return(
        <div>
            <Head>
                <title>Website building services | AltroMedia</title>
                <meta name="description" content="Get a custom-built website that converts visitors into customers. 
                Expert web development services. Contact us now." />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="google-site-verification" content="W-rtCF5w2J8bNo9N3f6zv3ZQgR8lwiN1w0QgnR9tWyQ" />
                <meta name="robots" content="index,follow"></meta>
                <link rel="canonical" href="https://altromedia.com/WebsiteBuilding"/>
            </Head>
            <section className={`${styles.oagenciji} ${styles.container}`}>
                <div className={styles.contentBlock}>
                    <div className={styles.content}>
                        <h2 className={styles.leftTitle}>Website building</h2>
                        <p className={styles.paragraph}>
                        A good and fast website is essential for any business in today's digital age. 
                        A website that loads quickly, is easy to navigate, and provides the necessary 
                        information is crucial for providing a positive user experience. It helps to build trust and credibility 
                        with potential customers, leading to increased conversions and sales. Additionally, 
                        website speed and design are important ranking factors for search engines,
                         making it more likely for your business to be seen by potential customers.
                        </p>
                        <Link className={`${styles.btn} ${styles.navBtn} ${styles.ContactBtn}`} href={`/#${'contact'}`}>
                        Get in touch
                        </Link>
                    </div>
                    <Image className={styles.agencyImage} src={fastImg} alt="A responsive image" />
                </div>
            </section>
        </div>
    )                                  
}

export default WebsiteBuilding;