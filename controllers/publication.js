//  Importar modulos
const fs = require("fs");
const path = require("path");

const Publication = require("../models/publication");

//Importar servicios
const followService  = require("../services/followService");

// Acciones de prueba
const pruebaPublication = (req,res) => {
    return res.status(200).send({
        message: "Mensaje enviado desde: controllers/publication.js"
    });
}

//Guardar publicacion
const save = (req,res) => {

    // Recoger datos del body
    const params = req.body;

    // Si no me llegan dar respuestas negativa
    if(!params.text) return res.status(400).send({status: "error" , message: "Debes enviar el texto de la publicación"})

    // Crear y rellenar el objeto del modelo
    let newPublication = new Publication(params);
    newPublication.user = req.user.id;

    // Guardar objeto en bbddd
    newPublication.save()
    .then((publicationStored) => {

        return res.status(200).send({
            status: "success",
            message: "Guardar publicacion",
            publicationStored
        });

    }).catch((error) => {

       return res.status(400).send({
                status: "error" , 
                message: "No se a guardado la publicación."
            });

    })

    // return res.status(200).send({
    //     status: "success",
    //     message: "Guardar publicacion"
    // })

}

//Sacar una publicacion
const detail = (req,res) => {

    // Sacar id de la publicacion de la url
    let publicationId = req.params.id;

    // Find con la condicion del id
    Publication.findById(publicationId)
    .then((publicationStored) => {

        return res.status(200).send({
            status: "success",
            message: "Mostrar publicacion",
            publicationStored
        });

    }).catch((error) => {

        return res.status(500).send({
            status: "error",
            message: "No existe la publicacion",
            publicationStored
        });
    })

}

//Eliminar publicaciones
const remove = (req,res) => {
    // Sacar el id de la punlicacion a eliminar
    const publicationId = req.params.id;

    // Find y luego remove
    Publication.deleteOne({"user": req.user.id, "_id": publicationId})
    .then((publicationId) => {

        return res.status(200).send({
            status: "success",
            message: "Eliminar la publicacion",
            publication: publicationId
        });

    }).catch((error) => {

        return res.status(500).send({
            status: "error",
            message: "No se ha eliminado la publicacion"
        });
    })
 
}

// Listar todas las publicaciones
const user = async (req,res) =>{
    const itemsPerPage = 5;

    const user_id = req.params.id ?? req.user.id;
    const page = req.params.page ?? 1;
    const query = { user: user_id };

    const publicationOptions = {
        page: page,
        limit: itemsPerPage,
        populate: [
          { path: "user", select: "-password -__v -role -email" },
        ],
        collation: {
          locale: "en",
        },
      };
   
      try {
        // obtenes los usuarios
        const {
            docs: publications,
            totalDocs: total,
            totalPages: pages,
          } = await Publication.paginate(query, publicationOptions);

        //   let followUserIds = await followService.followUserIds(req.user.id)
    
        // si no existe un publicacion devolvermos el error
        if (!publications)
          return res.status(404).json({
            status: "Error",
            message: "No se han encontrado publicaciones",
          });
    
        // devolver el resultado si todo a salido bien
        return res.status(200).send({
          status: "success",
          publications,
          total,
        //   pages,
          // redondeamos con ceil el numero de paginas con usuarios a mostrar
          pages: Math.ceil(total / itemsPerPage),
        //   user_following: followUserIds.following,
        //   user_follow_me: followUserIds.followers
        });
    
      } catch (error) {
        return res.status(404).json({
          status: "Error",
          message: "Error en la consulta de publicacioens",
          error: error.message,
        });
      }
    
}

// Subir ficheros
const upload = (req, res) => {

    // Sacar publication id
    const publicationId = req.params.id;

    // Recoger el fichero de imagen y comprobar que existe
    if (!req.file) {
      return res.status(404).send({
        status: "error",
        message: "peticion no incluye la imagen"
      })
    }
  
    // Conseguir el  nombre del archivo
    let image = req.file.originalname;
  
    // Sacar la extension del archivo
    let archivo_split = image.split("\.");
    let extension = archivo_split[1];
  
    // Comprobar extension correcta
    if (extension != "png" && extension != "jpg" &&
      extension != "jpeg" && extension != "gif") {
  
      //Borrar archivo y dar una respuesta
      fs.unlink(req.file.path, (error) => {
        return res.status(400).json({
          status: "error",
          mensaje: "Imagen invalida"
        })
      })
    } else {
  
      //Recoger id articulo a editar
      let userId = req.user.id;
  
      //Buscar y actualizar el artículo
      Publication.findOneAndUpdate({ user: userId, "_id" : publicationId }, { file: req.file.filename }, { new: true }).then((publicationUpdated) => {
  
        //Devolver respuestas
        return res.status(200).json({
          status: "success",
          publication: publicationUpdated,
          file: req.file,
        })
      }).catch((error) => {
        if (error) {
          return res.status(500).json({
            status: "error",
            mensaje: "Error al editar la publicacion"
          });
        }
      });
  
    }
}

// Devolver archivos multimedia
const media = (req,res) => {
    let fichero = req.params.file;
    let ruta_fisica = "./uploads/publications/"+fichero;
  
    // GET http....api/imagen/nombre_del_fichero.jpg
    fs.access(ruta_fisica, (error) => {
        if(!error){
          return res.sendFile(path.resolve(ruta_fisica));
        }else{
          return res.status(400).json({
            status: "Error",
            mensaje: "La imagen no existe",
            error,
            fichero,
            ruta_fisica
          });
        }
    })
  }

// Listar todas las publicaciones (FEED)
const feed = async (req,res) => {

     // Sacar un array de identificadores de usuarios que yo sigo como usuario logueado
     const myFollows = await followService.followUserIds(req.user.id)
        
    //  // Find a publicaciones in, ordenar, popilar, paginar
    //  const publicationsTest = await Publication.find({
    //      user: myFollows.following
    //  }).populate("user", "-password -role -__v -email").sort("-created_at")

    // Sacar la pagina actual
    const itemsPerPage = 5;

    const user_id = req.params.id ?? req.user.id;
    
    // Establecer numero de elementos por pagina
    const page = req.params.page ?? 1;
    const query = { user: myFollows.following };

    const publicationOptions = {
        page: page,
        limit: itemsPerPage,
        populate: [
          { path: "user", select:  "-password -role -__v -email" },
        ],
        sort: { created_at: -1 },
        collation: {
          locale: "en",
        },
      };
   
      try {

        // obtenes los usuarios
        const {
            docs: publications,
            totalDocs: total,
            totalPages: pages,
          } = await Publication.paginate(query, publicationOptions);
    
        // si no existe un publicacion devolvermos el error
        if (!publications)
          return res.status(404).json({
            status: "Error",
            message: "No se han encontrado publicaciones",
          });
    
        // devolver el resultado si todo a salido bien
        return res.status(200).send({
          status: "success",
          message : "Feed de publicaciones",
          publications,
          total,
          following:myFollows.following,
          // redondeamos con ceil el numero de paginas con usuarios a mostrar
          pages: Math.ceil(total / itemsPerPage),
        });
    
      } catch (error) {
        return res.status(500).json({
          status: "Error",
          message: "Error en la consulta de publicacioens",
          error: error.message,
        });
      }

}

module.exports = {
    pruebaPublication,
    save,
    detail,
    remove,
    user,
    upload,
    media,
    feed
}