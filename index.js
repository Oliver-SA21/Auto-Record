require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const pool = require("./config/db");

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

// Probar conexión a MySQL
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("Conexión a MySQL exitosa");
    connection.release();
  } catch (error) {
    console.error("Error conectando a MySQL:", error.message);
  }
})();

// LOGIN LOCAL (correo o teléfono)
app.post("/login-local", async (req, res) => {
  try {
    const { correo, telefono, password, rol } = req.body;

    if ((!correo && !telefono) || !password) {
      return res.redirect(`/login-social?rol=${rol || "usuario"}&error=Por favor, completa todos los campos.`);
    }

    let query = `
      SELECT 
        u.id_usuario,
        u.nombre,
        u.correo,
        u.telefono,
        u.password,
        u.id_rol,
        r.nombre_rol,
        u.id_ruta,
        ru.clave_ruta,
        ru.nombre_ruta
      FROM usuarios u
      INNER JOIN roles r ON u.id_rol = r.id_rol
      INNER JOIN rutas ru ON u.id_ruta = ru.id_ruta
      WHERE
    `;

    let params = [];

    if (correo) {
      query += " u.correo = ? ";
      params.push(correo);
    } else {
      query += " u.telefono = ? ";
      params.push(telefono);
    }

    const [rows] = await pool.query(query, params);

    if (rows.length === 0) {
      return res.redirect(`/login-social?rol=${rol || "usuario"}&error=Datos incorrectos`);
    }

    const usuario = rows[0];

    if (usuario.password !== password) {
      return res.redirect(`/login-social?rol=${rol || "usuario"}&error=Datos incorrectos`);
    }

    if (rol && usuario.nombre_rol !== rol) {
      return res.redirect(`/login-social?rol=${rol || "usuario"}&error=Datos incorrectos`);
    }

    req.session.user = {
      id_usuario: usuario.id_usuario,
      nombre: usuario.nombre,
      correo: usuario.correo,
      telefono: usuario.telefono,
      rol: usuario.nombre_rol,
      id_ruta: usuario.id_ruta,
      clave_ruta: usuario.clave_ruta,
      nombre_ruta: usuario.nombre_ruta,
    };

    if (usuario.nombre_rol === "checador") {
      return res.redirect("/checador");
    }

    if (usuario.nombre_rol === "chofer") {
      return res.redirect("/chofer");
    }

    return res.redirect("/");
  } catch (error) {
    console.error("Error en login local:", error);
    return res.redirect(`/login-social?rol=${req.body.rol || "usuario"}&error=Error del servidor`);
  }
});

app.get("/", (req, res) => {
  const user = req.user || req.session.user || null;

  res.render("frontend/index", {
    user,
  });
});

app.get("/login-social", (req, res) => {
  const rol = req.query.rol || "usuario";
  const error = req.query.error || null;

  res.render("frontend/login-social", { rol, error });
});

app.get("/checador", (req, res) => {
  const user = req.user || req.session.user || null;

  res.render("frontend/checador", {
    user,
  });
});

app.get("/chofer", (req, res) => {
  const user = req.user || req.session.user || null;

  res.render("frontend/chofer", {
    user,
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "",
  });
});

app.get("/descargas", (req, res) => {
  const user = req.user || req.session.user || null;

  res.render("frontend/Descargas", {
    user,
  });
});

app.get("/funciones", (req, res) => {
  const user = req.user || req.session.user || null;

  res.render("frontend/Funciones", {
    user,
  });
});

app.get("/informacion", (req, res) => {
  const user = req.user || req.session.user || null;

  res.render("frontend/informacion", {
    user,
  });
});

app.get("/nosotros", (req, res) => {
  const user = req.user || req.session.user || null;

  res.render("frontend/Nosotros", {
    user,
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});