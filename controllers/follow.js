// Importar modelo
const Follow = require('../models/follow');
const User = require("../models/user");

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

// Acción listado de usuarios que estoy siguiendo

//Exportar acciones
module.exports = {
    pruebaFollow,
    save,
    unfollow
}