import { validationResult } from "express-validator";
import { conexion } from "../database/conexion.js";

export const getAlquiler = async (req, res) => {
  try {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json(error);
    }
    let sql = `SELECT 
    s.id_servicios,
    ts.nombreServicio AS tipo_servicio,
    DATE_FORMAT(s.fecha, '%Y-%m-%d') AS fecha,
    p.presentacion as precio,
    a.nombre_ambiente as ambiente,
    CONCAT(u.nombre, ' ', u.apellidos) AS nombre_completo_usuario,
    DATE_FORMAT(s.fecha_fin, '%Y-%m-%d') AS fecha_fin,
    s.estado
FROM 
    servicios s
JOIN 
    tiposervicio ts ON s.fk_idTipoServicio = ts.idTipoServicio
JOIN
    precio p ON s.fk_id_precio = p.idPrecio
JOIN
    ambiente a ON s.fk_idAmbiente = a.idAmbiente
JOIN
    usuarios u ON s.fk_idUsuarios = u.id_usuario
WHERE 
    s.fk_idTipoServicio = 4
ORDER BY 
    s.id_servicios ASC;
`;
    const [resultado] = await conexion.query(sql);
    if (resultado.length > 0) {
      res.status(200).json(resultado);
    } else {
      res.status(404).json({ message: "No hay reservas activas" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor" + error.message });
  }
};

export const usuariosParaAlquiler = async (req,res)=>{
  try {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json(error);
    }
    let sql = `SELECT 
    u.id_usuario,
    CONCAT(u.nombre,' ', u.apellidos) AS nombre_completo_usuario,
    u.correo_electronico,
    u.telefono,
    u.numero_documento,
    u.tipo_documento,
    u.estado,
    r.rol
FROM 
    usuarios u
JOIN 
    rol r ON u.fk_idRol = r.idRol
WHERE 
    u.tipo_documento = 'nit'
AND    
    r.rol = 'cliente';
`
const [respuesta] = await conexion.query(sql)
if(respuesta.length>0){
  res.status(200).json(respuesta)
}else{
  res.status(404).json({message:'No hay usuarios que cumplan los requisitos para el servicio'})
}
  } catch (error) {
    res.status(500).json({message:'Error en el servidor'+error.message})
  }
}


export const registrarAlquiler = async (req, res) => {
  try {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json(error);
    }
    const { fecha, fk_idAmbiente, fk_idUsuarios, fecha_fin } = req.body;

    // Obtener la fecha actual
    const fechaActual = new Date().toISOString().split('T')[0]; // Formato 'YYYY-MM-DD'

    // Verificar si la fecha de inicio o fin es anterior a la fecha actual
    if (fecha < fechaActual || fecha_fin < fechaActual) {
      return res.status(400).json({ message: "No se pueden reservar fechas anteriores a la actual" });
    }

    // Verificar si ya hay una reserva en ese ambiente que se solape con el rango de fechas
    let sqlVerificar = `
      SELECT * FROM servicios 
      WHERE fk_idAmbiente = ? 
      AND (
        (? BETWEEN fecha AND fecha_fin) OR 
        (? BETWEEN fecha AND fecha_fin) OR
        (fecha BETWEEN ? AND ?) OR 
        (fecha_fin BETWEEN ? AND ?)
      )
    `;
    
    const [reservasExistentes] = await conexion.query(sqlVerificar, [
      fk_idAmbiente,
      fecha,        // Comprobar si la fecha de inicio cae dentro de una reserva existente
      fecha_fin,    // Comprobar si la fecha de fin cae dentro de una reserva existente
      fecha,        // Comprobar si una reserva existente comienza dentro del rango de la nueva reserva
      fecha_fin,    // Comprobar si una reserva existente termina dentro del rango de la nueva reserva
      fecha,        // Validar si la fecha inicial coincide dentro de una reserva existente
      fecha_fin     // Validar si la fecha final coincide dentro de una reserva existente
    ]);

    if (reservasExistentes.length > 0) {
      return res.status(400).json({ message: "Ya existe una reserva para las fechas seleccionadas" });
    }

    // Obtener el idPrecio según el fk_idTipoServicio
    let sqlPrecio = `
      SELECT idPrecio 
      FROM precio 
      WHERE fk_idTipoServicio = 4
    `;

    const [precioResult] = await conexion.query(sqlPrecio);

    if (precioResult.length === 0) {
      return res.status(404).json({ message: "No se encontró un precio para el tipo de servicio seleccionado" });
    }

    const idPrecio = precioResult[0].idPrecio;  // Obtener el idPrecio

    // Si todo está bien, proceder con la inserción
    let sqlInsertar = `
      INSERT INTO servicios (fk_idTipoServicio, fecha, fk_id_precio, fk_idAmbiente, fk_idUsuarios, fecha_fin) 
      VALUES (4, ?, ?, ?, ?, ?)
    `;
    
    const [resultado] = await conexion.query(sqlInsertar, [
      fecha,
      idPrecio,      // Insertar el idPrecio obtenido
      fk_idAmbiente,
      fk_idUsuarios,
      fecha_fin,
    ]);

    if (resultado.affectedRows > 0) {
      res.status(200).json({ message: "Reserva de laboratorio exitosa" });
    } else {
      res.status(404).json({ message: "No se pudo crear la reserva" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor: " + error.message });
  }
};

export const actualizarAlquiler = async (req, res) => {
  try {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json(error);
    }
    const { id } = req.params; 
    const { fecha, fk_idAmbiente, fk_idUsuarios, fecha_fin } = req.body;

    // Obtener la fecha actual
    const fechaActual = new Date().toISOString().split('T')[0]; // Formato 'YYYY-MM-DD'

    // Verificar si la fecha de inicio o fin es anterior a la fecha actual
    if (fecha < fechaActual || fecha_fin < fechaActual) {
      return res.status(400).json({ message: "No se pueden reservar fechas anteriores a la actual" });
    }

    // Verificar si ya hay una reserva en ese ambiente para el rango de fechas
    let sqlVerificar = `
      SELECT * FROM servicios 
      WHERE fk_idAmbiente = ? 
      AND (fecha BETWEEN ? AND ? OR fecha_fin BETWEEN ? AND ?) 
      AND id_servicios != ?
    `;

    const [reservasExistentes] = await conexion.query(sqlVerificar, [
      fk_idAmbiente,
      fecha,
      fecha_fin,
      fecha,
      fecha_fin,
      id, // Excluir la reserva que se está actualizando
    ]);

    if (reservasExistentes.length > 0) {
      return res.status(400).json({ message: "Ya existe una reserva para las fechas seleccionadas" });
    }

    // Si todo está bien, proceder con la actualización
    let sqlActualizar = `
      UPDATE servicios 
      SET fecha = ?, fk_idAmbiente = ?, fk_idUsuarios = ?, fecha_fin = ? 
      WHERE id_servicios = ?
    `;

    const [resultado] = await conexion.query(sqlActualizar, [
      fecha,
      fk_idAmbiente,
      fk_idUsuarios,
      fecha_fin,
      id,
    ]);

    if (resultado.affectedRows > 0) {
      res.status(200).json({ message: "Reserva actualizada con éxito" });
    } else {
      res.status(404).json({ message: "No se encontró la reserva para actualizar" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor: " + error.message });
  }
};

export const eliminarAlquiler = async (req, res) => {
  try {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json(error);
    }
    let id = req.params.id;
    let sql = `DELETE FROM servicios WHERE id_servicios = ?`;
    const [respuesta] = await conexion.query(sql, [id]);
    if (respuesta.affectedRows === 1) {
      res.status(200).json({ message: "Reserva eliminada con éxito." });
    } else {
      res.status(404).json({ message: "No se pudo eliminar la reserva." });
    }
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor " + error.message });
  }
};