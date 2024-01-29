// Importar dependencias y modulos
const bcrypt = require("bcrypt");
const mongoosePagination = require("mongoose-pagination")
const User = require("../models/user");
const jwt = require('../services/jwt')
const { param } = require("../routes/user");

// Acciones de prueba
const pruebaUser = (req, res) => {
  return res.status(200).send({
    message: "Mensaje enviado desde: controllers/user.js",
    usuario: req.user
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
      const token = jwt.createToken(user);

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

const profile = async(req,res) => {
    // Recibir el parametro del id de usuario por la url
    const id = req.params.id;

    // Consulta para sacar los datos del usuario
   await User.findById(id)
    .select({password:0, role: 0})
    .then(async (userProfile) => {
        
        if (!userProfile) {
          return res.status(404).send({
            status: "error",
            message: "No existe el usuario o hay un error",
          });
        }

        // Devolver el resultado
        // Posteriormente: devolver informacion de follows
        return res.status(200).send({
            status: "success",
            user: userProfile
          });
  
      })
      .catch((error) => {
        // si llega un error
        if (error)
          return res.status(404).send({
            status: "error",
            message: "No existe el usuario",
          });
      });
}

const list = async(req, res) => {
  //  controlar en q pagina estamos
  let page = parseInt(req.params.page) || 1;

  //  consulta con mongoose pagination
  // limitar usuarios por pagina
  let itemsPerPage = 5;

  // opciones de la paginacion
  const options = {
      page: page,
      limit: itemsPerPage,
      sort: { _id: -1 },
      collation: {
          locale: "es",
      },
      
  };    

  try {
      // obtenes los usuarios
      const users = await User.paginate({}, options);

      // ontenes el numero total de usuarios
      const total = await User.countDocuments();

      // si no existe un usuario devolvermos el error
      if (!users)
          return res.status(404).json({
              status: "Error",
              message: "No se han encontrado usuarios",
          });

      // devolver el resultado si todo a salido bien
      return res.status(200).send({
          status: "success",
          users: users.docs,
          page,
          itemsPerPage,
          total,
          // redondeamos con ceil el numero de paginas con usuarios a mostrar
          pages: Math.ceil(total / itemsPerPage)
      });

  } catch (error) {
      return res.status(404).json({
          status: "Error",
          message: "Hubo un error al obtener los usuarios",
          error: error.message,
      });
  }
}

module.exports = {
  pruebaUser,
  register,
  login,
  profile,
  list
};
