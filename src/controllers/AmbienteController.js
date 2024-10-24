
import { validationResult } from "express-validator";
import { conexion } from "../database/conexion.js";

export const ListarAmbientes = async (req, res) => {
  try {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json(error);
    }
    const sql = "select * from ambiente";
    const [result] = await conexion.query(sql);
    if (result.length > 0) {
      res.status(200).json(result);
    } 
    else {
      res.status(404).json({ menssage: "No hay ambientes registrados" });
    }
  } catch (error) {
    res.status(500).json({ menssage: "Error en la conexion" + error.message });
  }
};
export const ListarAmbientesId = async (req, res) => {
  try {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json(error);
    }
    const id = req.params.id;
    const sql = "select * from ambiente where idAmbiente=?";
    const [result] = await conexion.query(sql, [id]);
    if (result.length > 0) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ menssage: "No hay ambientes registrados" });
    }
  } catch (error) {
    res.status(500).json({ menssage: "Error en la conexion" + error.message });
  }
};

export const CrearAmbiente = async (req, res) => {
  try {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json(error);
    }

      const { nombre_ambiente } = req.body;

      const sql = "INSERT INTO ambiente (nombre_ambiente) VALUES (?)";
      const values = [nombre_ambiente];

      const [result] = await conexion.query(sql, values);

      if (result.affectedRows > 0) {
          res.status(201).json({ menssage: "Ambiente creado correctamente" });
      } else {
          res.status(400).json({ menssage: "Error al crear ambiente" });
      }
  } catch (error) {
      res.status(500).json({ menssage: "Error en la conexion: " + error.message });
  }
};
export const ActualizarAmbiente = async (req, res) => {
  try {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json(error);
    }
    let { nombre_ambiente, estado } = req.body;
    let id = req.params.id;
    let sql ="UPDATE ambiente SET nombre_ambiente =? ,estado=? WHERE idAmbiente =?";
    const [result] = await conexion.query(sql, [nombre_ambiente, estado, id]);
    if (result.affectedRows > 0) {
      res.status(200).json({ menssage: "Ambiente actualizado correctamente" });
    } else {
      res.status(404).json({ menssage: "Ambiente no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ menssage: "Error en la conexion" + error.message });
  }
};

export const EliminarAmbiente = async (req, res) => {
  try {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json(error);
    }
    const id = req.params.id;
    const sql = "DELETE FROM ambiente WHERE idAmbiente =?";
    const [result] = await conexion.query(sql, [id]);
    if (result.affectedRows > 0) {
      res.status(200).json({ menssage: "Ambiente eliminado correctamente" });
    } else {
      res.status(404).json({ menssage: "Ambiente no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ menssage: "Error en la conexion" + error.message });
  }
};
