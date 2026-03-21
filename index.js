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

// LOGIN LOCAL
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
      name: usuario.nombre,
      nombre: usuario.nombre,
      correo: usuario.correo,
      telefono: usuario.telefono,
      rol: usuario.nombre_rol,
      id_ruta: usuario.id_ruta,
      clave_ruta: usuario.clave_ruta,
      nombre_ruta: usuario.nombre_ruta,
    };

    req.session.save(() => {
      if (usuario.nombre_rol === "checador") {
        return res.redirect("/checador");
      }

      if (usuario.nombre_rol === "chofer") {
        return res.redirect("/chofer");
      }

      return res.redirect("/");
    });
  } catch (error) {
    console.error("Error en login local:", error);
    return res.redirect(`/login-social?rol=${req.body.rol || "usuario"}&error=Error del servidor`);
  }
});

app.get("/", (req, res) => {
  const user = req.user || req.session.user || null;
  res.render("frontend/index", { user });
});

app.get("/login-social", (req, res) => {
  const rol = req.query.rol || "usuario";
  const error = req.query.error || null;
  res.render("frontend/login-social", { rol, error });
});

app.get("/checador", async (req, res) => {
  try {
    const user = req.user || req.session.user || null;

    if (!user) {
      return res.redirect("/login-social?rol=checador&error=Inicia sesión primero");
    }

    const idRuta = user.id_ruta;

    const [totalUnidadesRows] = await pool.query(
      `
      SELECT COUNT(*) AS total_unidades_ruta
      FROM unidades
      WHERE id_ruta = ?
      `,
      [idRuta]
    );

    const [activasRows] = await pool.query(
      `
      SELECT COUNT(*) AS total_activas
      FROM unidades
      WHERE id_ruta = ?
        AND estado = 'activa'
      `,
      [idRuta]
    );

    const [mantenimientoRows] = await pool.query(
      `
      SELECT COUNT(*) AS total_mantenimiento
      FROM unidades
      WHERE id_ruta = ?
        AND estado = 'mantenimiento'
      `,
      [idRuta]
    );

    const [inactivasRows] = await pool.query(
      `
      SELECT COUNT(*) AS total_inactivas
      FROM unidades
      WHERE id_ruta = ?
        AND estado = 'inactiva'
      `,
      [idRuta]
    );

    const [tablaRows] = await pool.query(
      `
      SELECT 
        u.nombre,
        COALESCE(un.numero_unidad, 'Sin unidad') AS numero_unidad,
        ru.nombre_ruta,
        CASE
          WHEN un.estado = 'activa' THEN 'Activa'
          WHEN un.estado = 'inactiva' THEN 'Inactiva'
          WHEN un.estado = 'mantenimiento' THEN 'Mantenimiento'
          ELSE 'Sin registrar'
        END AS estatus
      FROM usuarios u
      INNER JOIN rutas ru ON u.id_ruta = ru.id_ruta
      LEFT JOIN unidades un ON un.id_chofer = u.id_usuario
      WHERE u.id_rol = 2
        AND u.id_ruta = ?
      ORDER BY u.nombre ASC
      `,
      [idRuta]
    );

    const stats = {
      totalRuta: totalUnidadesRows[0]?.total_unidades_ruta || 0,
      activas: activasRows[0]?.total_activas || 0,
      mantenimiento: mantenimientoRows[0]?.total_mantenimiento || 0,
      inactivas: inactivasRows[0]?.total_inactivas || 0,
    };

    res.render("frontend/checador", {
      user,
      stats,
      choferes: tablaRows || [],
    });
  } catch (error) {
    console.error("Error cargando panel de checador:", error);
    res.status(500).send(`Error al cargar el panel del checador: ${error.message}`);
  }
});

app.get("/chofer", (req, res) => {
  const user = req.user || req.session.user || null;

  res.render("frontend/chofer", {
    user,
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "",
  });
});

