require('custom-env').env();
const db = require("../models");
const nodemailer = require("../config/nodemailer.config");
const nexmo = require("../config/nexmo.config");
const User = db.user;
const Role = db.role;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

exports.signup = (req, res) => {
    const token = jwt.sign({ email: req.body.email }, process.env.SECRET)

    const characters = '0123456789';
    let pinNo = '';
    for (let i = 0; i < 5; i++) {
        pinNo += characters[Math.floor(Math.random() * characters.length)];
    }

    const user = new User({
        username: req.body.username,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 8),
        confirmationCode: token,
        // telephone: req.body.telephone,
        telephone: process.env.TEL_NO,
        otp: pinNo,
    });

    user.save((err, user) => {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }

        if (req.body.roles) {
            Role.find(
                {
                    name: { $in: req.body.roles }
                },
                (err, roles) => {
                    if (err) {
                        res.status(500).send({ message: err });
                        return;
                    }

                    user.roles = roles.map(role => role._id);
                    user.save(err => {
                        if (err) {
                            res.status(500).send({ message: err });
                            return;
                        }
                    });
                    nodemailer.sendConfirmationEmail(
                        user.username,
                        user.email,
                        user.confirmationCode
                    );

                    nexmo.sendVerificationSMS(user.telephone, user.otp);
                    res.send({ message: "User was registered successfully!" });
                }
            );
        } else {
            Role.findOne({ name: "user" }, (err, role) => {
                if (err) {
                    res.status(500).send({ message: err });
                    return;
                }

                user.roles = [role._id];
                user.save(err => {
                    if (err) {
                        res.status(500).send({ message: err });
                        return;
                    }

                });
                nodemailer.sendConfirmationEmail(
                    user.username,
                    user.email,
                    user.confirmationCode
                );
                nexmo.sendVerificationSMS(user.telephone, user.otp);
                res.send({ message: "User was registered successfully!" });
            });
        }
    });
};

exports.signin = (req, res) => {
    User.findOne({
        username: req.body.username
    })
        .populate("roles", "-__v")
        .exec((err, user) => {
            if (user.status != "Active") {
                return res.status(401).send({
                    message: "Pending Account. Please Verify Your Email!",
                });
            }
            if (err) {
                res.status(500).send({ message: err });
                return;
            }

            if (!user) {
                return res.status(404).send({ message: "User Not found." });
            }

            var passwordIsValid = bcrypt.compareSync(
                req.body.password,
                user.password
            );

            if (!passwordIsValid) {
                return res.status(401).send({
                    accessToken: null,
                    message: "Invalid Password!"
                });
            }

            var token = jwt.sign({ id: user.id }, process.env.SECRET, {
                expiresIn: 86400 // 24 hours
            });

            var authorities = [];

            for (let i = 0; i < user.roles.length; i++) {
                authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
            }
            res.status(200).send({
                id: user._id,
                username: user.username,
                email: user.email,
                roles: authorities,
                accessToken: token
            });
        });
};

exports.verifyUser = (req, res) => {
    User.findOne({
        confirmationCode: req.params.confirmationCode
    })
        .then((user) => {
            if (!user) {
                return res.status(404).send({ message: "User Not found." });
            }

            user.statusEmail = "Active";
            user.save((err) => {
                if (err) {
                    res.status(500).send({ message: err });
                    return;
                }
            });
            return res.status(200).send({ message: "Verify user by confirmation mail" });
        })
        .catch((e) => console.log("error", e));
};

exports.verifyUserOTP = (req, res) => {
    User.findOne({
        // telephone: req.body.telephone
        username: req.body.username
    })
        .then((user) => {
            if (!user) {
                return res.status(404).send({ message: "User Not found." });
            }
            const pin = req.body.pin;
            if(pin === user.otp){
                user.statusSMS = "Active";
                user.save((err) => {
                    if (err) {
                        res.status(500).send({ message: err });
                        return;
                    }
                });
                return res.status(200).send({ message: "Verified user by OTP" });
            }else{
                return res.status(500).send({message: "Please check again the OTP"});
            }
        })
        .catch((e) => console.log("error", e));
}