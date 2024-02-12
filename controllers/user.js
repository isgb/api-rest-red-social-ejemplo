// Importar dependencias y modulos
const bcrypt = require("bcrypt");
const mongoosePagination = require("mongoose-pagination");
const User = require("../models/user");
const jwt = require("../services/jwt");
const followService = require("../services/followService");
const { param } = require("../routes/user");
const fs = require("fs");
const path = require("path");
const Publication = require("../models/publication");
const validate = require("../helpers/validate");

// Acciones de prueba
const pruebaUser = (req, res) => {
  return res.status(200).send({
    message: "Mensaje enviado desde: controllers/user.js",
    usuario: req.user,
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

  try {
    // Validacion avanzada
    validate(params);
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: "Validación no superada",
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
      let pwd = bcrypt.compareSync(params.password, user.password);

      if (!pwd) {
        return res.status(400).send({
          status: "error",
          message: "No te has identificado correctamente",
        });
      }

      // Devolver Token
      const token = jwt.createToken(user);

      // Devolver Datos del usuario
      return res.status(200).send({
        status: "success",
        message: "Te has identificado correctamente",
        user: {
          id: user._id,
          name: user.name,
          nick: user.nick,
        },
        token,
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

const profile = async (req, res) => {
  // Recibir el parametro del id de usuario por la url
  const id = req.params.id;

  // Consulta para sacar los datos del usuario
  await User.findById(id)
    .select({ password: 0, role: 0 })
    .then(async (userProfile) => {
      if (!userProfile) {
        return res.status(404).send({
          status: "error",
          message: "No existe el usuario o hay un error",
        });
      }

      // Info del seguimiento
      const followInfo = await followService.followThisUser(req.user.id, id);

      // Devolver el resultado
      // Posteriormente: devolver informacion de follows
      return res.status(200).send({
        status: "success",
        user: userProfile,
        following: followInfo.following,
        follower: followInfo.follower,
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
};

const list = async (req, res) => {
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
    populate: [
      {
        path: "user",
        select: "-password -__v -role -email",
        options: { strictPopulate: false },
      },
    ],
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

    let followUserIds = await followService.followUserIds(req.user.id);

    // devolver el resultado si todo a salido bien
    return res.status(200).send({
      status: "success",
      users: users.docs,
      page,
      itemsPerPage,
      total,
      // redondeamos con ceil el numero de paginas con usuarios a mostrar
      pages: Math.ceil(total / itemsPerPage),
      user_following: followUserIds.following,
      user_follow_me: followUserIds.followers,
    });
  } catch (error) {
    return res.status(404).json({
      status: "Error",
      message: "Hubo un error al obtener los usuarios",
      error: error.message,
    });
  }
};

const update = async (req, res) => {
  //Recoger info del usuario a actualizar
  const userIdentity = req.user;
  const userToUpdate = req.body;

  //Eliminar campos sobrantes
  delete userToUpdate.iat;
  delete userToUpdate.exp;
  delete userToUpdate.role;
  delete userToUpdate.imagen;

  // console.log(userToUpdate)

  //Comprobar si el usuario ya existe
  User.find({
    $or: [
      { email: userToUpdate.email.toLowerCase() },
      { nick: userToUpdate.nick.toLowerCase() },
    ],
  })
    .then(async (users) => {
      console.log(userToUpdate);

      let userIsset = false;
      users.forEach((user) => {
        if (user && user._id != userIdentity.id) {
          userIsset = true;
        }
      });

      // si existe un usuario con el mismo nick o email
      if (userIsset) {
        return res.status(200).send({
          status: "success",
          message: "El usuario ya existe",
        });
      }

      if (userToUpdate.password) {
        // cifrar la contraseña
        let pwd = await bcrypt.hash(userToUpdate.password, 10);
        // console.log(pwd)
        userToUpdate.password = pwd;
      } else {
        delete userToUpdate.password;
      }

      //Buscar y actualizar
      let userUpdated = await User.findByIdAndUpdate(
        userIdentity.id,
        userToUpdate,
        { new: true }
      )
        .then(async (userUpdated) => {
          return res.status(200).send({
            status: "success",
            message: "Metodo de actualizar usuario",
            user: userUpdated,
          });
        })
        .catch((error) => {
          // si llega un error
          if (error)
            return res.status(500).json({
              status: "error",
              message: "Error en la actualizar usuarios",
            });
        });
    })
    .catch((error) => {
      // si llega un error
      if (error)
        return res.status(500).json({
          status: "error",
          message: "Error en la consulta de usuarios",
          error,
        });
    });
};

const upload = (req, res) => {
  // Recoger el fichero de imagen y comprobar que existe
  if (!req.file) {
    return res.status(404).send({
      status: "error",
      message: "peticion no incluye la imagen",
    });
  }

  // Conseguir el  nombre del archivo
  let image = req.file.originalname;

  // Sacar la extension del archivo
  let archivo_split = image.split(".");
  let extension = archivo_split[1];

  // Comprobar extension correcta
  if (
    extension != "png" &&
    extension != "jpg" &&
    extension != "jpeg" &&
    extension != "gif"
  ) {
    //Borrar archivo y dar una respuesta
    fs.unlink(req.file.path, (error) => {
      return res.status(400).json({
        status: "error",
        mensaje: "Imagen invalida",
      });
    });
  } else {
    //Recoger id articulo a editar
    let userId = req.user.id;

    //Buscar y actualizar el artículo
    User.findOneAndUpdate(
      { _id: userId },
      { image: req.file.filename },
      { new: true }
    )
      .then((userUpdated) => {
        //Devolver respuestas
        return res.status(200).json({
          status: "success",
          user: userUpdated,
          file: req.file,
        });
      })
      .catch((error) => {
        if (error) {
          return res.status(500).json({
            status: "error",
            mensaje: "Error al editar el usuario",
          });
        }
      });
  }
};

const avatar = (req, res) => {
  let fichero = req.params.file;
  let ruta_fisica = "./uploads/avatars/" + fichero;

  // GET http....api/imagen/nombre_del_fichero.jpg
  fs.access(ruta_fisica, (error) => {
    if (!error) {
      return res.sendFile(path.resolve(ruta_fisica));
    } else {
      return res.status(400).json({
        status: "Error",
        mensaje: "La imagen no existe",
        error,
        fichero,
        ruta_fisica,
      });
    }
  });
};

const counters = async (req, res) => {
  let userId = req.user.id;
  if (req.params.id) {
    userId = req.params.id;
  }
  try {
    const myFollows = await followService.followUserIds(req.user.id);
    const publications = await Publication.find({ user: userId });
    return res.status(200).send({
      userId,
      following: myFollows.following.length,
      followed: myFollows.followers.length,
      publications: publications.length,
    });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "Error en los contadores",
      error,
    });
  }
};

module.exports = {
  pruebaUser,
  register,
  login,
  profile,
  list,
  update,
  upload,
  avatar,
  counters,
};
