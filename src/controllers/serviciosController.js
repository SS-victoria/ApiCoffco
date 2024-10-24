import { conexion } from "../database/conexion.js";
import { validationResult } from "express-validator";

//obtiene variables para registro segun id_muestra
export const getVariables = async (req, res) => {
  try {

    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json(error);
    }


    const { id_muestra } = req.body;

    // Verifica si id_muestra está presente
    if (!id_muestra) {
      return res.status(400).json({ message: "El id_muestra es requerido" });
    }

    // Consulta para obtener el fk_idTipoServicio relacionado con la muestra
    const sqlGetTipoServicio = `SELECT fk_idTipoServicio FROM muestra WHERE id_muestra = ?`;
    const [getTipoServicio] = await conexion.query(sqlGetTipoServicio, [
      id_muestra,
    ]);

    if (getTipoServicio.length === 0) {
      return res.status(404).json({ message: "Muestra no encontrada" });
    }

    const fk_idTipoServicio = getTipoServicio[0]?.fk_idTipoServicio;

    // Verifica si fk_idTipoServicio está presente
    if (!fk_idTipoServicio) {
      return res
        .status(404)
        .json({ message: "Tipo de servicio no encontrado para la muestra" });
    }

    // Consulta combinada para obtener el documento y sus variables
    const sqlVariables = `
      SELECT doc.id_documentos, doc.nombre AS documento_nombre, v.idVariable, 
             v.nombre AS variable_nombre, v.tipo_dato AS variable_tipo_dato
      FROM documentos doc
      JOIN versiones ver ON doc.id_documentos = ver.fk_documentos
      JOIN tiposervicio ts ON doc.fk_idTipoServicio = ts.idTipoServicio
      JOIN detalle det ON ver.idVersion = det.fk_id_version
      JOIN variables v ON det.fk_idVariable = v.idVariable
      WHERE ts.idTipoServicio = ?
      AND ver.estado = 'activo'
    `;

    const [respuesta] = await conexion.query(sqlVariables, [fk_idTipoServicio]);

    if (respuesta.length > 0) {
      return res.status(200).json(respuesta);
    } else {
      return res
        .status(404)
        .json({
          message:
            "No se encontraron documentos o variables para esta muestra.",
        });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Error en el servidor: ${error.message}` });
  }
};

// obtiene el fk_idTipoServicio segun el id_muestra
export const getTipoServicioDeIDMuestra = async (req, res) => {
  try {
    let { id_muestra } = req.body;

    // Verifica si id_muestra está presente
    if (!id_muestra) {
      return res.status(400).json({ message: "El id_muestra es requerido" });
    }

    // Consulta para obtener el fk_idTipoServicio relacionado con la muestra
    const sqlGetTipoServicio = `SELECT fk_idTipoServicio FROM muestra WHERE id_muestra = ?`;
    const [fk_idTipoServicio] = await conexion.query(sqlGetTipoServicio, [
      id_muestra,
    ]);

    if (fk_idTipoServicio.length > 0) {
      return res.status(200).json(fk_idTipoServicio);
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Error en el servidor: ${error.message}` });
  }
};

