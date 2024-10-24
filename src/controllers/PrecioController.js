import { conexion } from "../database/conexion.js";
import { validationResult } from "express-validator";

// Listar todos los precios
export const listarPrecios = async (req, res) => {
  try {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json(error);
    }
    let sql = `SELECT
      p.idPrecio,
      p.estado_precio,
      p.presentacion,
      p.UnidadMedida,
      p.precio,
      t.nombreServicio
    FROM
      precio p
    JOIN
      tiposervicio t ON p.fk_idTipoServicio = t.idTipoServicio;`;

    const [result] = await conexion.query(sql);

    if (result.length > 0) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ message: "No se encontraron precios en la base de datos" });
    }
  } catch (err) {
    res.status(500).json({
      message: "Error en el controlador PrecioController.js: " + err.message,
    });
  }
};


// Registrar un nuevo precio
export const registrarPrecio = async (req, res) => {
  try {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json(error);
    }
    // Validar los datos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(errors.array());
    }

    // Obtener los datos del cuerpo de la solicitud
    const { presentacion, precio, fk_idTipoServicio, unidaMedida } = req.body;

    // Consulta SQL para insertar el nuevo precio
    const sql = `INSERT INTO precio ( presentacion, precio, fk_idTipoServicio,UnidadMedida)
                 VALUES (?, ?, ?,?)`;

    // Ejecutar la consulta
    const [result] = await conexion.query(sql, [
      presentacion,
      precio,
      fk_idTipoServicio,
      unidaMedida
    ]);

    // Verificar el resultado de la consulta
    if (result.affectedRows > 0) {
      return res.status(200).json({ message: "Se registró con éxito el precio" });
    } else {
      return res.status(404).json({ message: "No se registró el precio." });
    }
  } catch (e) {
    return res.status(500).json({ message: "Error: " + e.message });
  }
};

// Eliminar un precio
export const eliminarPrecio = async (req, res) => {
  try {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json(error);
    }
    let idPrecio = req.params.idPrecio;

    let sql = `DELETE FROM precio WHERE idPrecio = ?`;
    const [result] = await conexion.query(sql, [idPrecio]);

    if (result.affectedRows > 0) {
      return res
        .status(200)
        .json({ message: "Se eliminó con éxito el precio" });
    } else {
      return res.status(404).json({ message: "No se eliminó el precio" });
    }
  } catch (e) {
    return res.status(500).json({ message: "Error: " + e.message });
  }
};

// Actualizar un precio
export const actualizarPrecio = async (req, res) => {
  try {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json(error);
    }
    let idPrecio = req.params.idPrecio;
    let { presentacion, precio, fk_idTipoServicio } = req.body;

    let sql = `UPDATE precio SET presentacion = ?, precio = ?, fk_idTipoServicio = ? WHERE idPrecio = ?`;
    let values = [
      presentacion,
      precio,
      fk_idTipoServicio,
      idPrecio,
    ];

    const [result] = await conexion.query(sql, values);

    if (result.affectedRows > 0) {
      return res
        .status(200)
        .json({ message: "Se actualizó con éxito el precio" });
    } else {
      return res.status(404).json({ message: "No se actualizó el precio" });
    }
  } catch (e) {
    return res.status(500).json({ message: "Error: " + e.message });
  }
};

export const actualizarEstado = async (req, res) => {
  try {
    let { estado_precio } = req.body
    let idPrecio = req.params.idPrecio;
    let sql = `update precio set estado_precio=? where idPrecio=?`
    const [respuesta] = await conexion.query(sql, [estado_precio, idPrecio])
    if (respuesta.affectedRows > 0) {
      res.status(200).json({ message: 'Estado Actualizado correctamente' })
    } else {
      res.status(404).json({ message: 'Estado no actualizado' })
    }
  } catch (error) {
    res.status(500).json({ message: 'Error en la conexion' + error.message })
  }
}

// Listar precio por ID
export const ListaridPrecio = async (req, res) => {
  try {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json(error);
    }
    let idPrecio = req.params.idPrecio;

    let sql = `SELECT * FROM precio WHERE idPrecio = ?`;
    const [result] = await conexion.query(sql, [idPrecio]);

    if (result.length === 1) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ message: "Precio no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error en la conexión: " + error.message });
  }
};
