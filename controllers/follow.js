// Importar modelo
const Follow = require('../models/follow');
const User = require("../models/user");

// Importar servicio
const followService = require("../services/followService")

// Importar dependencias
const mongoosePaginate = require("mongoose-paginate-v2");

// Acciones de prueba
const pruebaFollow = (req, res) => {
    return res.status(200).send({
        message: "Mensaje enviado desde: controllers/follow.js"
    });
}

// Accion de guardar un follow (accion seguir)
const save = (req, res) => {

    //Conseguir datos por body
    const params = req.body;

    // Sacar id del ususario identificado
    const identity = req.user;

    // Crear objeto con modelo follow
    let userToFollow = new Follow({
        user: identity.id,
        followed: params.followed
    })

    // Guardar objeto en bbdd
    userToFollow
        .save()
        .then((followStored) => {
            if (followStored) {
                // devolver resultado
                return res.status(200).send({
                    status: "success",
                    identity: req.user,
                    follow: followStored
                });
            }
        })
        .catch((error) => {
            // si llega un error
            if (error)
                return res.status(500).send({
                    status: "error",
                    message: "No se ha podido seguir al usuario"
                });
        });

}

// Accion de borrar un follow (accion dejar de seguir)
const unfollow = async (req, res) => {
    // recoger el id del usuario identificado
    const userId = req.user.id;

    // recoger el id del usuario a dejar de seguir
    const followedId = req.params.id;

    // buscar en la base de datos la coincidencia y eliminarla
    await Follow.deleteOne({

        "user": userId,
        "followed": followedId

    }).then(() => {

        return res.status(200).send({
            status: "success",
            message: "Follow eliminado correctamente",
        });

    }).catch((error) => {

        return res.status(500).send({
            status: "error",
            message: "No se pudo dejar de seguir al usuario",
        });
    })

}

// Acción listado de usuarios que estoy siguiendo (siguiendo)
const following = async (req, res) => {

    // Usuarios por pagina quiero mostrar
    const itemsPerPage = 5;

    const user_id = req.params.id ?? req.user.id;
    const page = req.params.page ?? 1;
    const query = { user: user_id };

    const paginateOptions = {
        page: page,
        limit: itemsPerPage,
        populate: [
          { path: "user", select: "name surname" },
          { path: "followed", select: "-password -role -__v" },
        ],
        collation: {
          locale: "en",
        },
      };
   
      
      try {
        // obtenes los usuarios
        const {
            docs: following_users,
            totalDocs: total_following,
            totalPages: pages,
          } = await Follow.paginate(query, paginateOptions);

          let followUserIds = await followService.followUserIds(req.user.id)
    
        // si no existe un usuario devolvermos el error
        if (!following_users)
          return res.status(404).json({
            status: "Error",
            message: "No se han encontrado usuarios",
          });
    
        // devolver el resultado si todo a salido bien
        return res.status(200).send({
          status: "success",
          following_users,
          total_following,
        //   pages,
          // redondeamos con ceil el numero de paginas con usuarios a mostrar
          pages: Math.ceil(total_following / itemsPerPage),
          user_following: followUserIds.following,
          user_follow_me: followUserIds.followers
        });
    
      } catch (error) {
        return res.status(404).json({
          status: "Error",
          message: "Error en la consulta de usuarios",
          error: error.message,
        });
      }

}

// Acción listado de usuarios que siguen a cualquier otro usuario (soy seguido, mis seguidores)
const followers = async (req, res) => {

  let followUserIds = await followService.followUserIds(req.user.id)

  const itemsPerPage = 5;

  const user_id = req.params.id ?? req.user.id;
  const page = req.params.page ?? 1;    
  // const query = { followed: user_id };

    // const query = { followed: followUserIds.followers };
  // : { $in: [<value1>, <value2>, ... <valueN> ] }
  // console.log(followUserIds.followers.valueOf())
  const query = { followed: { "$in": [followUserIds.followers.valueOf()] }};

  const paginateOptions = {
      page: page,
      limit: itemsPerPage,
      populate: [
        // { path: "user", select: "name surname" },
        { path: "followed", select: "-password -role -__v -email" },
      ],
      collation: {
        locale: "en",
      },
    };
 
    try {
      // obtenes los usuarios
      const {
          docs: following_users,
          totalDocs: total_following,
          totalPages: pages,
        } = await Follow.paginate(query, paginateOptions);

        let followUserIds = await followService.followUserIds(req.user.id)
  
      // si no existe un usuario devolvermos el error
      if (!following_users)
        return res.status(404).json({
          status: "Error",
          message: "No se han encontrado usuarios",
        });
  
      // devolver el resultado si todo a salido bien
      return res.status(200).send({
        status: "success",
        following_users,
        total_following,
        // redondeamos con ceil el numero de paginas con usuarios a mostrar
        pages: Math.ceil(total_following / itemsPerPage),
        user_following: followUserIds.following,
        user_follow_me: followUserIds.followers
      });
  
    } catch (error) {
      return res.status(404).json({
        status: "Error",
        message: "Error en la consulta de usuarios",
        error: error.message,
      });
    }

}
//Exportar acciones
module.exports = {
    pruebaFollow,
    save,
    unfollow,
    following,
    followers
}