//obtiene variables con sus valores para actualizacion
export const getVariablesUpdate = async (req, res) => {
  try {
    const { id_servicios } = req.body;
    console.log("id_servicios en el body: ", id_servicios);

    // Consulta SQL con la relación de detalle y variables
    const sql = `SELECT v.valor, v.fk_id_detalle, v.id_valor,var.idVariable , var.nombre AS nombre_variable, var.tipo_dato, var.UnidadMedida
                 FROM valor v
                 JOIN servicios s ON v.fk_id_servicio = s.id_servicios
                 JOIN detalle d ON v.fk_id_detalle = d.id_detalle
                 JOIN variables var ON d.fk_idVariable = var.idVariable
                 WHERE s.id_servicios = ?`;

    // Ejecuta la consulta
    const [respuesta] = await conexion.query(sql, [id_servicios]);
    console.log("Respuesta de la obtención de variables: ", respuesta);

    if (respuesta.length > 0) {
      return res.status(200).json(respuesta);
    } else {
      return res.status(404).json({
        message: "No se encontró resultado de Documentos o Variables",
      });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error en el servidor: " + error.message });
  }
};

//obtener muestra aptas para registrar en sevicio
export const getMuestrasParaServicios = async (req, res) => {
  try {
    let sql = `
      select id_muestra, cantidadEntrada, fk_id_finca, fecha_muestra, codigo_muestra, fk_id_usuarios,
      estado, altura, variedad, observaciones, fk_idTipoServicio
      from muestra
      where estado = 'pendiente'
      and id_muestra not in (select fk_idMuestra from servicios where fk_idMuestra is not null)
    `;
    const [respuesta] = await conexion.query(sql);

    if (respuesta.length > 0) {
      return res.status(200).json(respuesta);
    } else {
      return res.status(404).json({
        message: "No se encontraron muestras disponibles",
      });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error en el servidor: " + error.message });
  }
};

export const getPreciosSegunTipoServicio = async (req, res) => {
  try {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json(error);
    }
    const { id_muestra } = req.body;

    // Verifica si id_muestra está presente
    if (!id_muestra) {
      return res.status(400).json({ message: "El id_muestra es requerido" });
    }

    // Consulta para obtener el fk_idTipoServicio relacionado con la muestra
    const sqlGetTipoServicio = `SELECT fk_idTipoServicio, UnidadMedida FROM muestra WHERE id_muestra = ?`;
    const [getTipoServicio] = await conexion.query(sqlGetTipoServicio, [
      id_muestra,
    ]);

    if (getTipoServicio.length === 0) {
      return res.status(404).json({ message: "Muestra no encontrada" });
    }

    const { fk_idTipoServicio, UnidadMedida } = getTipoServicio[0];

    // Verifica si fk_idTipoServicio está presente
    if (!fk_idTipoServicio || !UnidadMedida) {
      return res
        .status(404)
        .json({
          message:
            "Tipo de servicio o unidad de medida no encontrado para la muestra",
        });
    }

    // Consulta para obtener los precios filtrados por fk_idTipoServicio y UnidadMedida
    const sqlVariables = `
      SELECT 
        p.idPrecio,
        p.precio,
        p.presentacion,
        p.UnidadMedida,
        ts.nombreServicio,
        p.estado_precio
      FROM 
        precio p
      JOIN 
        tiposervicio ts ON p.fk_idTipoServicio = ts.idTipoServicio
      WHERE 
        ts.idTipoServicio = ?
      AND 
        p.UnidadMedida = ?
      AND 
        p.estado_precio = 'activo'
    `;

    const [respuesta] = await conexion.query(sqlVariables, [
      fk_idTipoServicio,
      UnidadMedida,
    ]);

    if (respuesta.length > 0) {
      return res.status(200).json(respuesta);
    } else {
      return res
        .status(404)
        .json({
          message:
            "No se encontraron precios para el servicio y la unidad de medida",
        });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Error en el servidor: ${error.message}` });
  }
};

// registra un servicio
export const registrarServicio = async (req, res) => {
  try {

    const error = validationResult(req)
    if(!error.isEmpty()){
      return res.status(400).json(error);
    }

    const {
      fk_idTipoServicio,
      fecha,
      fk_id_precio,
      fk_idAmbiente,
      fk_idMuestra,
      fk_idUsuarios,
      valoresVariables,
    } = req.body;

    console.log("Datos recibidos en el controlador:", {
      fk_idTipoServicio,
      fk_id_precio,
      fk_idAmbiente,
      fk_idMuestra,
      fk_idUsuarios,
      valoresVariables,
    });

    // Verificación de campos obligatorios
    if (
      !fk_idTipoServicio ||
      !fk_id_precio ||
      !fk_idAmbiente ||
      !fk_idMuestra ||
      !fk_idUsuarios
    ) {
      console.log("Campos obligatorios faltantes");
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    // registro del servicio
    const [resultServicio] = await conexion.query(
      `
      INSERT INTO servicios (fk_idTipoServicio, fecha, fk_id_precio, fk_idAmbiente, fk_idMuestra, fk_idUsuarios) VALUES (?, ?, ?, ?, ?, ?)
    `,
      [
        fk_idTipoServicio,
        fecha || new Date(),
        fk_id_precio,
        fk_idAmbiente,
        fk_idMuestra,
        fk_idUsuarios,
      ]
    );

    console.log("Resultado de la inserción del servicio:", resultServicio);

    const id_servicios = resultServicio.insertId;
    console.log("ID del servicio recién insertado:", id_servicios);

    // Inserción de los valores de las variables
    for (const [idVariable, valor] of Object.entries(valoresVariables)) {
      console.log("Buscando detalle para la variable ID:", idVariable);

      // Buscar el detalle correspondiente para cada variable
      const [resultDetalle] = await conexion.query(
        `
        SELECT id_detalle FROM detalle WHERE fk_idVariable = ?
      `,
        [idVariable]
      );

      console.log("Resultado de la búsqueda de detalle:", resultDetalle);

      if (resultDetalle.length === 0) {
        console.log(
          "No se encontró el detalle para la variable con ID:",
          idVariable
        );
        return res.status(400).json({
          message: `No se encontró el detalle para la variable con ID ${idVariable}`,
        });
      }

      const idDetalle = resultDetalle[0].id_detalle;
      console.log("ID del detalle correspondiente:", idDetalle);

      await conexion.query(
        `
        INSERT INTO valor (fk_id_servicio, fk_id_detalle, valor)
        VALUES (?, ?, ?)
      `,
        [id_servicios, idDetalle, valor]
      );

      console.log('Valor insertado en la tabla "valor":', {
        fk_id_servicio: id_servicios,
        fk_id_detalle: idDetalle,
        valor,
      });
    }

    res.status(201).json({ message: "Servicio registrado exitosamente" });
  } catch (error) {
    console.error("Error al registrar el servicio:", error);
    res.status(500).json({ error: "Error al registrar el servicio" });
  }
};

// registra los datos al terminar el servicio
export const registroServicioTerminado = async (req, res) => {
  try {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json(error);
    }
    let id = req.params.id;
    let { cantidad_salida, fecha_fin } = req.body;
    console.log(cantidad_salida);

    let sql = `update servicios set cantidad_salida= ?, fecha_fin= ? where id_servicios = ?`;
    const [respuesta] = await conexion.query(sql, [
      cantidad_salida,
      fecha_fin || new Date(),
      id,
    ]);
    if (respuesta.affectedRows > 0) {
      let sqlObtenerMuestra = `select fk_idMuestra from servicios where id_servicios= ?`;
      const [respuestaOptenerMuestra] = await conexion.query(
        sqlObtenerMuestra,
        [id]
      );

      if (respuestaOptenerMuestra.length > 0) {
        let idDeMuestra = respuestaOptenerMuestra[0].fk_idMuestra;

        const cambioDeEstadoMuestra = `update muestra set estado='terminado' where id_muestra=?`;
        await conexion.query(cambioDeEstadoMuestra, [idDeMuestra]);
        return res.status(200).json({
          message:
            "Registro de término exitoso y estado de muestra actualizado",
        });
      } else {
        return res
          .status(404)
          .json({ message: "Muestra no encontrada para el servicio" });
      }
    } else {
      return res
        .status(404)
        .json({ message: "No se registro la terminacion del servicio" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor" + error.message });
  }
};

//lista los servicios en la tabla
export const listarServicios = async (req, res) => {
  try {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json(error);
    }
    let sql = `SELECT 
    s.id_servicios,
    ts.nombreServicio as tipo_servicio,
    DATE_FORMAT(s.fecha, '%Y-%m-%d') AS fecha,
    p.presentacion,
    a.nombre_ambiente,
    m.codigo_muestra,
    CONCAT(u.nombre, ' ', u.apellidos) AS nombre_completo_usuario,
    r.rol AS rol_usuario,
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
    muestra m ON s.fk_idMuestra = m.id_muestra
JOIN 
    usuarios u ON s.fk_idUsuarios = u.id_usuario
JOIN 
    rol r ON u.fk_idRol = r.idRol
    ORDER BY 
    s.id_servicios ASC`;

    const [resultado] = await conexion.query(sql);
    if (resultado.length > 0) {
      res.status(200).json(resultado);
    } else {
      res.status(404).json({ message: "Datos no encontrados" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor " + error.message });
  }
};

//
export const listarServiciosId = async (req, res) => {
  try {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json(error);
    }
    let id = req.params.id;
    let sql = `SELECT * FROM servicios WHERE id_servicios = ?`;
    const [respuesta] = await conexion.query(sql, [id]);
    if (respuesta.length === 1) {
      res.status(200).json(respuesta);
    } else {
      res.status(404).json({ message: "El dato no existe" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor " + error.message });
  }
};

//actualiza un servicio con sus valores
export const editarValoresPorServicio = async (req, res) => {
  try {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json(error);
    }
    const { id_servicios, valoresVariables } = req.body;

    // Verificación de campos obligatorios
    if (!id_servicios || !valoresVariables) {
      console.log("Faltan datos obligatorios: id_servicios o valoresVariables");
      return res.status(400).json({
        message: "Faltan datos obligatorios: id_servicios o valoresVariables",
      });
    }

    // Verificar si existe el servicio
    const [servicioExistente] = await conexion.query(
      `
      SELECT * FROM servicios WHERE id_servicios = ?
    `,
      [id_servicios]
    );

    if (servicioExistente.length === 0) {
      console.log("No se encontró el servicio con ID:", id_servicios);
      return res.status(404).json({ message: "No se encontró el servicio" });
    }

    // Verificar si `cantidad_salida` y `fecha_fin` no son nulos
    const { cantidad_salida, fecha_fin } = servicioExistente[0];
    if (cantidad_salida === null || fecha_fin === null) {
      console.log(
        "El servicio tiene campos nulos en cantidad_salida o fecha_fin"
      );
      return res.status(400).json({
        message: "No se puede editar. El servicio no ha terminado su proceso.",
      });
    }

    // Verificar si la edición se está intentando hacer dentro de los 15 días posteriores a la `fecha_fin`
    const fechaFinServicio = new Date(fecha_fin);
    const fechaActual = new Date();

    // Calcular la diferencia en días entre la fecha actual y la `fecha_fin`
    const diferenciaDias = Math.floor(
      (fechaActual - fechaFinServicio) / (1000 * 60 * 60 * 24)
    );

    if (diferenciaDias > 15) {
      console.log(
        "No se puede editar el servicio después de 15 días de la fecha_fin"
      );
      return res.status(400).json({
        message:
          "No se puede editar el servicio después de 15 días de la fecha de finalización.",
      });
    }

    // Iterar sobre los valores de las variables y actualizar la tabla "valor"
    for (const [idVariable, nuevoValor] of Object.entries(valoresVariables)) {
      console.log("Buscando detalle para la variable ID:", idVariable);

      // Buscar el detalle correspondiente para cada variable
      const [resultDetalle] = await conexion.query(
        `
        SELECT id_detalle FROM detalle WHERE fk_idVariable = ?
      `,
        [idVariable]
      );

      if (resultDetalle.length === 0) {
        console.log(
          "No se encontró el detalle para la variable con ID:",
          idVariable
        );
        return res.status(400).json({
          message: `No se encontró el detalle para la variable con ID ${idVariable}`,
        });
      }

      const idDetalle = resultDetalle[0].id_detalle;

      // Actualiza el valor en la tabla "valor" para el servicio y detalle correspondientes
      const [resultValor] = await conexion.query(
        `
        UPDATE valor
        SET valor = ?
        WHERE fk_id_servicio = ? AND fk_id_detalle = ?
      `,
        [nuevoValor, id_servicios, idDetalle]
      );

      console.log('Valor actualizado en la tabla "valor":', {
        fk_id_servicio: id_servicios,
        fk_id_detalle: idDetalle,
        valor: nuevoValor,
      });
    }

    res.status(200).json({
      message: "Valores de variables actualizados exitosamente",
    });
  } catch (error) {
    console.error("Error al editar los valores de las variables:", error);
    res
      .status(500)
      .json({ error: "Error al editar los valores de las variables" });
  }
};

//registra los datos de porque se hizo la edicion del servicio en la tabla cambios
export const registrarCambio = async (req, res) => {
  try {
    const { descripcion, fk_id_servicio, fk_id_usuario } = req.body;

    console.log("Datos recibidos en el controlador para registrar cambio:", {
      descripcion,
      fk_id_servicio,
      fk_id_usuario,
    });

    // Verificación de campos obligatorios
    if (!descripcion || !fk_id_servicio || !fk_id_usuario) {
      console.log("Campos obligatorios faltantes");
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    // Obtención de la fecha actual en el formato correcto
    const fechaActual = new Date().toISOString().slice(0, 19).replace("T", " ");

    // Registro del cambio
    const [resultCambio] = await conexion.query(
      `
      INSERT INTO cambios (descripcion, fecha, fk_id_servicio, fk_id_usuario) 
      VALUES (?, ?, ?, ?)
    `,
      [descripcion, fechaActual, fk_id_servicio, fk_id_usuario]
    );

    console.log("Resultado de la inserción del cambio:", resultCambio);

    res.status(201).json({ message: "Cambio registrado exitosamente" });
  } catch (error) {
    console.error("Error al registrar el cambio:", error);
    res.status(500).json({ error: "Error al registrar el cambio" });
  }
};

export const eliminarServicios = async (req, res) => {
  try {
    let id = req.params.id;
    let sql = `DELETE FROM servicios WHERE id_servicios = ?`;
    const [respuesta] = await conexion.query(sql, [id]);
    if (respuesta.affectedRows === 1) {
      res.status(200).json({ message: "Datos eliminados con éxito" });
    } else {
      res.status(404).json({ message: "Error al eliminar datos" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor " + error.message });
  }
};

//actualiza el estado del servicio
export const actualizarEstadoServicio = async (req, res) => {
  try {
    let { estado } = req.body;

    let id_servicios = req.params.id;

    let sql = `update servicios set estado=? where id_servicios=?`;
    const [respuesta] = await conexion.query(sql, [estado, id_servicios]);
    if (respuesta.affectedRows > 0) {
      res.status(200).json({ message: "Estado Actualizado correctamente" });
    } else {
      res.status(404).json({ message: "Estado no actualizado" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error en la conexion" + error.message });
  }
};

//lista los servicios con sus respectivas variables y valores
export const getValoresDeVariablesPorIDServicio = async (req, res) => {
  try {
    let { id_servicios } = req.body;

    // Verifica si id_servicios está presente
    if (!id_servicios) {
      return res.status(400).json({ message: "El id_servicios es requerido" });
    }

    // Consulta para obtener los valores de las variables relacionadas con el servicio
    const sqlGetValores = `
      SELECT 
        s.id_servicios,
        ts. nombreServicio,
        DATE_FORMAT(s.fecha, '%Y-%m-%d') AS fecha,
        p.presentacion as precio,
        a.nombre_ambiente as ambiente,
        CONCAT(u.nombre, ' ', u.apellidos) AS responsable,
        s. cantidad_salida,
        s.estado,
        v.valor,
        d.id_detalle,
        d.fk_idVariable,
        var.nombre AS variable_nombre
      FROM 
        servicios s
      JOIN 
        valor v ON s.id_servicios = v.fk_id_servicio
      JOIN
        tiposervicio ts ON s.fk_idTipoServicio = idTipoServicio
      JOIN
        precio p ON s.fk_id_precio = p.idPrecio
      JOIN
        ambiente a ON s.fk_idAmbiente = a.idAmbiente
      JOIN
        usuarios u ON s.fk_idUsuarios = u.id_usuario
      JOIN 
        detalle d ON v.fk_id_detalle = d.id_detalle
      JOIN 
        variables var ON d.fk_idVariable = var.idVariable
      WHERE 
        s.id_servicios = ?`;

    const [valores] = await conexion.query(sqlGetValores, [id_servicios]);

    if (valores.length > 0) {
      return res.status(200).json(valores);
    } else {
      return res.status(404).json({
        message: "No se encontraron valores para el id_servicios proporcionado",
      });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Error en el servidor: ${error.message}` });
  }
};

