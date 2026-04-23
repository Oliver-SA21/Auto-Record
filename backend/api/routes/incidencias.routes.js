const express = require("express");
const router = express.Router();

const {
  getIncidencias,
  getIncidenciaById,
  createIncidencia,
  updateIncidencia,
  deleteIncidencia,
  updateEstadoIncidencia,
} = require("../controllers/incidencias.controller");

router.get("/", getIncidencias);
router.get("/:id", getIncidenciaById);
router.post("/", createIncidencia);
router.put("/:id", updateIncidencia);
router.delete("/:id", deleteIncidencia);
router.patch("/:id", updateEstadoIncidencia);

module.exports = router;