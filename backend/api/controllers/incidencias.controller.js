const pool = require("../../config/db");

// GET /api/incidencias
const getIncidencias = async (req, res) => {
  try {
    const [rows] = await pool.query(`
  SELECT * FROM incidencias
  ORDER BY id_incidencia DESC
`);

    res.status(200).json({
      ok: true,
      total: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Error obteniendo incidencias:", error);
    res.status(500).json({
      ok: false,
      message: "Error al obtener incidencias",
    });
  }
};

const updateEstadoIncidencia = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo_incidencia } = req.body;

    if (!tipo_incidencia) {
      return res.status(400).json({
        ok: false,
        message: "Debes enviar tipo_incidencia",
      });
    }

    const [result] = await pool.query(
      `
      UPDATE incidencias
      SET tipo_incidencia = ?
      WHERE id_incidencia = ?
      `,
      [tipo_incidencia, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: "Incidencia no encontrada",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Incidencia actualizada parcialmente",
    });
  } catch (error) {
    console.error("Error en PATCH:", error);
    return res.status(500).json({
      ok: false,
      message: "Error en PATCH",
    });
  }
};

// GET /api/incidencias/:id
const getIncidenciaById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `
      SELECT 
        id_incidencia,
        id_chofer,
        id_ruta,
        tipo_incidencia,
        descripcion,
        ubicacion,
        fecha_reporte
      FROM incidencias
      WHERE id_incidencia = ?
      LIMIT 1
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Incidencia no encontrada",
      });
    }

    res.status(200).json({
      ok: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("Error obteniendo incidencia:", error);
    res.status(500).json({
      ok: false,
      message: "Error al obtener la incidencia",
    });
  }
};

// POST /api/incidencias
const createIncidencia = async (req, res) => {
  try {
    const { id_unidad, tipo_incidencia, descripcion, ubicacion } = req.body;

    if (!id_unidad || !tipo_incidencia || !descripcion) {
      return res.status(400).json({
        ok: false,
        message: "Faltan campos obligatorios",
      });
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
      return res.status(404).json({
        ok: false,
        message: "La unidad no existe",
      });
    }

    const unidad = unidadRows[0];

    if (!unidad.id_chofer) {
      return res.status(400).json({
        ok: false,
        message: "La unidad no tiene chofer asignado",
      });
    }

    const [result] = await pool.query(
      `
      INSERT INTO incidencias
      (id_chofer, id_ruta, tipo_incidencia, descripcion, ubicacion, fecha_reporte)
      VALUES (?, ?, ?, ?, ?, NOW())
      `,
      [
        unidad.id_chofer,
        unidad.id_ruta,
        tipo_incidencia,
        descripcion,
        ubicacion || null,
      ]
    );

    res.status(201).json({
      ok: true,
      message: "Incidencia creada correctamente",
      id_incidencia: result.insertId,
      unidad_relacionada: id_unidad,
      id_chofer: unidad.id_chofer,
      id_ruta: unidad.id_ruta,
    });
  } catch (error) {
    console.error("Error creando incidencia:", error);
    res.status(500).json({
      ok: false,
      message: "Error al crear la incidencia",
    });
  }
};

// PUT /api/incidencias/:id
const updateIncidencia = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_chofer, id_ruta, tipo_incidencia, descripcion, ubicacion } = req.body;

    if (!id_chofer || !id_ruta || !tipo_incidencia || !descripcion) {
      return res.status(400).json({
        ok: false,
        message: "Faltan campos obligatorios para actualizar",
      });
    }

    const [result] = await pool.query(
      `
      UPDATE incidencias
      SET id_chofer = ?, id_ruta = ?, tipo_incidencia = ?, descripcion = ?, ubicacion = ?
      WHERE id_incidencia = ?
      `,
      [id_chofer, id_ruta, tipo_incidencia, descripcion, ubicacion || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: "Incidencia no encontrada",
      });
    }

    res.status(200).json({
      ok: true,
      message: "Incidencia actualizada correctamente",
    });
  } catch (error) {
    console.error("Error actualizando incidencia:", error);
    res.status(500).json({
      ok: false,
      message: "Error al actualizar la incidencia",
    });
  }
};

// DELETE /api/incidencias/:id
const deleteIncidencia = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      `
      DELETE FROM incidencias
      WHERE id_incidencia = ?
      `,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: "Incidencia no encontrada",
      });
    }

    res.status(200).json({
      ok: true,
      message: "Incidencia eliminada correctamente",
    });
  } catch (error) {
    console.error("Error eliminando incidencia:", error);
    res.status(500).json({
      ok: false,
      message: "Error al eliminar la incidencia",
    });
  }
};

module.exports = {
  getIncidencias,
  getIncidenciaById,
  createIncidencia,
  updateIncidencia,
  deleteIncidencia,
  updateEstadoIncidencia,
};