import { Router } from "express";
import { listarLogos, actualizarLogo, buscarLogo, eliminarLogo, registrarLogo, estadoLogo } from "../controllers/logoController.js";
import { validarToken } from "../controllers/AutentificacionLogin.js";
import { subirLogos } from "../controllers/SubirLogosController.js";
import { logoValidate } from "../../validation/logoValidation.js";

const logoRouter = Router()

logoRouter.get('/listar', listarLogos)
logoRouter.post('/registrar', subirLogos, logoValidate, registrarLogo)
// logoRouter.post('/registrar', registrarLogo)
logoRouter.delete('/eliminar/:id', validarToken, eliminarLogo)
// logoRouter.put('/actualizar/:id', validarToken, subirArchivos, logoValidate, actualizarLogo)
logoRouter.put('/actualizar/:id', subirLogos, logoValidate, actualizarLogo)
logoRouter.put('/estado/:id', estadoLogo)
logoRouter.get('/listarid/:id', validarToken, buscarLogo)

export default logoRouter