require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const passport = require("passport");

require("./config/passport");

const authRoutes = require("./routes/auth");

const app = express();
const PORT = 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "autorecord_secreto",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.render("frontend/index", {
    user: req.user || null
  });
});

app.get("/login-social", (req, res) => {
  const rol = req.query.rol || "usuario";
  res.render("frontend/login-social", { rol });
});

app.get("/checador", (req, res) => {
  res.render("frontend/checador", {
    user: req.user || null
  });
});

app.get("/chofer", (req, res) => {
  res.render("frontend/chofer", {
    user: req.user || null
  });
});

app.get("/descargas", (req, res) => {
  res.render("frontend/Descargas", {
    user: req.user || null
  });
});

app.get("/funciones", (req, res) => {
  res.render("frontend/Funciones", {
    user: req.user || null
  });
});

app.get("/informacion", (req, res) => {
  res.render("frontend/informacion", {
    user: req.user || null
  });
});

app.get("/nosotros", (req, res) => {
  res.render("frontend/Nosotros", {
    user: req.user || null
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});