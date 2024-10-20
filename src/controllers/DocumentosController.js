import { conexion } from "../database/conexion.js";
import { validationResult } from "express-validator";
import fs from 'fs';
import path from 'path';

export const listarDocumentos = async (req, res) => {
  try {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json(error);
    }
    const sql = `SELECT 
    d.id_documentos,
    d.nombre AS nombre_documento,
    d.fecha_carga,
    d.descripcion,
    d.codigo_documentos,
    d.fecha_emision,
    d.fk_idTipoServicio,
    v.version, 
    v.idVersion AS idversion,
    v.estado AS estado_version,
    v.nombre_documento AS nombre_version,
    v.fecha_version, 
    t.nombreDocumento AS tipo_documento,
    t.estado AS estado_tipo_documento,
    v.nombre_documento AS nombre_documento_version,
    GROUP_CONCAT(DISTINCT vrs.nombre SEPARATOR ', ') AS variables,
    GROUP_CONCAT(DISTINCT lg.nombre SEPARATOR ', ') AS logos,
    ts.nombreServicio AS tipo_servicio
FROM 
    documentos d
JOIN 
    versiones v ON d.id_documentos = v.fk_documentos
JOIN 
    tipodocumento t ON d.fk_idTipoDocumento = t.idTipoDocumento
LEFT JOIN 
    detalle dt ON v.idVersion = dt.fk_id_version
LEFT JOIN 
    variables vrs ON dt.fk_idVariable = vrs.idVariable
LEFT JOIN 
    tiposervicio ts ON d.fk_idTipoServicio = ts.idTipoServicio  
LEFT JOIN 
    logo_documento ld ON d.id_documentos = ld.documentos_iddocumentos
LEFT JOIN 
    logos lg ON ld.logo_idlogos = lg.idLogos
GROUP BY 
    d.id_documentos, v.idVersion;

`;
    const [result] = await conexion.query(sql);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: "Error: " + err.message });
  }
};

