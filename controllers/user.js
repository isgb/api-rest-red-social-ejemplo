// Acciones de prueba
const pruebaUser = (req,res) => {
    return res.status(200).send({
        message: "Mensaje enviado desde: controllers/user.js"
    });
}

// Registro de usuarios
const register = (req,res) =>{
    // Recoger datos de la peticion

    // Comprobar que me llegan bien (+ validacion)

    // Control de usuarios duplicados

    // Cifrar la contraseña

    // Guardar usuario en la BD

    // Devolver resultado
    return res.status(200).json({
        message: "Metodo de accion de registro de usuarios"
    })
}

module.exports = {
    pruebaUser,
    register
}