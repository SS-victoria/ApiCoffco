import { conexion } from "../database/conexion.js";
import { validationResult } from "express-validator";

export const listarTipoDocumento = async (req, res) => {
    try {
        const error = validationResult(req);
        if (!error.isEmpty()) {
          return res.status(400).json(error);
        }
        let sql = "SELECT * FROM tipodocumento";
        const [respuesta] = await conexion.query(sql);
        if (respuesta.length > 0) {
            res.status(200).json(respuesta);
        } else {
            res.status(404).json({ "message": "No se pudo listar correctamente" });
        }
    } catch (error) {
        res.status(500).json({ "message": "Error en la conexión: " + error.message });
    }
};

export const registrarTipoDocumento = async (req, res) => {
    /* 	nombreDocumento	TipoDocumento	estado */
    try {
        
        const error = validationResult(req);
        if (!error.isEmpty()) {
            return res.status(400).json(error);
        }

        let { nombreDocumento } = req.body;
        let sql = `INSERT INTO tipodocumento (nombreDocumento) VALUES (?)`;
        const [respuesta] = await conexion.query(sql, [nombreDocumento]);
        if (respuesta.affectedRows > 0) {
            return res.status(200).json({ "message": "El dato se registró correctamente" });
        } else {
            return res.status(404).json({ "message": "El dato no se registró" });
        }
    } catch (error) {
        return res.status(500).json({ "message": "Error al conectar la base de datos: " + error.message });
    }
};

export const actualizarTipoDocumento = async (req, res) => {

    try {
        const error = validationResult(req);
        if (!error.isEmpty()) {
          return res.status(400).json(error);
        }
        let { nombreDocumento } = req.body;
        let id = req.params.id;
        let sql = `UPDATE tipodocumento SET nombreDocumento = ? WHERE idTipoDocumento = ?`;
        const [respuesta] = await conexion.query(sql, [nombreDocumento, id]);

        if (respuesta.affectedRows > 0) {
            return res.status(200).json({ "message": "Se actualizó con éxito el tipo de documento" });
        } else {
            return res.status(404).json({ "message": "No se actualizó el tipo de documento" });
        }
    } catch (error) {
        return res.status(500).json({ "message": "Error en el servidor: " + error.message });
    }
};

export const eliminarTipoDocumento = async (req, res) => {
    try {
        const error = validationResult(req);
        if (!error.isEmpty()) {
          return res.status(400).json(error);
        }
        let id = req.params.id;
        let sql = `DELETE FROM tipodocumento WHERE idTipoDocumento = ?`;
        const [respuesta] = await conexion.query(sql, [id]);
        if (respuesta.affectedRows > 0) {
            res.status(200).json({ "message": "Tipo de documento eliminado correctamente" });
        } else {
            res.status(404).json({ "message": "Tipo de documento no eliminado correctamente" });
        }
    } catch (error) {
        res.status(500).json({ "message": "Error en la conexión: " + error.message });
    }
};

export const listarIdTipoDocumento = async (req, res) => {
    try {
        const error = validationResult(req);
        if (!error.isEmpty()) {
          return res.status(400).json(error);
        }
        let id = req.params.id;
        let sql = `SELECT * FROM tipodocumento WHERE idTipoDocumento = ?`;
        const [respuesta] = await conexion.query(sql, [id]);
        if (respuesta.length === 1) {
            res.status(200).json(respuesta);
        } else {
            res.status(404).json({ "message": "Tipo de documento no encontrado" });
        }
    } catch (error) {
        res.status(500).json({ "message": "Error en la conexión en la base de datos: " + error.message });
    }
};



export const actualizarEstadoTipoDocumento = async (req, res) => {
    try {
        const error = validationResult(req);
        if (!error.isEmpty()) {
          return res.status(400).json(error);
        }
        let { estado } = req.body;
        let id = req.params.id;

        if (!estado || (estado !== 'activo' && estado !== 'inactivo')) {
            return res.status(400).json({ "message": "Estado no válido" });
        }

        let sql = `UPDATE tipodocumento SET estado = ? WHERE idTipoDocumento = ?`;
        const [respuesta] = await conexion.query(sql, [estado, id]);

        if (respuesta.affectedRows > 0) {
            return res.status(200).json({ "message": "Estado del tipo de documento actualizado con éxito" });
        } else {
            return res.status(404).json({ "message": "Tipo de documento no encontrado o no se actualizó" });
        }
    } catch (error) {
        return res.status(500).json({ "message": "Error en el servidor: " + error.message });
    }
};
export const listarActivo = async (req, res) => {

    try {
        const error = validationResult(req);
        if (!error.isEmpty()) {
          return res.status(400).json(error);
        }
        let sql = `SELECT * FROM tipodocumento WHERE estado = 'activo'`;
        const [respuesta] = await conexion.query(sql);
        if (respuesta.length > 0) {
            return res.status(200).json(respuesta);
        }
        return res.status(404).json({ "message": "No se pudo listar correctamente" })
    } catch (error) {
        return res.status(500).json({ "message": "Error en el servidor: " + error.message });
    }
}
