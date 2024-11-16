import nodemailer from 'nodemailer';

// Configure the transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: 'techeai24@gmail.com', 
    pass: 'ukistu20', 
  },
});

export const sendMail = (from, subject, text) => {
  const mailOptions = {
    to: 'techeai24@gmail.com', 
    from,
    subject,
    text,
  };

  return transporter.sendMail(mailOptions);
};
