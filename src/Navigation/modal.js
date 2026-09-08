import { useEffect } from 'react';
import Image from 'next/image';
import styles from '@/styles/Main.module.scss';
import corect from '../assets/img/corect.png'

const Modal = ({ closeModal }) => {
    useEffect(() => {
      const timer = setTimeout(() => {
        closeModal();
      }, 3000);
  
      return () => clearTimeout(timer);
    }, [closeModal]);
  
    return (
        <div className={styles.modal}>
            <Image src={corect} className={styles.modalContent} alt={'approve that image is sent.'} />
            <p className={styles.modalText}>Email sent successfully!</p>
        </div>
    );
  };
export default Modal;
  
  
  
  
  
  