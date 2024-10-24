import { conexion } from "../database/conexion.js";
import { validationResult } from "express-validator";

export const Reportes = async (req, res) => {
    const {muestra, TipoServicio}= req.body;
    console.log(req.body)
    try {
        const error = validationResult(req);
        if (!error.isEmpty()) {
          return res.status(400).json(error);
        }
        let sql = `SELECT 
    ts.nombreServicio,
    d.nombre AS nombre_documento,
    d.codigo_documentos,
    v.version,
    DATE_FORMAT(v.fecha_version, '%Y-%m-%d') AS fecha_version,
    m.codigo_muestra,
    CONCAT(u.nombre, ' ', u.apellidos) AS nombre_usuario,
    mun.nombre_municipio AS municipio,
    f.nombre_finca AS nombre_finca,
    m.codigoExterno AS codigo_externo,
    m.altura AS altura,  -- Agregamos altura
    m.variedad AS variedad,  -- Agregamos variedad
    m.observaciones AS observaciones, 
    DATE_FORMAT(s.fecha, '%Y-%m-%d') AS fecha_servicio,
    s.cantidad_salida,  -- Agregamos la cantidad de salida
    GROUP_CONCAT(DISTINCT l.ruta SEPARATOR ', ') AS logo_ruta,  -- Uso de DISTINCT aquí
    GROUP_CONCAT(DISTINCT CONCAT(var.nombre, ': ', val.valor) SEPARATOR ', ') AS variables  -- Uso de DISTINCT aquí también
FROM 
    servicios s
    JOIN tiposervicio ts ON s.fk_idTipoServicio = ts.idTipoServicio
    JOIN muestra m ON s.fk_idMuestra = m.id_muestra
    JOIN usuarios u ON m.fk_id_usuarios = u.id_usuario
    LEFT JOIN finca f ON m.fk_id_finca = f.id_finca
    LEFT JOIN municipio mun ON f.fk_id_municipio = mun.id_municipio
    JOIN documentos d ON ts.idTipoServicio = d.fk_idTipoServicio
    JOIN versiones v ON d.id_documentos = v.fk_documentos
    LEFT JOIN logo_documento ld ON d.id_documentos = ld.documentos_iddocumentos
    LEFT JOIN logos l ON ld.logo_idlogos = l.idLogos
    LEFT JOIN valor val ON s.id_servicios = val.fk_id_servicio
    LEFT JOIN detalle det ON val.fk_id_detalle = det.id_detalle
    LEFT JOIN variables var ON det.fk_idVariable = var.idVariable
WHERE 
    m.codigo_muestra = "${muestra}" 
    AND v.estado = 'activo'
    AND ts.idTipoServicio = ${TipoServicio} 
GROUP BY 
    s.id_servicios, ts.nombreServicio, d.nombre, d.codigo_documentos, 
    v.version, v.fecha_version, m.codigo_muestra, u.nombre, u.apellidos, 
    mun.nombre_municipio, f.nombre_finca, m.codigoExterno, m.altura, 
    m.variedad, m.observaciones, s.fecha, s.cantidad_salida; `

        const [rows] = await conexion.query(sql);
        
  
        if (rows.length > 0) {
            return res.status(200).json(rows); 
        } else {
            return res.status(404).json({ message: "No se encontraron resultados" }); 
        }
       
    } catch (error) {
        res.status(500).json({ message: "error", error });
    }
};

