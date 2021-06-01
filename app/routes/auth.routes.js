const { verifySignUp } = require("../middleware");
const controller = require("../controllers/auth.controler");

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    app.post(
        "/api/auth/signup",
        [
            verifySignUp.checkDuplicateUsernameOrEmail,
            verifySignUp.checkRolesExisted,
            // verifySignUp.checkDuplicateTelephone
        ],
        controller.signup
    );

    app.post("/api/auth/signin", controller.signin);
    app.get("/api/auth/confirm/:confirmationCode", controller.verifyUser);
    app.post("/api/auth/confirmotp", controller.verifyUserOTP);

};