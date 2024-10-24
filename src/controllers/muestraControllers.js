import { conexion } from "../database/conexion.js";
import { validationResult } from "express-validator";


export const ListarMuestras = async (req, res) => {
  try {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json(error);
    }

    const sql = `
      SELECT 
        m.id_muestra, 
        m.codigo_muestra, 
        m.cantidadEntrada, 
        m.fecha_muestra, 
        m.estado, 
        m.altura, 
        m.variedad, 
        m.observaciones, 
        m.codigoExterno, 
        m.UnidadMedida,
        m.fotoMuestra,
        f.nombre_finca AS finca,  
        CONCAT(u.nombre, ' ', u.apellidos) AS nombre_usuario,  
        ts.nombreServicio AS fk_idTipoServicio  
      FROM muestra m
      JOIN finca f ON m.fk_id_finca = f.id_finca
      JOIN usuarios u ON m.fk_id_usuarios = u.id_usuario
      JOIN tiposervicio ts ON m.fk_idTipoServicio = ts.idTipoServicio
    `;

    const [responde] = await conexion.query(sql);

    if (responde.length > 0) {
      const formatearResponde = responde.map((muestra) => ({
        id_muestra: muestra.id_muestra,
        codigo_muestra: muestra.codigo_muestra,
        cantidadEntrada: parseFloat(muestra.cantidadEntrada),
        fecha_muestra: muestra.fecha_muestra.toISOString().split('T')[0],
        estado: muestra.estado,
        finca: muestra.finca,
        usuario: muestra.nombre_usuario,
        altura: parseFloat(muestra.altura),
        variedad: muestra.variedad,
        observaciones: muestra.observaciones,
        codigoExterno: muestra.codigoExterno,
        fk_idTipoServicio: muestra.fk_idTipoServicio,
        UnidadMedida: muestra.UnidadMedida,
        fotoMuestra: muestra.fotoMuestra // Solo el nombre de la imagen
      }));

      return res.status(200).json(formatearResponde);
    } else {
      return res.status(404).json({ mensaje: "No se encontraron muestras" });
    }
  } catch (error) {
    console.error("Error al listar muestras:", error);
    return res.status(500).json({ mensaje: "Error en la conexión: " + error.message });
  }
};

