const Nexmo = require("nexmo");

const nexmo = new Nexmo({
    apiKey: process.env.API_KEY,
    apiSecret: process.env.API_SECRET
});

module.exports.sendVerificationSMS = (telephone, pin) => {
    const from = "Vonage APIs"
    const to = telephone
    const text = 'A text message sent using the Vonage SMS API. Your verification code is ' + pin

    nexmo.message.sendSms(from, to, text, (err, responseData) => {
        if (err) {
            console.log(err);
        } else {
            if (responseData.messages[0]['status'] === "0") {
                console.log("Message sent successfully.");
            } else {
                console.log(`Message failed with error: ${responseData.messages[0]['error-text']}`);
            }
        }
    });
}