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

// Rutas para checador
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
      ORDER BY CAST(SUBSTRING_INDEX(u.nombre, '-', -1) AS UNSIGNED) ASC
      `,
      [idRuta]
    );

    // NUEVO: unidades para el formulario
    const [unidadesFormularioRows] = await pool.query(
      `
      SELECT id_unidad, numero_unidad, estado, id_chofer
      FROM unidades
      WHERE id_ruta = ?
      ORDER BY numero_unidad ASC
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
      unidadesFormulario: unidadesFormularioRows || [],
      success: req.query.success || null,
      error: req.query.error || null,
    });
  } catch (error) {
    console.error("Error cargando panel de checador:", error);
    res.status(500).send(`Error al cargar el panel del checador: ${error.message}`);
  }
});

// GUARDAR REGISTRO DE VUELTA
app.post("/guardar-vuelta", async (req, res) => {
  try {
    const user = req.user || req.session.user || null;

    if (!user) {
      return res.redirect("/login-social?rol=checador&error=Inicia sesión primero");
    }

    const { id_unidad, hora_salida, hora_llegada, ingresos } = req.body;

    if (!id_unidad || !hora_salida || !hora_llegada || !ingresos) {
      return res.redirect("/checador?error=Completa todos los campos del registro");
    }

    const ingresoNumero = parseFloat(ingresos);

    if (isNaN(ingresoNumero) || ingresoNumero < 0) {
      return res.redirect("/checador?error=El ingreso no es válido");
    }

    const [unidadRows] = await pool.query(
      `
      SELECT id_unidad, id_chofer, id_ruta
      FROM unidades
      WHERE id_unidad = ?
      LIMIT 1
      `,
      [id_unidad]
    );

    if (unidadRows.length === 0) {
      return res.redirect("/checador?error=La unidad seleccionada no existe");
    }

    const unidad = unidadRows[0];

    if (!unidad.id_chofer) {
      return res.redirect("/checador?error=La unidad no tiene chofer asignado");
    }

    if (String(unidad.id_ruta) !== String(user.id_ruta)) {
      return res.redirect("/checador?error=La unidad no pertenece a tu ruta");
    }

    await pool.query(
      `
      INSERT INTO registros_vuelta
      (id_unidad, id_chofer, hora_salida, hora_llegada, ingresos, fecha_registro)
      VALUES (?, ?, ?, ?, ?, CURDATE())
      `,
      [unidad.id_unidad, unidad.id_chofer, hora_salida, hora_llegada, ingresoNumero]
    );

    return res.redirect("/checador?success=Registro guardado correctamente");
  } catch (error) {
    console.error("Error guardando vuelta:", error);
    return res.redirect("/checador?error=No se pudo guardar el registro");
  }
});

// CHOFER
app.get("/chofer", async (req, res) => {
  try {
    const user = req.user || req.session.user || null;

    if (!user) {
      return res.redirect("/login-social?rol=chofer&error=Inicia sesión primero");
    }

    const fechaFiltro = req.query.fecha || "";

    const [rutaRows] = await pool.query(
      `
      SELECT
        r.nombre_ruta,
        r.horario_inicio,
        r.horario_fin,
        r.paradas_principales,
        COALESCE(un.estado, 'sin registrar') AS estado_unidad,
        COALESCE(un.numero_unidad, 'Sin unidad') AS numero_unidad
      FROM usuarios u
      INNER JOIN rutas r ON u.id_ruta = r.id_ruta
      LEFT JOIN unidades un ON un.id_chofer = u.id_usuario
      WHERE u.id_usuario = ?
      LIMIT 1
      `,
      [user.id_usuario]
    );

    const rutaInfo = rutaRows[0]
      ? {
          ...rutaRows[0],
          horario_inicio: rutaRows[0].horario_inicio
            ? String(rutaRows[0].horario_inicio).slice(0, 5)
            : "--:--",
          horario_fin: rutaRows[0].horario_fin
            ? String(rutaRows[0].horario_fin).slice(0, 5)
            : "--:--",
          estado_label:
            rutaRows[0].estado_unidad === "activa"
              ? "En servicio"
              : rutaRows[0].estado_unidad === "mantenimiento"
              ? "Mantenimiento"
              : rutaRows[0].estado_unidad === "inactiva"
              ? "Inactiva"
              : "Sin registrar",
        }
      : {
          nombre_ruta: "Sin ruta",
          horario_inicio: "--:--",
          horario_fin: "--:--",
          paradas_principales: "Sin información",
          estado_unidad: "sin registrar",
          estado_label: "Sin registrar",
          numero_unidad: "Sin unidad",
        };

    let vueltasQuery = `
      SELECT
        rv.fecha_registro,
        rv.hora_salida,
        rv.hora_llegada,
        rv.ingresos
      FROM registros_vuelta rv
      WHERE rv.id_chofer = ?
    `;

    const vueltasParams = [user.id_usuario];

    if (fechaFiltro) {
      vueltasQuery += ` AND rv.fecha_registro = ? `;
      vueltasParams.push(fechaFiltro);
    }

    vueltasQuery += `
      ORDER BY rv.fecha_registro DESC, rv.id_registro DESC
    `;

    const [vueltasRows] = await pool.query(vueltasQuery, vueltasParams);

    const vueltas = (vueltasRows || []).map((v) => ({
      ...v,
      fecha_registro: v.fecha_registro
        ? new Date(v.fecha_registro).toLocaleDateString("es-MX")
        : "-",
      hora_salida: v.hora_salida ? String(v.hora_salida).slice(0, 5) : "-",
      hora_llegada: v.hora_llegada ? String(v.hora_llegada).slice(0, 5) : "-",
      ingresos: Number(v.ingresos || 0).toFixed(2),
    }));

    res.render("frontend/chofer", {
      user,
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "",
      vueltas,
      fechaFiltro,
      rutaInfo,
      success: req.query.success || null,
      error: req.query.error || null,
    });
  } catch (error) {
    console.error("Error cargando panel de chofer:", error);
    res.status(500).send(`Error al cargar el panel del chofer: ${error.message}`);
  }
});