export const RegistrarMuestra = async (req, res) => {
  try {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json(error);
    }

    console.log('Datos recibidos:', req.body); // Para depuración

    const {
      cantidadEntrada,
      fk_id_finca,
      fecha_muestra,
      fk_id_usuarios,
      altura,
      variedad,
      observaciones,
      codigoExterno,
      fk_idTipoServicio,
      UnidadMedida
    } = req.body;

    const estado = "pendiente";
    // Usamos el nombre original del archivo
    const fotoMuestra = req.file.originalname || null;

    const insertSql = `
      INSERT INTO muestra (cantidadEntrada, fk_id_finca, fecha_muestra, fk_id_usuarios, estado, altura, variedad, observaciones, codigoExterno, fk_idTipoServicio, UnidadMedida, fotoMuestra)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [insertRespuesta] = await conexion.query(insertSql, [
      parseFloat(cantidadEntrada),
      parseInt(fk_id_finca),
      fecha_muestra,
      parseInt(fk_id_usuarios),
      estado,
      parseFloat(altura),
      variedad,
      observaciones,
      codigoExterno,
      parseInt(fk_idTipoServicio),
      UnidadMedida,
      fotoMuestra
    ]);

    if (insertRespuesta.affectedRows === 0) {
      return res.status(500).json({ message: "No se registró correctamente" });
    }

    const idMuestra = insertRespuesta.insertId;

    const tipoServicioSql = `
      SELECT codigoTipoServicio FROM tiposervicio WHERE idTipoServicio = ?
    `;
    const [servicioRespuesta] = await conexion.query(tipoServicioSql, [fk_idTipoServicio]);

    if (servicioRespuesta.length === 0) {
      return res.status(404).json({ message: "Tipo de servicio no encontrado" });
    }

    const codigoTipoServicio = servicioRespuesta[0].codigoTipoServicio;
    const codigoMuestraFinal = `${codigoTipoServicio}-${idMuestra}`;

    const updateSql = `
      UPDATE muestra SET codigo_muestra = ? WHERE id_muestra = ?
    `;
    const [updateRespuesta] = await conexion.query(updateSql, [codigoMuestraFinal, idMuestra]);

    if (updateRespuesta.affectedRows > 0) {
      return res.status(201).json({ message: "Se registró correctamente", codigo_muestra: codigoMuestraFinal });
    } else {
      return res.status(500).json({ message: "No se pudo actualizar el código de la muestra" });
    }
  } catch (error) {
    console.error("Error al registrar la muestra:", error);
    return res.status(500).json({
      message: "Error al registrar la muestra: " + error.message,
    });
  }
};


export const ActualizarMuestra = async (req, res) => {
  try {
    console.log("Iniciando ActualizarMuestra");
    console.log("Contenido de req.file:", req.file);
    console.log("Contenido de req.body:", req.body);

    // Validar si hay errores en los datos enviados
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json(error);
    }


    const {
      cantidadEntrada,
      fecha_muestra,
      altura,
      variedad,
      observaciones,
      codigoExterno,
      UnidadMedida,
      fk_id_finca,
      fk_id_usuarios,
      fk_idTipoServicio
    } = req.body;

    const id = req.params.id;

    // Obtener los datos actuales de la muestra para comparaciones
    const [existingData] = await conexion.query(
      'SELECT * FROM muestra WHERE id_muestra = ?',
      [id]
    );

    if (existingData.length === 0) {
      return res.status(404).json({ message: "No se encontró la muestra para actualizar" });
    }

    const currentData = existingData[0];
    console.log("Datos actuales de la muestra:", currentData);

    // Función para verificar si un valor de llave foránea es válido
    const isValidForeignKey = async (table, column, value) => {
      if (value === undefined) return false;
      const [result] = await conexion.query(`SELECT 1 FROM ${table} WHERE ${column} = ?`, [value]);
      return result.length > 0;
    };

    // Validar llaves foráneas con datos actuales si es necesario
    const updatedFkIdFinca = fk_id_finca && await isValidForeignKey('finca', 'id_finca', fk_id_finca) 
      ? fk_id_finca 
      : currentData.fk_id_finca;

    const updatedFkIdUsuarios = fk_id_usuarios && await isValidForeignKey('usuarios', 'id_usuario', fk_id_usuarios) 
      ? fk_id_usuarios 
      : currentData.fk_id_usuarios;

    const updatedFkIdTipoServicio = fk_idTipoServicio && await isValidForeignKey('tiposervicio', 'idTipoServicio', fk_idTipoServicio) 
      ? fk_idTipoServicio 
      : currentData.fk_idTipoServicio;

    // Manejar la actualización de la foto de la muestra
    const updatedFotoMuestra = req.file ? req.file.originalname : currentData.fotoMuestra;
    console.log("Foto de la muestra a utilizar:", updatedFotoMuestra);

    // Consulta SQL para actualizar la muestra
    const sql = `
      UPDATE muestra 
      SET 
        cantidadEntrada = ?, 
        fk_id_finca = ?, 
        fecha_muestra = ?, 
        fk_id_usuarios = ?, 
        altura = ?, 
        variedad = ?, 
        observaciones = ?, 
        codigoExterno = ?, 
        fk_idTipoServicio = ?,
        UnidadMedida = ?,
        fotoMuestra = ?
      WHERE id_muestra = ?
    `;

    const updatedValues = [
      cantidadEntrada !== undefined ? parseFloat(cantidadEntrada) : currentData.cantidadEntrada,
      updatedFkIdFinca,
      fecha_muestra || currentData.fecha_muestra,
      updatedFkIdUsuarios,
      altura !== undefined ? parseFloat(altura) : currentData.altura,
      variedad || currentData.variedad,
      observaciones || currentData.observaciones,
      codigoExterno || currentData.codigoExterno,
      updatedFkIdTipoServicio,
      UnidadMedida || currentData.UnidadMedida,
      updatedFotoMuestra,
      id
    ];

    console.log("Valores a actualizar:", updatedValues);

    // Ejecutar la consulta de actualización
    const [respuesta] = await conexion.query(sql, updatedValues);

    console.log("Respuesta de la actualización:", respuesta);

    // Verificar si la actualización fue exitosa
    if (respuesta.affectedRows > 0) {
      return res.status(200).json({ 
        message: "Se actualizó con éxito",
        updatedData: {
          id_muestra: id,
          cantidadEntrada: cantidadEntrada !== undefined ? parseFloat(cantidadEntrada) : currentData.cantidadEntrada,
          fk_id_finca: updatedFkIdFinca,
          fecha_muestra: fecha_muestra || currentData.fecha_muestra,
          fk_id_usuarios: updatedFkIdUsuarios,
          altura: altura !== undefined ? parseFloat(altura) : currentData.altura,
          variedad: variedad || currentData.variedad,
          observaciones: observaciones || currentData.observaciones,
          codigoExterno: codigoExterno || currentData.codigoExterno,
          fk_idTipoServicio: updatedFkIdTipoServicio,
          UnidadMedida: UnidadMedida || currentData.UnidadMedida,
          fotoMuestra: updatedFotoMuestra
        }
      });
    } else {
      return res.status(404).json({ message: "No se encontró la muestra para actualizar" });
    }
  } catch (error) {
    console.error("Error al actualizar la muestra:", error);
    return res.status(500).json({
      message: "Error al actualizar la muestra: " + error.message,
    });
  }
};

export const eliminarMuestra = async (req, res) => {
  try {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json(error);
    }

    // Obtén el id desde los parámetros de la ruta
    const { id_muestra } = req.params;

    // Verifica si el id es válido
    if (!id_muestra) {
      return res.status(400).json({ message: "ID de la muestra es requerido" });
    }

    // Consulta SQL segura usando placeholders
    const sql = 'DELETE FROM muestra WHERE id_muestra = ?';

    // Ejecuta la consulta con el id proporcionado en los parámetros
    const [response] = await conexion.query(sql, [id_muestra]);

    // Verifica si se eliminó algún registro
    if (response.affectedRows > 0) {
      return res.status(200).json({ message: "Muestra eliminada correctamente" });
    } else {
      return res.status(404).json({ message: "No se encontró la muestra con el ID proporcionado" });
    }

  } catch (error) {
    // Manejo de errores y mensajes claros
    console.error("Error al eliminar la muestra:", error);
    return res.status(500).json({ message: "Error en la conexión: " + error.message });
  }
};

export const ListaridMuestra = async (req, res) => {
  try {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json(error);
    }

    let id = req.params.id;
    let sql = `select * from muestra where id_muestra=${id}`;
    const [responde] = await conexion.query(sql);
    if (responde.length == 1) {
      res.status(200).json(responde);
    } else {
      res.status(500).json({ message: "dato no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ menssage: "error en la conexion" + error.menssage });
  }
};




export const ActualizarEstadoMuestra = async (req, res) => {
  try {
    let { estado } = req.body;
    let id = req.params.id;

    let sql = `
      UPDATE muestra
      SET estado = '${estado}'
      WHERE id_muestra = ${id}
    `;

    const [respuesta] = await conexion.query(sql);

    if (respuesta.affectedRows > 0) {
      return res.status(200).json({ message: "Estado actualizado con éxito" });
    } else {
      return res.status(404).json({ message: "No se encontró la muestra" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error en la conexión: " + error.message });
  }
};

export const MuestrasTerminadas = async (req,res ) => {
  try {
    const sql = `
   SELECT 
        m.id_muestra, 
        m.codigo_muestra, 
        m.cantidadEntrada, 
        m.fecha_muestra, 
        m.estado, 
        m.altura, 
        m.variedad, 
        m.observaciones, 
        f.nombre_finca, 
        CONCAT(u.nombre, ' ', u.apellidos) AS nombre_usuario
      FROM muestra m
      JOIN finca f ON m.fk_id_finca = f.id_finca
      JOIN usuarios u ON m.fk_id_usuarios = u.id_usuario
      where m.estado= "terminado"
    `;

    const [responde] = await conexion.query(sql);
    if (responde.length > 0) {
      const formatearResponde = responde.map((muestra) => ({
        id_muestra: muestra.id_muestra,
        codigo_muestra: muestra.codigo_muestra,
        cantidadEntrada: parseFloat(muestra.cantidadEntrada),
        fecha_muestra: muestra.fecha_muestra.toISOString().split('T')[0],
        estado: muestra.estado,
        finca: muestra.nombre_finca,
        usuario: muestra.nombre_usuario,
        altura: parseFloat(muestra.altura),
        variedad: muestra.variedad,
        observaciones: muestra.observaciones,
        codigoExterno: muestra.codigoExterno,
        fk_idTipoServicio: muestra.fk_idTipoServicio,
        UnidadMedida: muestra.UnidadMedida,
      }));

      return res.status(200).json(formatearResponde);
    } else {
      return res.status(404).json({ mensaje: "No se encontraron muestras" });
    }
  } catch (error) {
    return res.status(500).json({ mensaje: "Error en la conexión: " + error.message });
  }
}