
import styles from '@/styles/Main.module.scss'

const How = () => {
    return ( 
        <section id='howwework' className={`${styles.HowContainer} ${styles.container}`}>
            <h2 className={styles.leftTitle}>How we work</h2>
            <div className={styles.contentBlock4}>
                <div className={`${styles.block} ${styles.yellowBlock}`}>
                    <div className={styles.blockTitle}>
                        <span className={styles.spanNumber}>01</span>
                        <h3 className={styles.Howtitle}>
                        Assesment 
                        </h3>
                    </div>
                    <p className={styles.paragraph}>
                    Effective solutions begin with an assessment of the current state. 
                    On the 1st meeting, 
                    we focus on learning more about you and 
                    identifying room for improvement..
                    </p>
                </div>
                <div className={`${styles.block} ${styles.greenBlock}`}>
                    <div className={styles.blockTitle}>
                        <span className={styles.spanNumber}>02</span>
                        <h3 className={styles.Howtitle}>
                            Custom solutions
                        </h3>
                    </div>
                    <p className={styles.paragraph}>
                    We understand that every client is unique, 
                    with their set of challenges, 
                    so we take a customized approach to problem-solving
                    </p>
                </div>
            </div>
        </section>
     );
}
 
export default How;