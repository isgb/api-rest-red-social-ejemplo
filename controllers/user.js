// Importar dependencias y modulos
const bcrypt = require("bcrypt");
const User = require("../models/user");
const { param } = require("../routes/user");

// Acciones de prueba
const pruebaUser = (req, res) => {
  return res.status(200).send({
    message: "Mensaje enviado desde: controllers/user.js",
  });
};

// Registro de usuarios
const register = (req, res) => {
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
    ],
  })
    .then(async (users) => {
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
      let user_to_save = new User(params);

      // guardar usuario bd
      user_to_save
        .save()
        .then((userStored) => {
          if (userStored) {
            // devolver resultado
            return res.status(200).json({
              status: "success",
              message: "Usuario registrado correctamente",
              // params,
              user: userStored,
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
    })
    .catch((error) => {
      // si llega un error
      if (error)
        return res.status(500).json({
          status: "error",
          message: "Error en la consulta de usuarios",
        });
    });
};

const login = (req, res) => {
  // Recoger parametros body
  let params = req.body;

  if (!params.email || !params.password) {
    return res.status(400).send({
      status: "error",
      message: "Faltan datos por enviar",
    });
  }

  // Buscar en la bbdd si existe
  User.findOne({ email: params.email })
    // .select({ "password": 0 })
    .then(async (user) => {
        
      if (!user) {
        return res.status(404).send({
          status: "success",
          message: "No existe el usuario",
        });
      }

      // Comprobar la contraseña
      let pwd = bcrypt.compareSync(params.password, user.password)

      if(!pwd){
        return res.status(400).send({
            status: "error",
            message: "No te has identificado correctamente"
        })
      }

      // Devolver Token
      const token = false;

      // Devolver Datos del usuario
      return res.status(200).send({
        status: "success",
        message: "Te has identificado correctamente",
        user:{
            id: user._id,
            name: user.name,
            nick: user.nick
        },
        token
      });
    })
    .catch((error) => {
      // si llega un error
      if (error)
        return res.status(404).json({
          status: "error",
          message: "No existe el usuario",
        });
    });
};

module.exports = {
  pruebaUser,
  register,
  login,
};