export const registrarDocumentos = async (req, res) => {
  try {
    // Validar los datos del cuerpo de la solicitud
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json(error);
    }

    // Extraer datos del cuerpo de la solicitud
    let {
      nombre,
      descripcion,
      codigo: codigo_documentos,
      fecha_emision,
      servicios: fk_idTipoServicio,
      tipo_documento: fk_idTipoDocumento,
      variables,
      logos,

    } = req.body;
    console.log(req.body)
    // Manejar caso donde fk_idTipoServicio puede ser null
    fk_idTipoServicio = fk_idTipoServicio ? fk_idTipoServicio : null;

    // Registrar el documento en la base de datos
    /* id_documentos	nombre	fecha_carga	descripcion	codigo_documentos	fecha_emision		fk_idTipoServicio	fk_idTipoDocumento	
 */
    let sqlDocumento = `
      INSERT INTO documentos (nombre, fecha_carga, descripcion, codigo_documentos, fecha_emision,   fk_idTipoServicio, fk_idTipoDocumento)
      VALUES (?, CURDATE(), ?, ?, ?, ?, ?)
    `;
    const [rows] = await conexion.query(sqlDocumento, [
      nombre,
      descripcion,
      codigo_documentos,
      fecha_emision,

      fk_idTipoServicio,
      fk_idTipoDocumento,
    ]);

    // Obtener el ID del documento recién creado
    const id_documentos = rows.insertId;

    // Registrar la versión del documento en la base de datos
    let sqlVersion = `
      INSERT INTO versiones (version, fk_documentos, nombre_documento, fecha_version)
      VALUES (?, ?, ?, NOW())
    `;
    const archivoTemporal = req.file.filename;
    const nombreTemporal = req.file.originalname;
    const extension = path.extname(nombreTemporal);
    const nombreTemporalSinExt = path.basename(nombreTemporal, extension);

    const archivoConID = `${nombreTemporalSinExt}-${id_documentos}${extension}`;
    const rutaArchivoOriginal = path.join('public', 'documentos', archivoTemporal);

    // Insertar la versión en la base de datos
    const [respondeVersion] = await conexion.query(sqlVersion, ['1', id_documentos, archivoConID]);

    if (!respondeVersion) {
      return res.status(500).json({ message: "No se pudo registrar la versión." });
    }


    const idVersion = respondeVersion.insertId;


    const archivoConIDVersion = `${idVersion}-${nombreTemporalSinExt}${extension}`;
    const rutaArchivoFinalConIDVersion = path.join('public', 'documentos', archivoConIDVersion);


    fs.renameSync(rutaArchivoOriginal, rutaArchivoFinalConIDVersion);
    let sqlNombre = `UPDATE versiones SET nombre_documento = ? WHERE idVersion = ?`
    await conexion.query(sqlNombre, [archivoConIDVersion, idVersion]);

    if (!logos || logos.length === 0) {
      return res
        .status(400)
        .json({ message: "No se proporcionaron logos para el documento." });
    }
    // si hay un un id de servicios osea si el docuemento tiene algo que ver con servicios entra al if
    if (fk_idTipoServicio) {
      /* fk_idVariable	fk_id_version	
 */
      let sqlValorVariables = `INSERT INTO detalle ( fk_idVariable ,fk_id_Version) VALUES (?,?)`;
      // mapea las variables por que viene en un array 
      const VariablesDocumento = JSON.parse(variables).map(async (idVariables) => {
        const valuesVariable = [idVariables, idVersion];
        //inserta uno por uno a la tabla valor el id  servicio el id de la variable y el id de la version
        const [response] = await conexion.query(sqlValorVariables, valuesVariable);
        return response
      });
      let sqlLogos = "INSERT INTO logo_documento (logo_idlogos,documentos_iddocumentos ) VALUES ?";
      const values = JSON.parse(logos).map((id_logo) => [id_logo, id_documentos]);
      const [response] = await conexion.query(sqlLogos, [values]);
      if (VariablesDocumento && response.affectedRows > 0) {
        return res
          .status(200)
          .json({ message: "Se registró con éxito el documento y sus logos. y sus variables" });
      }
    }


    let sqlLogos = "INSERT INTO logo_documento (logo_idlogos,documentos_iddocumentos ) VALUES ?";
    const values = JSON.parse(logos).map((id_logo) => [id_logo, id_documentos]);
    const [response] = await conexion.query(sqlLogos, [values]);

    if (response.affectedRows > 0) {
      return res
        .status(200)
        .json({ message: "Se registró con éxito el documento y sus logos." });
    }
    return res.status(404).json({ message: "No se registró el documento." });

  } catch (e) {
    return res.status(500).json({ message: "Error: " + e.message });
  }
};

export const eliminarDocumentos = async (req, res) => {
  try {
    let id_documentos = req.params.id_documentos;
    let sql = `delete from documentos where id_documentos = ${id_documentos}`;

    const [rows] = await conexion.query(sql);
    if (rows.affectedRows > 0) {
      return res
        .status(200)
        .json({ message: "Se eliminó con éxito el documentos." });
    } else {
      return res.status(404).json({ message: "No se eliminó el documentos." });
    }
  } catch (e) {
    return res.status(500).json({ message: "error " + e.message });
  }
};

