import { Inter } from 'next/font/google';
// import styles from '@/styles/Main.module.scss'
import Head from 'next/head';
import Hero from '@/components/Hero';
import DesigneAndCode from '@/components/DesigneAndCode';
import RankHigher from '@/components/RankHigher';
import Deliver from '@/components/Deliver';
import AboutSEO from '@/components/AboutSEO';
import Services from '@/components/Services';
import Agency from '@/components/Agency';
import How from '@/components/HowWeWork';
import Contact from '@/Navigation/Contact';
import Cookies from '@/Navigation/Cookie';


const inter = Inter({ subsets: ['latin'] });

export default function Home() {
  return (
    <div>
      <Head>
        <title>Your digital future is on the way | AltroMedia</title>
        <meta name="description" content="Make sure that your website exposes you to customers 
        so that they see you as their first option. 
        Digital marketing issues are the focus of the innovators at Altromedia." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="google-site-verification" content="W-rtCF5w2J8bNo9N3f6zv3ZQgR8lwiN1w0QgnR9tWyQ" />
        <meta name="robots" content="index,follow"></meta>
        <link rel="canonical" href="https://altromedia.com/"/>

      </Head>
      <div className='all'>
        <Cookies />
        <Hero/>
        <AboutSEO/>
        <DesigneAndCode />
        <RankHigher />
        <Deliver />
        <Services />
        <Agency />
        <How />
        <Contact />
      </div>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-XLHMBBMQ49"></script>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-XLHMBBMQ49"></script>
        {/* <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments)}
        
        if (typeof dataLayer !== 'undefined') {
          gtag('js', new Date());
          gtag('config', 'G-XLHMBBMQ49');
        }
        </script> */}
    </div>
  )
}
