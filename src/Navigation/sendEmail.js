import emailjs from 'emailjs-com';

export default function sendEmail(req, res) {
  const { name, email, message } = req.body;

  // Send the email using EmailJS
  emailjs
    .send('service_fc4rc4e', 'template_pw3g4hr', { name, email, message }, '6WDCNgjCa_PhFJtB-')
    .then(() => {
      res.status(200).json({ success: true });
    })
    .catch(() => {
      res.status(500).json({ success: false });
    });
}