import { conexion } from "../database/conexion.js";
import { validationResult } from "express-validator";
export const listaIngresoTrilla = async (req, res) => {
  try {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json(error);
    }
    // Consulta SQL para obtener el reporte junto con las rutas de los logos asignados al documento
    let sql = `
    SELECT 
        doc.codigo_documentos AS codigo_documento,
        ver.version AS version_documento,
        doc.fecha_emision AS fecha_emision_documento,
        mu.codigo_muestra AS codigo_muestra,
        mu.fecha_muestra AS fecha_muestra,
        mu.cantidadEntrada AS cantidad_muestra,
        CONCAT(usu.nombre, ' ', usu.apellidos) AS usuario_registro_servicio, -- Cambiado a servicio
        mu.fk_id_usuarios AS cliente_id,
        cli.tipo_documento AS tipo_documento_cliente, -- Cambiado a cli, el cliente real
        cli.numero_documento AS numero_documento_cliente,
        cli.telefono AS telefono_cliente,
        mu.variedad AS variedad_muestra,
        mu.altura AS altura_muestra,
        mu.observaciones AS observaciones_muestra,
        GROUP_CONCAT(logos.ruta ORDER BY logos.idLogos SEPARATOR ', ') AS logos_rutas
    FROM 
        muestra mu
    JOIN 
        usuarios cli ON mu.fk_id_usuarios = cli.id_usuario -- Cliente de la muestra
    JOIN 
        servicios serv ON mu.id_muestra = serv.fk_idMuestra -- Relación con servicios
    JOIN 
        usuarios usu ON serv.fk_idUsuarios = usu.id_usuario -- Usuario que registra el servicio
    JOIN 
        documentos doc ON mu.fk_idTipoServicio = doc.fk_idTipoServicio
    JOIN 
        versiones ver ON doc.id_documentos = ver.fk_documentos
    LEFT JOIN 
        logo_documento ld ON doc.id_documentos = ld.documentos_iddocumentos
    LEFT JOIN 
        logos ON ld.logo_idlogos = logos.idLogos
    WHERE 
        ver.estado = 'activo'
    GROUP BY 
        doc.id_documentos, ver.version, mu.codigo_muestra, mu.fecha_muestra, mu.cantidadEntrada, cli.id_usuario, mu.variedad, mu.altura, mu.observaciones, usu.id_usuario
    ORDER BY 
        doc.codigo_documentos;`;

    // Ejecutar la consulta SQL
    const [result] = await conexion.query(sql);

    // Si hay resultados, se devuelven
    if (result.length > 0) {
      res.status(200).json(result); // Retornar los resultados en formato JSON
    } else {
      res.status(404).json({ message: 'No se encontraron resultados' }); // En caso de que no haya registros
    }

  } catch (error) {
    // Manejo de errores
    res.status(500).json({ message: "Error en el servidor: " + error.message });
  }
};

export const obtenerInformacionServicio = async (req, res) => {
  try {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json(error);
    }
    // Obtener los parámetros del cuerpo de la solicitud
    const { idTipoServicio, fechaInicio, fechaFin } = req.body;

    // Validación de los datos del cuerpo
    if (!idTipoServicio || !fechaInicio || !fechaFin) {
      return res.status(400).json({ message: "Debe proporcionar idTipoServicio, fechaInicio y fechaFin." });
    }

    // Consulta SQL para obtener todas las muestras del tipo de servicio con solo documentos activos
    const query = `
      SELECT 
        ts.nombreServicio AS nombre_tipo_servicio, -- Nombre del tipo de servicio
        d.codigo_documentos AS codigo_documento,
        v.version AS version_documento,
        DATE_FORMAT(d.fecha_emision, '%Y-%m-%d') AS fecha_emision_documento, -- Formatear la fecha de emisión
        m.codigo_muestra AS codigo_muestra,
        DATE_FORMAT(m.fecha_muestra, '%Y-%m-%d') AS fecha_muestra, -- Formatear la fecha de muestra
        m.cantidadEntrada AS cantidad_muestra,
        CONCAT(usu.nombre, ' ', usu.apellidos) AS nombre_cliente, -- Nombre del cliente obtenido de la tabla usuarios
        CONCAT(usu_rec.nombre, ' ', usu_rec.apellidos) AS nombre_recibido, -- Nombre de quien recibe el servicio
        usu.tipo_documento AS tipo_documento_cliente,
        usu.numero_documento AS numero_documento_cliente,
        usu.telefono AS telefono_cliente,
        m.variedad AS variedad_muestra,
        m.altura AS altura_muestra,
        m.observaciones AS observaciones_muestra,
        GROUP_CONCAT(l.ruta SEPARATOR ', ') AS logos_rutas,
        mun.nombre_municipio AS municipio_muestra -- Nombre del municipio
      FROM servicios s
      JOIN muestra m ON s.fk_idMuestra = m.id_muestra
      JOIN usuarios usu ON m.fk_id_usuarios = usu.id_usuario -- Obteniendo el cliente de la tabla usuarios
      JOIN usuarios usu_rec ON s.fk_idUsuarios = usu_rec.id_usuario -- Obteniendo el nombre de quien recibe el servicio
      JOIN documentos d ON s.fk_idTipoServicio = d.fk_idTipoServicio
      JOIN versiones v ON v.fk_documentos = d.id_documentos
      JOIN logo_documento ld ON ld.documentos_iddocumentos = d.id_documentos
      JOIN logos l ON ld.logo_idlogos = l.idLogos
      JOIN finca f ON m.fk_id_finca = f.id_finca -- Unir con finca
      JOIN municipio mun ON f.fk_id_municipio = mun.id_municipio -- Unir con municipio
      JOIN tiposervicio ts ON s.fk_idTiposervicio = ts.idTipoServicio -- Cambiado a 'tiposervicio' (nombre correcto)
      WHERE s.fk_idTiposervicio = ?
        AND v.estado = 'activo' -- Filtra solo documentos con versión activa
        AND (d.fecha_emision BETWEEN ? AND ? OR m.fecha_muestra BETWEEN ? AND ?)
      GROUP BY 
        ts.nombreServicio, -- Agrupar también por el nombre del tipo de servicio
        d.codigo_documentos,
        v.version,
        d.fecha_emision,
        m.codigo_muestra,
        m.fecha_muestra,
        m.cantidadEntrada,
        usu.nombre, -- Nombre del cliente
        usu.apellidos,
        usu_rec.nombre, -- Nombre de quien recibe el servicio
        usu_rec.apellidos,
        usu.tipo_documento,
        usu.numero_documento,
        usu.telefono,
        m.variedad,
        m.altura,
        m.observaciones,
        mun.nombre_municipio; -- Agrupar por nombre del municipio
    `;

    // Ejecutar la consulta con los parámetros del cuerpo de la solicitud
    const [result] = await conexion.query(query, [idTipoServicio, fechaInicio, fechaFin, fechaInicio, fechaFin]);

    if (result.length === 0) {
      return res.status(404).json({ message: "No se encontraron muestras para el tipo de servicio en el rango de fechas especificado." });
    }

    // Devolver el resultado
    return res.json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: `Error en el servidor: ${error.message}`,
    });
  }
};