export const getCambios = async (req, res) => {
  try {
    let sql = `
      SELECT 
        c.id_cambio, 
        c.descripcion,
        DATE_FORMAT(c.fecha, '%Y-%m-%d') AS fecha,
        c.fk_id_servicio,
        u.nombre AS nombre_usuario,
        r.rol AS rol_usuario,
        m.codigo_muestra
      FROM 
        cambios c
      JOIN 
        servicios s ON c.fk_id_servicio = s.id_servicios
      JOIN 
        muestra m ON s.fk_idMuestra = m.id_muestra
      JOIN 
        usuarios u ON c.fk_id_usuario = u.id_usuario
      JOIN 
        rol r ON u.fk_idRol = r.idRol
    `;

    // Espera la respuesta de la consulta
    const [respuesta] = await conexion.query(sql);

    if (respuesta.length > 0) {
      return res.status(200).json(respuesta);
    } else {
      return res.status(404).json({ message: "No se encontraron cambios" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error en el servidor: " + error.message });
  }
};

export const obtenerDatosDeMuestraSegunServicio = async (req, res) => {
  try {
    let id = req.params.id;

    let sql = `SELECT 
    m.* 
FROM 
    servicios s
JOIN 
    muestra m ON s.fk_idMuestra = m.id_muestra
WHERE 
    s.id_servicios = ?`;
    const [resultado] = await conexion.query(sql, [id]);
    if (resultado.length > 0) {
      res.status(200).json(resultado);
    } else {
      res.status(404).json({ message: "Muestra no encontrada" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor: " + error.message });
  }
};
