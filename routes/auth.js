const express = require("express");
const passport = require("passport");

const router = express.Router();

// GOOGLE
router.get("/google", (req, res, next) => {
  const rol = req.query.rol || "usuario";

  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: rol,
  })(req, res, next);
});

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login-social",
  }),
  (req, res) => {
    const rol = req.query.state || "usuario";

    if (rol === "checador") return res.redirect("/checador");
    if (rol === "chofer") return res.redirect("/chofer");

    res.redirect("/");
  }
);

// FACEBOOK
router.get("/facebook", (req, res, next) => {
  const rol = req.query.rol || "usuario";

  passport.authenticate("facebook", {
    scope: ["email"],
    state: rol,
  })(req, res, next);
});

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    failureRedirect: "/login-social",
  }),
  (req, res) => {
    const rol = req.query.state || "usuario";

    if (rol === "checador") return res.redirect("/checador");
    if (rol === "chofer") return res.redirect("/chofer");

    res.redirect("/");
  }
);

router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);

    req.session.destroy((sessionErr) => {
      if (sessionErr) return next(sessionErr);

      res.clearCookie("connect.sid");
      res.redirect("/");
    });
  });
});

module.exports = router;