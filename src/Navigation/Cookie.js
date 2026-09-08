import React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import styles from '@/styles/Main.module.scss'

function Cookies() {
  const [cookiesAccepted, setCookiesAccepted] = useState(false);

  const handleAcceptCookies = () => {
    setCookiesAccepted(true);
    // Ovdje bi mogli postaviti kolačić u preglednik korisnika
    document.cookie = "cookiesAccepted=true; expires=Fri, 31 Dec 9999 23:59:59 GMT";
  };

  return (
    <div>
      {!cookiesAccepted && (
        <div className={styles.cookie}>
            <p>This website uses cookies to improve the user experience. Please accept cookies to ensure the best experience for you.</p>
            <div className={styles.buttons}>
               <button className={`${styles.btn} ${styles.cookyBtn} `} onClick={handleAcceptCookies}>Accept Cookies</button>
                <Link className={` ${styles.policy}`} href={'privacyPolicy'}>Privacy Policy</Link>
            </div>
          </div>
      )}
    </div>
  );s
}

export default Cookies;
