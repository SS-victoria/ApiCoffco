import { validationResult } from "express-validator";
import { conexion } from "../database/conexion.js";

export const listarRol = async (req, res) => {  // Cambiado res, req a req, res
    try {
        let sql = "SELECT * FROM rol";
        const [result] = await conexion.query(sql);
        if (result.length > 0) {  // Cambiado affectedRows a length
            return res.status(200).json( result );  // Cambiado res a result
        }
        return res.status(401).json({ message: "No se listaron roles correctamente" });

    } catch (error) {
        return res.status(500).json({ message: "Error", error: error.message });
    }
};

export const registrarRol = async (req, res) => {
    try {
        const error = validationResult(req);
        if (!error.isEmpty()) {
          return res.status(400).json(error);
        }
        const { rol } = req.body;
        let sql = `INSERT INTO rol (rol) VALUES (?)`;
        const [result] = await conexion.query(sql, [rol]);
        if (result.affectedRows > 0) {
            return res.status(200).json({ message: "Rol registrado correctamente" });
        }
        return res.status(401).json({ message: "No se pudo registrar el rol" });

    } catch (error) {
        return res.status(500).json({ message: "Error", error: error.message });
    }
};

export const actualizarRol = async (req, res) => {
    try {
        const { rol } = req.body;
        const id = req.params.idRol;
        let sql = `UPDATE rol SET rol=? WHERE idRol=?`;
        const [result] = await conexion.query(sql, [rol, id]);
        if (result.affectedRows > 0) {
            return res.status(200).json({ message: "Rol actualizado correctamente" });
        }
        return res.status(401).json({ message: "No se pudo actualizar el rol" });

    } catch (error) {
        return res.status(500).json({ message: "Error", error: error.message });
    }
};

export const eliminarRol = async (req, res) => {
    try {
        const id = req.params.idRol;
        let sql = `DELETE FROM rol WHERE idRol=?`;
        const [result] = await conexion.query(sql, [id]);
        if (result.affectedRows > 0) {
            return res.status(200).json({ message: "Rol eliminado correctamente" });
        }
        return res.status(401).json({ message: "No se pudo eliminar el rol" });

    } catch (error) {
        return res.status(500).json({ message: "Error", error: error.message });
    }
};

export const buscarRolPorId = async (req, res) => {
    try {
        const id = req.params.idRol;
        let sql = `SELECT * FROM rol WHERE idRol=?`;
        const [result] = await conexion.query(sql, [id]);
        if (result.length > 0) {
            return res.status(200).json({ message: "Rol encontrado correctamente", data: result[0] });  // Cambiado res a result[0]
        }
        return res.status(401).json({ message: "No se pudo encontrar el rol" });

    } catch (error) {
        return res.status(500).json({ message: "Error", error: error.message });
    }
};
