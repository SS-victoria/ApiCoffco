import { conexion } from "../database/conexion.js"
import { validationResult } from "express-validator"

export const listarfincas = async (req, res) => {
    try{
        const error = validationResult(req);
        if (!error.isEmpty()) {
          return res.status(400).json(error);
        }
        let sql = 'select * from finca'
        const [result] = await conexion.query(sql)
        console.log(result.length)
        if(result.length > 0){res.status(200).json(result)}
        else res.status(404).json({"message" : "No se encontraron fincas en la base de datos"})
    }
    catch(err){
        res.status(500).json({"message" : "Error en el controlador FincaController.js " + err})
    }
}

export const registrarFincas = async (req, res) => {
    try {
        const error = validationResult(req);
        if (!error.isEmpty()) {
            return res.status(400).json(error);
        }

        let { nombre_finca, vereda, fk_id_municipio } = req.body;

        // Verificar si el nombre de la finca ya existe
        let sqlCheck = 'SELECT * FROM finca WHERE nombre_finca = ?';
        const [existingFinca] = await conexion.query(sqlCheck, [nombre_finca]);

        if (existingFinca.length > 0) {
            return res.status(400).json({ "message": "El nombre de la finca ya existe." });
        }

        // Insertar nueva finca
        let sql = `INSERT INTO finca (nombre_finca, vereda, fk_id_municipio) VALUES (?, ?, ?)`;
        const [rows] = await conexion.query(sql, [nombre_finca, vereda, fk_id_municipio]);

        if (rows.affectedRows > 0) {
            return res.status(200).json({ "message": "Se registró con éxito la finca" });
        } else {
            return res.status(404).json({ "message": "No se registró la finca." });
        }
    } catch (e) {
        return res.status(500).json({ "message": "Error: " + e.message });
    }
};



export const actualizarFincas = async (req, res) => {
    try {
        const error = validationResult(req);
        if (!error.isEmpty()) {
          return res.status(400).json(error);
        }
        let id_finca = req.params.id_finca;
        let { nombre_finca, vereda, fk_id_municipio } = req.body;

        // Verificar si el nombre de la finca ya existe en otra finca (excepto la actual)
        let sqlCheck = 'SELECT * FROM finca WHERE nombre_finca = ? AND id_finca != ?';
        const [existingFinca] = await conexion.query(sqlCheck, [nombre_finca, id_finca]);

        if (existingFinca.length > 0) {
            return res.status(400).json({ "message": "El nombre de la finca ya existe." });
        }

        // Actualizar finca
        let sql = `UPDATE finca SET nombre_finca = ?, vereda = ?, fk_id_municipio = ? WHERE id_finca = ?`;
        const [rows] = await conexion.query(sql, [nombre_finca, vereda, fk_id_municipio, id_finca]);

        if (rows.affectedRows > 0) {
            return res.status(200).json({ "message": "Se actualizó con éxito la finca" });
        } else {
            return res.status(404).json({ "message": "No se actualizó la finca." });
        }
    } catch (e) {
        return res.status(500).json({ "message": "Error: " + e.message });
    }
};


export const ListaridFincas=async(req,res)=>{
    try {
        const error = validationResult(req);
        if (!error.isEmpty()) {
          return res.status(400).json(error);
        }
        let id_finca=req.params.id_finca
        let sql=`select * from finca where id_finca=${id_finca}`
        const [responde]= await conexion.query(sql)
        if(responde.length == 1){
            res.status(200).json(responde)
        }
        else{
            res.status(500).json({"message":"dato no encontrado"})
        }
        
    } catch (error) {
        res.status(500).json({"menssage":"error en la conexion"+error.menssage})
    }
    }


    export const eliminarfincas = async (req, res) => {
        try {
            const error = validationResult(req);
            if (!error.isEmpty()) {
              return res.status(400).json(error);
            }
            let id_finca = req.params.id_finca
    
            let sql = `delete from finca where id_finca = ${id_finca}`
    
            const [rows] = await conexion.query(sql)
            if(rows.affectedRows > 0){
                return res.status(200).json({"message":"Se eliminó con éxito la finca"})
            }
            else {
                return res.status(404).json({"message":"No se eliminó la finca."})
            }
        }
        catch(e){
            return res.status(500).json({"message":"error "+e.message})
        }
    }