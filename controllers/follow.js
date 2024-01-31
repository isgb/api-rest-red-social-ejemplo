// Importar modelo
const Follow = require('../models/follow');
const User = require("../models/user");

// Acciones de prueba
const pruebaFollow = (req,res) => {
    return res.status(200).send({
        message: "Mensaje enviado desde: controllers/follow.js"
    });
}

// Accion de guardar un follow (accion seguir)

// Accion de borrar un follow (accion dejar de seguir)

// Acción listado de usuarios que estoy siguiendo

//Exportar acciones
module.exports = {
    pruebaFollow
}