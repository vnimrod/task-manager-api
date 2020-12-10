const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY); //we have access to that evniroment variable from our config/dev.env that we have created, we do it to hide the key when deploy the app

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: "nimrod.weins@gmail.com",
    subject: "Welcome to task manager",
    text: `Welcome to the app ${name}. Let me know how you get along with the app.`,
    // html: (we can use html for sending the email)
  });
};

const sendCanelationEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: "nimrod.weins@gmail.com",
    subject: "Your account has been canceld",
    text:  `${name} please proive reason for your cancelation`,
  });
};
module.exports = {
  sendWelcomeEmail,
  sendCanelationEmail
};
