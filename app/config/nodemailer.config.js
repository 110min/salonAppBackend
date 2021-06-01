const nodemailer = require("nodemailer");
require('custom-env').env();

var transport = nodemailer.createTransport({
    host: process.env.MT_HOST,
    port: process.env.MT_PORT,
    auth: {
      user: process.env.USER,
      pass: process.env.PASSWORD
    }
  });

  module.exports.sendConfirmationEmail = (name, email, confirmationCode) => {
    console.log("Check");
    transport.sendMail({
        from: process.env.USER,
        to: email,
        subject: "Please confirm your account",
        html: `<h1>Email Confirmation</h1>
          <h2>Hello ${name}</h2>
          <p>Thank you for subscribing. Please confirm your email by clicking on the following link</p>
          <a href=http://localhost:8080/api/auth/confirm/${confirmationCode}> Click here</a>
          </div>`,
    }).catch(err => console.log(err));
};