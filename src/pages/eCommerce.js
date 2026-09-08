import Image from 'next/image';
import Img from '../assets/RoutesImg/branding.png';
import styles from '@/styles/Main.module.scss'
import Link from 'next/link';
import Head from 'next/head';

const eCommerce = () => {
    return(
        <>
        <Head>
            <title>eCommerce SEO | AltroMedia</title>
            <meta name="description" content="Don't let your competitors outrank you – partner with us today to take your eCommerce 
            business to the next level with our expert SEO services." />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <meta name="google-site-verification" content="W-rtCF5w2J8bNo9N3f6zv3ZQgR8lwiN1w0QgnR9tWyQ" />
            <meta name="robots" content="index,follow"></meta>
            <link rel="canonical" href="https://altromedia.com/eCommerce"/>

        </Head>
        <section className={`${styles.oagenciji} ${styles.container}`}>
            {/* <NavBar/> */}
            <div className={styles.contentBlock}>
                <div className={styles.content}>
                    <h1 className={styles.leftTitle}>eCommerc SEO</h1>
                    <p className={styles.paragraph}>
                    Setting up SEO optimization in your online store will result in increased traffic, 
                    reduced cost of clicks for advertising, and a variety of other positive factors. 
                    To summarize,SEO is the foundation of any serious eCommerce business; 
                    it will increase your ROI and thus your conversion rate.
                    </p>
                    {/* <div className={`${styles.link} ${styles.email}`}><span className={styles.span}>Email:</span><a>seoagncy@gmail.com</a></div> */}
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

export default eCommerce;