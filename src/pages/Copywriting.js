import Image from 'next/image';
import Img from '../assets/RoutesImg/copywriting.png';
import styles from '@/styles/Main.module.scss'
import Link from 'next/link';
import Head from 'next/head';

const Copywriting = () => {
    return(
        <div>
        <Head>
                <title>Copywriting services | AltroMedia</title>
                <meta name="description" content="Boost conversions with persuasive copy. 
                Expert copywriting services for web, email, and more. Contact us now. 
                We'll help you achieve your online goals." />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="google-site-verification" content="W-rtCF5w2J8bNo9N3f6zv3ZQgR8lwiN1w0QgnR9tWyQ" />
                <meta name="robots" content="index,follow"></meta>
                <link rel="canonical" href="https://altromedia.com/Consulting"/>
            </Head>
        <section className={`${styles.oagenciji} ${styles.container}`}>
            <div className={styles.contentBlock}>
                <div className={styles.content}>
                    <h1 className={styles.leftTitle}>Copywriting</h1>
                    <p className={styles.paragraph}>
                    Professional copywriting ensures that a business's marketing materials, 
                    website content, and advertising copy effectively communicate their message 
                    and resonate with their target audience, resulting in a higher return on investment. 
                    By investing in copywriting, businesses can elevate their brand and reach their full potential.
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

export default Copywriting;