// REPORTES
app.get("/reportes", async (req, res) => {
  try {
    const user = req.user || req.session.user || null;

    if (!user) {
      return res.redirect("/login-social?rol=checador&error=Inicia sesión primero");
    }

    const idRuta = user.id_ruta;

    const [choferesFiltroRows] = await pool.query(
      `
      SELECT u.id_usuario, u.nombre
      FROM usuarios u
      WHERE u.id_ruta = ?
        AND u.id_rol = 2
      ORDER BY CAST(SUBSTRING_INDEX(u.nombre, '-', -1) AS UNSIGNED) ASC
      `,
      [idRuta]
    );

    let choferIncidencia = req.query.choferIncidencia || "";
    let choferVuelta = req.query.choferVuelta || "";
    let fechaVuelta = req.query.fechaVuelta || "";

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

    if (choferIncidencia) {
      incidenciasQuery += ` AND i.id_chofer = ? `;
      incidenciasParams.push(choferIncidencia);
    }

    incidenciasQuery += `
      ORDER BY 
        CAST(SUBSTRING_INDEX(u.nombre, '-', -1) AS UNSIGNED) ASC,
        i.fecha_reporte DESC
    `;

    const [incidenciasRows] = await pool.query(incidenciasQuery, incidenciasParams);

    const incidencias = (incidenciasRows || []).map((i) => ({
      ...i,
      fecha_reporte: i.fecha_reporte
        ? new Date(i.fecha_reporte).toLocaleString("es-MX")
        : "-",
    }));

    let vueltasQuery = `
      SELECT
        u.nombre AS chofer,
        COALESCE(un.numero_unidad, 'Sin unidad') AS numero_unidad,
        rv.hora_salida,
        rv.hora_llegada,
        rv.ingresos,
        rv.fecha_registro
      FROM registros_vuelta rv
      INNER JOIN usuarios u ON rv.id_chofer = u.id_usuario
      LEFT JOIN unidades un ON rv.id_unidad = un.id_unidad
      WHERE u.id_ruta = ?
    `;

    const vueltasParams = [idRuta];

    if (choferVuelta) {
      vueltasQuery += ` AND rv.id_chofer = ? `;
      vueltasParams.push(choferVuelta);
    }

    if (fechaVuelta) {
      vueltasQuery += ` AND rv.fecha_registro = ? `;
      vueltasParams.push(fechaVuelta);
    }

    vueltasQuery += `
      ORDER BY rv.fecha_registro DESC, rv.id_registro DESC
    `;

    const [vueltasRows] = await pool.query(vueltasQuery, vueltasParams);

    const vueltas = (vueltasRows || []).map((v) => ({
      ...v,
      hora_salida: v.hora_salida ? String(v.hora_salida).slice(0, 5) : "-",
      hora_llegada: v.hora_llegada ? String(v.hora_llegada).slice(0, 5) : "-",
      fecha_registro: v.fecha_registro || "-",
      ingresos: Number(v.ingresos || 0).toFixed(2),
    }));

    res.render("frontend/Reportes", {
      user,
      choferesFiltro: choferesFiltroRows || [],
      choferIncidencia,
      choferVuelta,
      fechaVuelta,
      incidencias,
      vueltas,
    });
  } catch (error) {
    console.error("Error cargando reportes:", error);
    res.status(500).send(`Error cargando reportes: ${error.message}`);
  }
});

// GUARDAR INCIDENCIA
app.post("/guardar-incidencia", async (req, res) => {
  try {
    const user = req.user || req.session.user || null;

    if (!user) {
      return res.redirect("/login-social?rol=chofer&error=Inicia sesión primero");
    }

    const { tipo_incidencia, descripcion, ubicacion } = req.body;

    if (!tipo_incidencia || !descripcion) {
      return res.redirect("/chofer?error=Completa los campos obligatorios de la incidencia");
    }

    await pool.query(
      `
      INSERT INTO incidencias
      (id_chofer, id_ruta, tipo_incidencia, descripcion, ubicacion, fecha_reporte)
      VALUES (?, ?, ?, ?, ?, NOW())
      `,
      [user.id_usuario, user.id_ruta, tipo_incidencia, descripcion, ubicacion || null]
    );

    return res.redirect("/chofer?success=Incidencia registrada correctamente");
  } catch (error) {
    console.error("Error guardando incidencia:", error);
    return res.redirect("/chofer?error=No se pudo guardar la incidencia");
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

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});