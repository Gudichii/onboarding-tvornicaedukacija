import Image from 'next/image';
import Img from '../assets/RoutesImg/optimized.png';
import styles from '@/styles/Main.module.scss'
import Link from 'next/link';
import Head from 'next/head';

const WebsiteVisibility = () => {
    return(
        <div>
        <Head>
                <title>Website visibility | AltroMedia</title>
                <meta name="description" content="Maximize website performance with expert optimization. 
                Boost speed, user experience & SEO. 
                Contact us now." />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="google-site-verification" content="W-rtCF5w2J8bNo9N3f6zv3ZQgR8lwiN1w0QgnR9tWyQ" />
                <meta name="robots" content="index,follow"></meta>
                <link rel="canonical" href="https://altromedia.com/WebsiteVisibility"/>
        </Head>
        <section className={`${styles.oagenciji} ${styles.container}`}>
            <div className={styles.contentBlock}>
                <div className={styles.content}>
                    <h2 className={styles.leftTitle}>Website visibility</h2>
                    <p className={styles.paragraph}>
                        Having the best possible position on Google is essential for any business that wants to succeed in 
                        today's digital age. When potential customers search for products or services 
                        related to your business on Google, they are more likely to click on the websites 
                        that appear at the top of the search results. Additionally, appearing at the top of 
                        the search results can help to build trust and credibility with potential customers, 
                        as it is seen as an indication of your business's authority in your industry.
                    </p>
                    {/* <div className={`${styles.link} ${styles.email}`}><span className={styles.span}>Email:</span><a>seoagncy@gmail.com</a></div> */}
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

export default WebsiteVisibility;