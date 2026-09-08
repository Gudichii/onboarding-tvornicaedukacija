import styles from '@/styles/Main.module.scss';
import Link from 'next/link';


const NavBar = () => {
    return ( 
        <Link className={styles.nav} href={'/'}>
          <p className={`${styles.logoText}`}>AltroMedia</p>
        </Link>
     );
}
 
export default NavBar;