import Link from 'next/link';
import styles from '@/styles/Main.module.scss'
import Image from 'next/image';
import buildingWebsites from '../assets/img/buildingWebsites.png';
import websiteOptimization from '../assets/img/websiteoptimization.png';
import rankHigher from '../assets/img/higherGoogleRank.png';
import eCommerceSEO from '../assets/img/eCommerceSEO.png';
import Consulting from '../assets/img/consulting.png';
import Copywrting from '../assets/img/copywriting.png';

const Services = () =>{
    return(
        <section id='services' className={`${styles.services} ${styles.container}`}>
            <div className={styles.serviceTitles}> 
                <h2 className={styles.subtitle1}>Our solutions</h2>
            </div>
            <div className={styles.contentBlock3}>
                <Link className={styles.service} href={'WebsiteBuilding'}>
                    <Image className={styles.img} src={buildingWebsites } alt='Websites building service' />
                    <h3 className={styles.middleTitle}>Building websites</h3>
                </Link>
                <Link className={styles.service} href={'WebsiteOptimization'}>
                    <Image className={styles.img} src={websiteOptimization} alt='Website optimization service'/>
                    <h3 className={styles.middleTitle}>Website optimization</h3>
                </Link>
                <Link className={styles.service} href={'WebsiteVisibility'}>
                    <Image className={styles.img} src={rankHigher} alt='Rank higher on Google' />
                    <h3 className={styles.middleTitle}>Higher Google rank</h3>
                </Link>
                <Link className={styles.service} href={'eCommerce'}>
                    <Image className={styles.img} src={eCommerceSEO} alt='SEO for eCommerceSEO service' />
                    <h3 className={styles.middleTitle}>eCommerce SEO</h3>
                </Link>
                <Link className={styles.service} href={'Copywriting'}>
                    <Image className={styles.img} src={Copywrting} alt='' />
                    <h3 className={styles.middleTitle}>Copywrting</h3>
                </Link>
                <Link className={styles.service} href={'Consulting'}>
                    <Image className={styles.img} src={Consulting} alt='' />
                    <h3 className={styles.middleTitle}>Consulting</h3>
                </Link>
            </div>
        </section>
    )
}

export default Services;