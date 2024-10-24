import { conexion } from "../database/conexion.js"
import { validationResult } from "express-validator"

// Registrar Servicio Detalle
export const registrartiposervicio = async (req, res) => {
    try {
        // Validar los datos
        const error = validationResult(req);
        if (!error.isEmpty()) {
          return res.status(400).json(error);
        }
        // Obtener el nombre del servicio del cuerpo de la solicitud
        const { nombreServicio, codigoTipoServicio } = req.body;

        // Definir la consulta SQL para insertar el nuevo servicio
        const sql = `INSERT INTO tiposervicio (nombreServicio, codigoTipoServicio) VALUES (?, ?)`;

        // Ejecutar la consulta
        const [result] = await conexion.query(sql, [nombreServicio, codigoTipoServicio]);

        // Verificar el resultado de la consulta
        if (result.affectedRows > 0) {
            res.status(200).json({ message: 'Registrado con éxito' });
        } else {
            res.status(404).json({ message: 'No se registró' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor: ' + error.message });
    }
};

// Listar Todos los Servicios Detalle
export const listartiposervicio = async (req, res) => {
    try {
        const error = validationResult(req);
        if (!error.isEmpty()) {
          return res.status(400).json(error);
        }
        const sql = `SELECT * FROM tiposervicio `;
        const [result] = await conexion.query(sql);

        if (result.length > 0) {
            res.status(200).json(result);
        } else {
            res.status(404).json({ message: 'Datos no encontrados' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor: ' + error.message });
    }
}

// Listar Servicio Detalle por ID
export const listartiposervicioId = async (req, res) => {
    try {
        const error = validationResult(req);
        if (!error.isEmpty()) {
          return res.status(400).json(error);
        }
        const id = req.params.id;
        const sql = `SELECT * FROM tiposervicio WHERE idTipoServicio = ?`;
        const [result] = await conexion.query(sql, [id]);

        if (result.length === 1) {
            res.status(200).json(result);
        } else {
            res.status(404).json({ message: 'El dato no existe' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor: ' + error.message });
    }
}

// Actualizar Servicio Detalle
export const actualizartiposervicio = async (req, res) => {
    try {
        const error = validationResult(req);
        if (!error.isEmpty()) {
          return res.status(400).json(error);
        }
        const { nombreServicio, codigoTipoServicio } = req.body;
        const id = req.params.id;

        console.log(`Actualizando tipo de servicio con ID: ${id}, nombre: ${nombreServicio} y código: ${codigoTipoServicio}`);

        // Consulta SQL para actualizar el tipo de servicio
        const sql = `UPDATE tiposervicio SET nombreServicio = ?, codigoTipoServicio = ? WHERE idTipoServicio = ?`;

        // Ejecutar la consulta
        const [result] = await conexion.query(sql, [nombreServicio, codigoTipoServicio, id]);

        // Verificar el resultado de la consulta
        if (result.affectedRows > 0) {
            res.status(200).json({ message: 'Datos actualizados con éxito' });
        } else {
            res.status(404).json({ message: 'Datos no actualizados. Verifica si el ID existe.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor: ' + error.message });
    }
};

// Eliminar Servicio Detalle
export const eliminartiposervicio = async (req, res) => {
    try {
        const error = validationResult(req);
        if (!error.isEmpty()) {
          return res.status(400).json(error);
        }
        const id = req.params.id;
        const sql = `DELETE FROM tiposervicio WHERE idTipoServicio = ?`;
        const [result] = await conexion.query(sql, [id]);

        if (result.affectedRows === 1) {
            res.status(200).json({ message: 'Datos eliminados con éxito' });
        } else {
            res.status(404).json({ message: 'Error al eliminar datos' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor: ' + error.message });
    }
}


// Actualizar Estado de Servicio Detalle
export const actualizarestadoservicio = async (req, res) => {
    try {
        const error = validationResult(req);
        if (!error.isEmpty()) {
          return res.status(400).json(error);
        }
        const { estado } = req.body;
        const id = req.params.id;

        // Validar que el estado proporcionado sea válido
        const estadosValidos = ['activo', 'inactivo'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ message: 'Estado no válido. Debe ser "activo" o "inactivo".' });
        }

        console.log(`Actualizando estado de tipo de servicio con ID: ${id} a: ${estado}`);

        // Consulta SQL para actualizar el estado del tipo de servicio
        const sql = `UPDATE tiposervicio SET estado = ? WHERE idTipoServicio = ?`;

        // Ejecutar la consulta
        const [result] = await conexion.query(sql, [estado, id]);

        // Verificar el resultado de la consulta
        if (result.affectedRows > 0) {
            res.status(200).json({ message: 'Estado actualizado con éxito' });
        } else {
            res.status(404).json({ message: 'Datos no actualizados. Verifica si el ID existe.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor: ' + error.message });
    }
};
export const ValidarServiciodeDocumento = async (req, res) => {
    try {
        const error = validationResult(req);
        if (!error.isEmpty()) {
          return res.status(400).json(error);
        }
        const { idTipoServicio } = req.body;
        let sql = `
           SELECT 
    COUNT(*) AS documentos_activos,
    ts.nombreServicio
FROM 
    versiones v
INNER JOIN 
    documentos d ON v.fk_documentos = d.id_documentos
INNER JOIN 
    tiposervicio ts ON d.fk_idTipoServicio = ts.idTipoServicio
WHERE 
    v.estado = 'activo'
AND 
    d.fk_idTipoServicio = ${idTipoServicio}
        `;

        const [rows] = await conexion.query(sql);
        console.log(rows);

        if (rows.length > 0 && rows[0].documentos_activos > 0) {
            return res.status(200).json({ message: `Ya existe un documento activo asociado a este ${rows[0].nombreServicio}` });
        }

        return res.status(200).json({ message: true });

    } catch (error) {
        return res.status(500).json({ message: 'Error en el servidor: ' + error.message });
    }

}
export const listartiposervcioActivo = async (req, res) => {
    try {
        const error = validationResult(req);
        if (!error.isEmpty()) {
          return res.status(400).json(error);
        }
        const sql = `SELECT * FROM tiposervicio where estado = 'activo' `;
        const [result] = await conexion.query(sql);

        if (result.length > 0) {
            res.status(200).json(result);
        } else {
            res.status(404).json({ message: 'Datos no encontrados' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor: ' + error.message });
    }
}



// Listar Tipos de Servicio con Documento Activo
export const listarTiposServicioConDocumentoActivo = async (req, res) => {
    try {
        const error = validationResult(req);
        if (!error.isEmpty()) {
          return res.status(400).json(error);
        }
        // Consulta SQL que selecciona los tipos de servicio con al menos un documento activo
        const sql = `
            SELECT DISTINCT ts.idTipoServicio,  ts.nombreServicio
            FROM tiposervicio ts
            JOIN documentos d ON ts.idTipoServicio = d.fk_idTipoServicio
            JOIN versiones v ON d.id_documentos = v.fk_documentos
            WHERE v.estado = 'activo'
        `;

        // Ejecutar la consulta
        const [result] = await conexion.query(sql);

        // Comprobar si se encontraron resultados
        if (result.length > 0) {
            res.status(200).json(result);  // Enviar los datos en formato JSON
        } else {
            res.status(404).json({ message: 'No se encontraron tipos de servicio con documentos activos' });
        }
    } catch (error) {
        // Captura cualquier error y envía una respuesta con un mensaje
        res.status(500).json({ message: 'Error en el servidor: ' + error.message });
    }
};