export const actalizardocumentosVersion = async (req, res) => {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json(error);
  }
  try {
    let {
      nombre,
      descripcion,
      codigo: codigo_documentos,
      fecha_emision,
      servicios: fk_idTipoServicio,
      tipo_documento: fk_idTipoDocumento,
      idVersion,
      logos,
      variables
    } = req.body;
    fk_idTipoServicio = fk_idTipoServicio ? fk_idTipoServicio : null;


    const archivoTemporal = req.file.filename;
    const nombreTemporal = req.file.originalname;
    const extension = path.extname(nombreTemporal);
    const nombreTemporalSinExt = path.basename(nombreTemporal, extension);

    let sqlDocumento = `INSERT INTO documentos (nombre, fecha_carga, descripcion, codigo_documentos, fecha_emision,fk_idTipoServicio, fk_idTipoDocumento)
                        VALUES (?, CURDATE(), ?, ?, ?, ?, ?)`;
    const [rows2] = await conexion.query(sqlDocumento, [
      nombre,
      descripcion,
      codigo_documentos,
      fecha_emision,
      fk_idTipoServicio,
      fk_idTipoDocumento,
    ]);

    if (!rows2.affectedRows > 0) {
      return res
        .status(404)
        .json({ message: "No se actualizó el documentos." });
    }
    const idDocumento = rows2.insertId
    let sql = `INSERT INTO versiones (version, fk_documentos, nombre_documento, fecha_version) VALUES (?,?,?,NOW())`;
    const sqlVersion = `select version FROM versiones WHERE idVersion = ${idVersion}`;
    const [responseVersion] = await conexion.query(sqlVersion, [idVersion]);
    const versionNumero = parseInt(responseVersion[0].version);
    const VersionIncrement = versionNumero + 1;
    console.log(versionNumero)
    // registramos la version el bd
    const [respondeVersion] = await conexion.query(sql, [VersionIncrement, idDocumento, archivoTemporal]);
    if (!respondeVersion) {
      return res.status(500).json({ message: "No se pudo registrar la versión." });
    }

    const idVersionDoc = respondeVersion.insertId;

    const archivoConIDVersion = `${idVersionDoc}-${nombreTemporalSinExt}${extension}`;
    const rutaArchivoOriginal = path.join('public', 'documentos', archivoTemporal);
    const rutaArchivoFinalConIDVersion = path.join('public', 'documentos', archivoConIDVersion);

    fs.renameSync(rutaArchivoOriginal, rutaArchivoFinalConIDVersion);



    let sqlNombre = `UPDATE versiones SET nombre_documento = ? WHERE idVersion = ?`
    await conexion.query(sqlNombre, [archivoConIDVersion, idVersionDoc]);
    // validamos que hallan logos 
    if (!logos || logos.length === 0) {
      return res
        .status(400)
        .json({ message: "No se proporcionaron logos para el documento." });
    }
    if (!respondeVersion.affectedRows > 0) {
      return res.status(404).json({ message: "No se actualizó la versión." });
    }
    let sqlcambio = `update versiones set estado='inactivo' where idVersion = ${idVersion}`;
    const [responseEstado] = await conexion.query(sqlcambio);
    if (!responseEstado.affectedRows > 0) {
      return res.status(404).json({ message: "No se actualizó el estado de la versión." });
    }

    if (!fk_idTipoServicio) {
      let sqlLogosVersiones = "INSERT INTO logo_documento (logo_idlogos,documentos_iddocumentos ) VALUES ?";
      const valuesVersiones = JSON.parse(logos).map((id_logo) => [id_logo, idDocumento]);
      const [response] = await conexion.query(sqlLogosVersiones, [valuesVersiones]);
      if (response) {
        return res
          .status(200)
          .json({ message: "Se Actualizo con éxito el documento y sus logos." });
      }
    };
    let sqlValorVariables = `INSERT INTO detalle ( fk_idVariable ,fk_id_Version) VALUES (?,?)`;
    // mapea las variables por que viene en un array 
    const VariablesDocumento = JSON.parse(variables).map(async (idVariables) => {
      const valuesVariable = [idVariables, idVersionDoc];
      //inserta uno por uno a la tabla valor el id  servicio el id de la variable y el id de la version
      const [response] = await conexion.query(sqlValorVariables, valuesVariable);
      return response
    });
    let sqlLogosVersiones = "INSERT INTO logo_documento (logo_idlogos,documentos_iddocumentos ) VALUES ?";
    const valuesVersiones = JSON.parse(logos).map((id_logo) => [id_logo, idDocumento]);
    const [response] = await conexion.query(sqlLogosVersiones, [valuesVersiones]);

    if (VariablesDocumento && response.affectedRows > 0) {
      return res
        .status(200)
        .json({ message: "Se Actualizo con éxito el documento  sus logos. y sus variables" });
    }
    return res.status(404).json({ message: "No se registró el documento." });

  } catch (e) {
    return res.status(500).json({ message: "error   " + e.message });
  }
};

