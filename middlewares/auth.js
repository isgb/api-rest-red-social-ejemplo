// Importar deopendencias
const jwt = require("jwt-simple");
const moment = require("moment");

// Importar clave secreta
const libjwt = require("../services/jwt");
const secret = libjwt.secret;

// Importar middleware autenticación
exports.auth = (req,res,next) => {

    // Comprobar si me llega la cabecera de autenticación
    if(!req.headers.authorization){
        return res.status(403).send({
            status: "error",
            message: "La peticion no tiene la cabecera de autenticación"
        })
    }

    // LImpiar el token
    let token = req.headers.authorization.replace(/['"]+/g,'');

    // Decodificar el token
    try {
    
        let payload = jwt.decode(token,secret);

        //Comprobar expiracion de token
        if(payload.exp <= moment().unix()){
            return res.status(401).send({
                status: "error",
                message: "Token expirado",
                error
            })
        }

        // Agregar datos de usuario a request
        req.user = payload;

    } catch (error) {
        return res.status(404).send({
            status: "error",
            message: "Token invalido",
            error
        })
    }


    // Pasar ejecucion de accion
    next();
}
