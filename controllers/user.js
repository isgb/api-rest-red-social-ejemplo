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

    // control de usuarios duplicados
    User.find({
        $or: [
            { email: params.email.toLowerCase() },
            { nick: params.nick.toLowerCase() },
        ]
 
    }).then(async (users) => {       
        // si existe un usuario con el mismo nick o email
        if (users && users.length >= 1) {
            return res.status(200).send({
                status: "success",
                message: "El usuario ya existe",
            });
        }
 
        // cifrar la contraseña
        let pwd = await bcrypt.hash(params.password, 10);
        // console.log(pwd)
        params.password = pwd;

         // Crear objeto de usuario
        let user_to_save = new User(params)
 
        // guardar usuario bd
        user_to_save.save()
        .then((userStored) => {
            
            if(userStored){
                // devolver resultado
                return res.status(200).json({
                    status: "success",
                    message: "Usuario registrado correctamente",
                    // params,
                    user:userStored,
                });
            }
        })
        .catch((error) => {
            // si llega un error
            if (error)
                return res.status(500).json({
                    status: "error",
                    message: "Error al guardar el usuario",
                });
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
