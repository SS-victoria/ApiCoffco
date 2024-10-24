import { conexion } from "../database/conexion.js";
import { validationResult } from "express-validator";

export const ListarVariables = async (req, res) => {
  try {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json(error);
    }

    let sql = "select * from variables";
    const [respuesta] = await conexion.query(sql);

    if (respuesta.length > 0) {
      res.status(200).json(respuesta);
    } else {
      res.status(404).json({ message: "No hay variables registradas" });
    }
  } catch (error) {
    res.status(500).json({ message: "error en la conexion" + error });
  }
};
export const RegistrarVariables = async (req, res) => {
  try {

    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json(error);
    }

    let { nombre, tipo_dato, UnidadMedida } = req.body;


    const NombreMinusculas = nombre.toLowerCase();

    if (["variedad", "codigoExterno", "altura"].includes(NombreMinusculas)) {
      return res.status(400).json({
        message: "El nombre de la Variable no puede ser variedad, codigoExterno o altura",
      });
    }


    const sqlCheck = 'SELECT * FROM variables WHERE nombre = ?';
    const [existingVariables] = await conexion.query(sqlCheck, [NombreMinusculas]);

    if (existingVariables.length > 0) {
      return res.status(400).json({ message: "El nombre de la Variable ya existe." });
    }


    const sql = `INSERT INTO variables (nombre, tipo_dato, UnidadMedida) VALUES (?, ?, ?)`;
    const [respuesta] = await conexion.query(sql, [
      NombreMinusculas,
      tipo_dato,
      UnidadMedida,
    ]);


    if (respuesta.affectedRows > 0) {
      return res.status(200).json({ message: "Variable registrada exitosamente" });
    }


    return res.status(500).json({ message: "Error al registrar la variable" });

  } catch (error) {

    return res.status(500).json({ message: "Error en el servidor: " + error.message });
  }
};

export const ListarIdVariables = async (req, res) => {
  try {
    let id = req.params.id;

    let sql = `select * from variables where idVariable=?`;
    const [respuesta] = await conexion.query(sql, [id]);
    if (respuesta.length == 1) {
      res.status(200).json(respuesta);
    } else {
      res.status(404).json({ message: "Variable no encontrada" });
    }
  } catch (error) {
    res.status(500).json({ menssage: "Error en el servidor" + error.message });
  }
};

export const ActualizarVariables = async (req, res) => {
  try {
    // Validar los errores de entrada
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json(error);
    }


    let { nombre, tipo_dato, UnidadMedida } = req.body;
    let id = req.params.id;


    const NombreMinusculas = nombre.toLowerCase();


    if (["variedad", "codigoExterno", "altura"].includes(NombreMinusculas)) {
      return res.status(400).json({
        message: "El nombre de la Variable no puede ser variedad, codigoExterno o altura",
      });
    }


    const sqlCheck = 'SELECT * FROM variables WHERE nombre = ? AND idVariable != ?';
    const [existingVariables] = await conexion.query(sqlCheck, [NombreMinusculas, id]);

    if (existingVariables.length > 0) {
      return res.status(400).json({ message: "Ya existe una variable con ese nombre." });
    }


    const sqlUpdate = `UPDATE variables SET nombre = ?, tipo_dato = ?, UnidadMedida = ? WHERE idVariable = ?`;
    const [respuesta] = await conexion.query(sqlUpdate, [
      NombreMinusculas,
      tipo_dato,
      UnidadMedida,
      id,
    ]);


    if (respuesta.affectedRows > 0) {
      return res.status(200).json({ message: "La variable se actualizó con éxito" });
    }


    return res.status(404).json({ message: "No se pudo actualizar la variable, verifique el ID" });

  } catch (error) {

    return res.status(500).json({ message: "Error en el servidor: " + error.message });
  }
};


export const ELiminarVariables = async (req, res) => {
  try {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json(error);
    }
    let id = req.params.id;

    let sql = `delete from variables where idVariable=?`;
    const [respuesta] = await conexion.query(sql, [id]);

    if (respuesta.affectedRows > 0) {
      res.status(200).json({ message: "Variable eliminada correctamente" });
    } else {
      res.status(404).json({ message: "Variable no eliminada correctamente" });
    }
  } catch (error) {
    res.status(500).json({ message: "error en el servidor " + error.message });
  }
};
export const UpdateEstado = async (req, res) => {
  try {
    let id = req.params.id;
    let { estado } = req.body;
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json(error);
    }

    let sql = `update variables set estado=? where idVariable=?`;
    const [respuesta] = await conexion.query(sql, [estado, id]);
    if (respuesta.affectedRows > 0) {
      return res
        .status(200)
        .json({ message: `Se cambio  con éxito el estado a ${estado} ` });
    }
    return res.status(500).json({ message: "dato no encontrado" });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor" + error.message });
  }
};
export const valiribaleActivas =async (req, res) => {
  try {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json(error);
    }

    let sql = `SELECT * FROM variables WHERE estado = 'activo'`;
    const [respuesta] = await conexion.query(sql);
    if (respuesta.length > 0) {
      res.status(200).json(respuesta);
    } else {
      res.status(404).json({ message: "No hay variables activas" });
    }
  } catch (error) {
    res.status(500).json({ message: "error en la conexion" + error });
  }
}