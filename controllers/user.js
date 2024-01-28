// Importar dependencias y modulos
const bcrypt = require("bcrypt")
const User = require("../models/user");

// Acciones de prueba
const pruebaUser = (req, res) => {
  return res.status(200).send({
    message: "Mensaje enviado desde: controllers/user.js",
  });
};

// Registro de usuarios
const register =  (req, res) => {
  // Recoger datos de la peticion
  let params = req.body;

  // Comprobar que me llegan bien (+ validacion)
  if (!params.name || !params.email || !params.password || !params.nick) {
    return res.status(400).json({
        status: "error",
        message: "Faltan datos por enviar",
    });
  }

    // Crear objeto de usuario
    let user_to_save = new User(params)

    // control de usuarios duplicados
    User.find({
        $or: [
            { email: user_to_save.email.toLowerCase() },
            { nick: user_to_save.nick.toLowerCase() },
        ]
 
    }).then((users) => {       
        // si existe un usuario con el mismo nick o email
        if (users && users.length >= 1) {
            return res.status(200).send({
                status: "success",
                message: "El usuario ya existe",
            });
        }
 
        // cifrar la contraseña        
 
        // guardar usuario bd
 
        // devolver resultado
        return res.status(200).json({
            status: "success",
            message: "Accion de registro de usuarios",
            // params,
            user_to_save,
        });
 
    }).catch((error) => {
        // si llega un error
        if (error)
            return res.status(500).json({
                status: "error",
                message: "Error en la consulta de usuarios",
            });
    });

};

module.exports = {
  pruebaUser,
  register,
};
