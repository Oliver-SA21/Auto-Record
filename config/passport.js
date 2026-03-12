const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;


// Guardar usuario en sesión
passport.serializeUser((user, done) => {
  done(null, user);
});

// Recuperar usuario de sesión
passport.deserializeUser((user, done) => {
  done(null, user);
});


// ========================
// GOOGLE AUTH
// ========================
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      const user = {
        id: profile.id,
        name: profile.displayName,
        email: profile.emails?.[0]?.value,
        photo: profile.photos?.[0]?.value,
      };

      return done(null, user);
    }
  )
);


// ========================
// FACEBOOK AUTH
// ========================
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: "http://localhost:3000/auth/facebook/callback",
      profileFields: ["id", "displayName", "emails", "photos"]
    },

    (accessToken, refreshToken, profile, done) => {

      const user = {
        id: profile.id,
        name: profile.displayName,
        email: profile.emails?.[0]?.value,
        photo: profile.photos?.[0]?.value
      };

      return done(null, user);
    }
  )
);