export const buscarDocumentos = async (req, res) => {
  try {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json(error);
    }
    let sql = "SELECT * FROM documentos WHERE id_documentos = ?";
    const id = req.params.id;
    const [documentoRows] = await conexion.query(sql, id);

    if (documentoRows.length > 0) {
      return res.status(200).json(documentoRows);
    } else {
      return res
        .status(404)
        .json({ message: "No se ha encontrado el documento solicitado." });
    }
  } catch (error) {
    res.status(500).json({ message: "Error " + error.message });
  }
};

export const Actualizar = async (req, res) => {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json(error);
  }
  try {
    let {
      nombre,
      descripcion,
      codigo: codigo_documentos,
      fecha_emision,
      servicios: fk_idTipoServicio,
      tipo_documento: fk_idTipoDocumento,
      nombre_documento_version,
      idVersion,
      logos,
      version,
      variables
    } = req.body;

    const { id_documentos } = req.params;
    console.log(id_documentos, req.body);

    // Si servicios viene vacío, asignar null
    fk_idTipoServicio = fk_idTipoServicio || null;

    // Asignar valores por defecto si son undefined
    variables = variables === 'null' ? null : variables ?? '[]';
    logos = logos ?? '[]';

    let nuevoNombreArchivo = nombre_documento_version;

    // Procesar reemplazo de archivo si se ha subido uno nuevo
    if (req.file) {
      try {
        const archivoNuevo = req.file.filename;
        const nombreOriginalNuevo = req.file.originalname;
        const extensionNuevo = path.extname(nombreOriginalNuevo);
        const nombreSinExtNuevo = path.basename(nombreOriginalNuevo, extensionNuevo);

        const rutaArchivoAnterior = path.join('public', 'documentos', nombre_documento_version);

        if (fs.existsSync(rutaArchivoAnterior)) {
          fs.unlinkSync(rutaArchivoAnterior);
          console.log(`Archivo anterior ${nombre_documento_version} eliminado correctamente.`);
        } else {
          console.log(`El archivo anterior ${nombre_documento_version} no existe.`);
        }

        nuevoNombreArchivo = `${idVersion}-${nombreSinExtNuevo}${extensionNuevo}`;
        const rutaArchivoFinal = path.join('public', 'documentos', nuevoNombreArchivo);

        fs.renameSync(path.join('public', 'documentos', archivoNuevo), rutaArchivoFinal);
      } catch (error) {
        console.error(`Error al procesar el archivo: ${error.message}`);
        return res.status(500).json({ message: 'Error al procesar el archivo.' });
      }
    }

    // Actualizar la tabla `documentos`
    let sqlDocumento = `
      UPDATE documentos
      SET nombre = ?, 
          fecha_carga = CURDATE(), 
          descripcion = ?, 
          codigo_documentos = ?, 
          fecha_emision = ?, 
          fk_idTipoServicio = ?, 
          fk_idTipoDocumento = ?
      WHERE id_documentos = ?;
    `;
    const [rows2] = await conexion.query(sqlDocumento, [
      nombre,
      descripcion,
      codigo_documentos,
      fecha_emision,
      fk_idTipoServicio,
      fk_idTipoDocumento,
      id_documentos
    ]);

    if (rows2.affectedRows === 0) {
      return res.status(404).json({ message: "No se actualizó el documento." });
    }

    // Actualizar la tabla versiones
    let sqlVersion = `
      UPDATE versiones
      SET version = ?, 
          fk_documentos = ?, 
          nombre_documento = ?, 
          fecha_version = NOW()
      WHERE idVersion = ?;
    `;
    const [respondeVersion] = await conexion.query(sqlVersion, [version, id_documentos, nuevoNombreArchivo, idVersion]);

    if (respondeVersion.affectedRows === 0) {
      return res.status(500).json({ message: "No se pudo actualizar la versión." });
    }

    // Solo procesar las variables si no es 'null'
    if (variables) {
      const variablesArray = JSON.parse(variables);

      // Paso 1: Verificar los IDs existentes
      const placeholders = variablesArray.map(() => '?').join(', ');
      const sqlCheck = `SELECT fk_idVariable FROM detalle WHERE fk_idVariable IN (${placeholders}) AND fk_id_version = ?`;
      const [existingVariables] = await conexion.query(sqlCheck, [...variablesArray, idVersion]);

      // Crear un conjunto de IDs que ya existen
      const existingIds = new Set(existingVariables.map(row => row.fk_idVariable));

      // Paso 2: Filtrar solo los IDs que no están en la base de datos
      const newVariables = variablesArray.filter(idVariable => !existingIds.has(idVariable));

      // Si hay nuevos IDs para insertar, procedemos a hacerlo
      if (newVariables.length > 0) {
        const valuesPlaceholder = newVariables.map(() => `(?, ?)`).join(', '); // Ejemplo: `(?, ?), (?, ?), ...`
        const sqlDetalle = `
          INSERT INTO detalle (fk_idVariable, fk_id_version)
          VALUES ${valuesPlaceholder}
        `;

        const detalleValues = [];
        for (const idVariable of newVariables) {
          detalleValues.push(idVariable, idVersion);
        }

        await conexion.query(sqlDetalle, detalleValues);
      }
    }

    const logosArray = JSON.parse(logos);

    // Paso 1: Verificar los IDs de logos existentes
    const logosPlaceholders = logosArray.map(() => '?').join(', ');
    const sqlCheckLogos = `
      SELECT logo_idlogos FROM logo_documento 
      WHERE logo_idlogos IN (${logosPlaceholders}) AND documentos_iddocumentos = ?
    `;
    const [existingLogos] = await conexion.query(sqlCheckLogos, [...logosArray, id_documentos]);

    const existingLogoIds = new Set(existingLogos.map(row => row.logo_idlogos));

    // Paso 2: Filtrar solo los IDs de logos que no están en la base de datos
    const newLogos = logosArray.filter(idLogo => !existingLogoIds.has(idLogo));

    // Si hay nuevos logos para insertar, procedemos a hacerlo
    if (newLogos.length > 0) {
      const logosValuesPlaceholder = newLogos.map(() => `(?, ?)`).join(', ');
      const sqlLogosInsert = `
        INSERT INTO logo_documento (logo_idlogos, documentos_iddocumentos)
        VALUES ${logosValuesPlaceholder}
      `;

      // Aplanar el array para los valores
      const logosValues = [];
      for (const idLogo of newLogos) {
        logosValues.push(idLogo, id_documentos);
      }

      // Ejecutar la consulta para insertar solo los nuevos logos
      await conexion.query(sqlLogosInsert, logosValues);
    }

    res.status(200).json({ message: 'Actualización exitosa.' });

  } catch (error) {
    console.error(`Error en la operación: ${error.message}`);
    res.status(500).json({ message: 'Error en la operación.' });
  }
};


export const consultaGrafica = async (req, res) => {
  try {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json(error);
    }

    let sql = `
SELECT 
    td.nombreDocumento AS name, 
    COUNT(d.id_documentos) AS value
FROM 
    documentos d
JOIN 
    tipodocumento td ON d.fk_idTipoDocumento = td.idTipoDocumento
WHERE 
    td.estado = 'activo'
GROUP BY 
    td.nombreDocumento;`
    const [rows] = await conexion.query(sql);
    if (rows.length > 0) {
      return res.status(200).json({ data: rows });
    }
    return res
      .status(404)
      .json({ message: "No se ha podido actualizar el documento." });


  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}