app.get("/reporte-vueltas", async (req, res) => {
  try {
    const user = req.user || req.session.user || null;

    if (!user) {
      return res.redirect("/login-social?rol=checador&error=Inicia sesión primero");
    }

    const idRuta = user.id_ruta;
    const choferFiltro = req.query.chofer || "";

    const [reportesRows] = await pool.query(
      `
      SELECT
        ru.nombre_ruta,
        u.nombre AS chofer,
        un.numero_unidad,
        rv.hora_salida,
        rv.hora_llegada,
        rv.ingresos,
        rv.estado_vuelta
      FROM registros_vuelta rv
      INNER JOIN usuarios u ON rv.id_chofer = u.id_usuario
      INNER JOIN unidades un ON rv.id_unidad = un.id_unidad
      INNER JOIN rutas ru ON rv.id_ruta = ru.id_ruta
      WHERE rv.id_ruta = ?
      ORDER BY rv.id_registro DESC
      `,
      [idRuta]
    );

    const [resumenRows] = await pool.query(
      `
      SELECT
        COUNT(*) AS totalVueltas,
        COUNT(DISTINCT rv.id_chofer) AS totalChoferes,
        COALESCE(SUM(rv.ingresos), 0) AS totalIngresos
      FROM registros_vuelta rv
      WHERE rv.id_ruta = ?
      `,
      [idRuta]
    );

    const [choferesFiltroRows] = await pool.query(
      `
      SELECT DISTINCT u.id_usuario, u.nombre
      FROM incidencias i
      INNER JOIN usuarios u ON i.id_chofer = u.id_usuario
      WHERE i.id_ruta = ?
      ORDER BY u.nombre ASC
      `,
      [idRuta]
    );

    let incidenciasQuery = `
      SELECT
        u.nombre AS chofer,
        COALESCE(un.numero_unidad, 'Sin unidad') AS numero_unidad,
        i.tipo_incidencia,
        i.descripcion,
        i.ubicacion,
        i.fecha_reporte
      FROM incidencias i
      INNER JOIN usuarios u ON i.id_chofer = u.id_usuario
      LEFT JOIN unidades un ON un.id_chofer = u.id_usuario
      WHERE i.id_ruta = ?
    `;

    const incidenciasParams = [idRuta];

    if (choferFiltro) {
      incidenciasQuery += ` AND i.id_chofer = ? `;
      incidenciasParams.push(choferFiltro);
    }

    incidenciasQuery += ` ORDER BY u.nombre ASC, i.fecha_reporte DESC `;

    const [incidenciasRows] = await pool.query(incidenciasQuery, incidenciasParams);

    const reportes = (reportesRows || []).map((r) => ({
      ...r,
      hora_salida: r.hora_salida ? String(r.hora_salida).slice(0, 5) : "-",
      hora_llegada: r.hora_llegada ? String(r.hora_llegada).slice(0, 5) : "-",
      estado_vuelta: r.estado_vuelta || "Sin registrar",
      ingresos: Number(r.ingresos || 0).toFixed(2),
    }));

    const incidencias = (incidenciasRows || []).map((i) => ({
      ...i,
      fecha_reporte: i.fecha_reporte
        ? new Date(i.fecha_reporte).toLocaleString("es-MX")
        : "-",
    }));

    const resumen = {
      totalVueltas: resumenRows[0]?.totalVueltas || 0,
      totalChoferes: resumenRows[0]?.totalChoferes || 0,
      totalIngresos: Number(resumenRows[0]?.totalIngresos || 0).toFixed(2),
    };

    const fechaActual = new Date().toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    res.render("frontend/reportes", {
      user,
      reportes,
      incidencias,
      resumen,
      fechaActual,
      choferesFiltro: choferesFiltroRows || [],
      choferFiltro,
    });
  } catch (error) {
    console.error("Error cargando reporte:", error);
    res.status(500).send(`Error cargando reporte: ${error.message}`);
  }
});

app.get("/descargas", (req, res) => {
  const user = req.user || req.session.user || null;
  res.render("frontend/Descargas", { user });
});

app.get("/funciones", (req, res) => {
  const user = req.user || req.session.user || null;
  res.render("frontend/Funciones", { user });
});

app.get("/informacion", (req, res) => {
  const user = req.user || req.session.user || null;
  res.render("frontend/informacion", { user });
});

app.get("/nosotros", (req, res) => {
  const user = req.user || req.session.user || null;
  res.render("frontend/Nosotros", { user });
});

app.get("/reportes", (req, res) => {
  const user = req.user || req.session.user || null;

  res.render("frontend/Reportes", { user });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});