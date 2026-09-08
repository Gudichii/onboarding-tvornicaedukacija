import styles from '@/styles/Main.module.scss';

const policy = () => {
    return ( 
        <div>
            <h1 className={styles.title}>Privacy statement</h1>
            <h2 className={styles.title}>Methods and purpose of personal data processing</h2>
            <p className={styles.paragraph}>
                The specific purpose and methods of personal data processing depend 
                greatly on the type of business relationship within which the data are collected.
                AltroMedia protects its associates` privacy and processes personal data fairly, 
                transparently and pursuant to the legal regulations. 
                The processing is limited to those personal data that are necessary 
                for conducting our business activities and the data are used for the 
                purpose for which they were collected, 
                whether they were obtained from the data subjects, 
                by third parties or from publicly available sources 
                (court register, Croatian Financial Agency - FINA). 
                The data are processed for legitimate interests 
                (for conducting court proceedings and keeping records of them, 
                detecting perpetrators of criminal offenses and preventing fraud, 
                protecting persons and property etc.), for complying with contractual 
                obligations (when the processing is necessary for execution of contracts 
                in which the respondent is a contractual party etc.) 
                and legal obligations, etc.
                Security of personal data
            </p>
            <h2 className={styles.title}>Security of personal data</h2>
            <p className={styles.paragraph}>
                Collected personal data are handled with compulsory application of 
                appropriate legal, technical and organizational security measures to 
                prevent any unauthorized processing. 
                AltroMedia continuously educates its employees on the importance of 
                data confidentiality and privacy protection.
            </p>
            <p className={styles.paragraph}>
                Personal data are contained for as long as it may be necessary 
                for the purpose of processing, unless there is a prescribed obligation 
                to contain the personal data for longer periods, or when this is required 
                due to the legitimate interests of AltroMedia (for the purpose of establishing, 
                enforcing or protecting legal requirements etc.).
            </p>
            <p className={styles.paragraph}>
                Access to personal data is granted solely to authorised employees of 
                AltroMedia and its partners, who provide business support to our company 
                (data processors).
            </p>
            <h2 className={styles.title}>Recipients of personal data</h2>
            <p className={styles.paragraph}>a
                AltroMedia undertakes to protect personal data and shall 
                not distribute the data or make them available to third parties 
                without the express consent of the respondent, except to service 
                providers engaged as dana processors, to competent bodies for the 
                purpose of executing tasks within their areas of competence 
                (eg Tax Administration, Ministry of the Interior) and when the 
                submission of data is required by the court, the competent state
                attorney or other bodies in equal legal proceedings and when 
                AltroMedia is legally obliged to transfer such data.
            </p>
            <h2 className={styles.title}>Access to personal data and updates</h2>
            <p className={styles.paragraph}>
                Depending on the legal basis for the processing of your personal
                data, your rights may include the following:
                -right to access your personal data
                -right to be informed on the processing of your personal data (to obtain information on the data categories, purpose of the data processing, recipients of your personal data, storage time etc.)
                -right to data portability
                -right to withdraw your given consent for data processing
                -right to rectification and/or alteration of personal data, should they be incomplete or inaccurate
                -right to erasure of personal data (except in the case of justified reasons for containing the data)
            </p>  
            <p className={styles.paragraph}>
                The right to erasure is not an absolute right and cannot be exercised if the data processing is necessary to comply with the legal obligations of AltroMedia, to establish, exercise or defend legal requirements etc.
                -right to limit the personal data processing (for example when you object against the accuracy of the personal data, until we verify the data accuracy)
                If you wish to exercise one of the aforementioned rights, please contact us by mail at the 
            </p>
            <a href='mailto:karlogudic@gmail.com'>e-mail: altromedia@gmail.com</a> 
        </div>
     );
}
 
export default policy;