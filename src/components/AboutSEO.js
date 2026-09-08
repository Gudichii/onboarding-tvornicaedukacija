import Image from 'next/image';
import corect from '../assets/img/corect.png';
import websolution from '../assets/img/websolution.png';
import styles from '@/styles/Main.module.scss';

const AboutSEO = () =>{
    return(
        <section id='aboutSEO' className={styles.AboutSEO}>
            <h2 className={styles.subtitle2}>You need a good web solution if:</h2>
            <div className={styles.contentBlock2}>
                <Image className={styles.externImg} src={websolution} alt='You need batter web solution if:' />
                <div className={`${styles.box} ${styles.corect}`}>
                    <ul className={styles.list}>
                        <li className={styles.listElement}>
                            <Image className={styles.img2} src={corect} alt='Trebate SEO ako vam ovo predtsvalja problem'/>
                            <p className={styles.paragraph}>You own a business with the potential for internet revenue.</p>
                        </li>
                        <li className={styles.listElement}>
                            <Image className={styles.img2} src={corect} alt='Trebate SEO ako vam ovo predtsvalja problem'/>
                            <p className={styles.paragraph}>You want to reach your full digital potential.</p>
                        </li>
                        <li className={styles.listElement}>
                            <Image className={styles.img2} src={corect} alt='Trebate SEO ako vam ovo predtsvalja problem'/>
                            <p className={styles.paragraph}>You want your clients to find you effortlessly.</p>
                        </li>
                        <li className={styles.listElement}>
                            <Image className={styles.img2} src={corect} alt='Trebate SEO ako vam ovo predtsvalja problem'/>
                            <p className={styles.paragraph}>You are spending money on ads and don't see clear benefits.</p>
                        </li>
                    </ul>
                </div>
            </div>
        </section>
         
    )
}

export default AboutSEO;