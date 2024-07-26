import { check } from "express-validator";

export const validateServicios = [
    check('tipo_servicios', 'El tipo de servicio es obligatorio').not().isEmpty(),
    check('fk_id_muestra', 'La muestra es obligatoria y debe ser numérica').not().isEmpty().isNumeric(),
    check('fk_formato', 'El formato es obligatorio y debe ser numérico').not().isEmpty().isNumeric()
];
