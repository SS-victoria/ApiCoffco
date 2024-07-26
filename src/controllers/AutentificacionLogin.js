import { conexion } from "../database/conexion.js";
import { validationResult } from "express-validator";
import bcryptjs from "bcryptjs";

import jwt from "jsonwebtoken";

export const validarToken = async (req, res, next) => {
  let token_user = req.headers["token"];
  if (!token_user) {
    res.status(402).json({ mensaje: "se requiere un token" });
  } else {
    const decode = jwt.verify(
      token_user,
      process.env.SECRET,
      (Error, decode) => {
        if (Error) {
          res.status(401).json({ mensaje: "token invalido" });
        } else {
          next();
        }
      }
    );
  }
};

export const validarUsuarios = async (req, res) => {
  try {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json(error);
    }
    let { id: numero_documento, password } = req.body;
    console.log("", numero_documento, password);

    // Consulta para obtener el hash de la contraseña del usuario desde la base de datos
    let sql = `SELECT numero_documento, rol_usuario, password FROM usuarios WHERE numero_documento='${numero_documento}'`;
    const [resultado] = await conexion.query(sql);

    if (resultado.length > 0) {
      const user = resultado[0];
      const storedPasswordHash = user.password;

      // Comparación de la contraseña proporcionada con el hash almacenado en la base de datos
      const passwordMatch = await bcryptjs.compare(
        password,
        storedPasswordHash
      );

      if (passwordMatch) {
        // Contraseña válida: se genera un token de autenticación
        let token = jwt.sign({ user: resultado }, process.env.SECRET, {
          expiresIn: process.env.TIME,
        });
        return res.status(200).json({
          user: { nombre: user.nombre, rol_usuario: user.rol_usuario },
          token,
          message: "Usuario autorizado",
        });
      } else {
        // Contraseña no válida
        return res.status(401).json({ message: "Contraseña incorrecta" });
      }
    } else {
      // No se encontró un usuario con el correo proporcionado
      return res.status(404).json({
        message: "Contraseña o Numero de Indentificacion incorrectos",
      });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error en el servidor" + error.message });
  }
};
