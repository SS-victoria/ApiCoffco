import { conexion } from "../database/conexion.js";
import { validationResult } from "express-validator"
export const Estadistica = async (req, res) => {


    try {
        const error = validationResult(req);
        if (!error.isEmpty()) {
            return res.status(400).json(error);
        }

        let sql = `
         SELECT 
    ts.nombreServicio,
    COUNT(s.id_servicios) AS cantidad_uso,
    (SELECT COUNT(*) FROM servicios) AS total_servicios
FROM 
    servicios s
JOIN 
    tiposervicio ts ON s.fk_idTipoServicio = ts.idTipoServicio
GROUP BY 
    ts.nombreServicio
ORDER BY 
    cantidad_uso DESC;

        `;
        const [resultado] = await conexion.query(sql);
        if (resultado.length > 0) {
            res.status(200).json(resultado);
        }
        else {
            res.status(404).json({ message: "No se encontraron datos" });
        }
    }
    catch (error) {
        res.status(500).json({ message: "Error en la conexion" + error.message });
    }
}

export const EstadisticasAlquiler = async (req, res) => {
    try {
        const error = validationResult(req);
        if (!error.isEmpty()) {
          return res.status(400).json(error);
        }
        let slq = `SELECT 
    DATE_FORMAT(fecha, '%Y-%m') AS fecha, 
    COUNT(*) AS cantidad_servicios
FROM 
    servicios
WHERE 
    fk_idTipoServicio = 4
    AND fecha BETWEEN CURDATE() - INTERVAL 4 MONTH AND CURDATE() + INTERVAL 4 MONTH
GROUP BY 
    DATE_FORMAT(fecha, '%Y-%m')  
ORDER BY 
    fecha;



`
        const [resultados] = await conexion.query(slq);
        if (resultados.length > 0) {
            return res.status(200).json(resultados);
        }

        return res.status(404).json({ message: "No se encontraron datos" });

    } catch (error) {
        return res.status(500).json({ message: error });

    }
}