// Importar dependencias
const jwt = require("jwt-simple")
const moment = require("moment")

// Generar clave secreta
const secret = "CLAVE_SECRETA_del_proyecto_DE_LA_RED_social_987987";

// Crear una función para generar tokens
exports.createToken = (user) => {
    const payload = {
        id: user._id,
        name: user.name,
        surname: user.surname,
        nick: user.surname,
        email: user.email,
        role: user.role,
        imagen: user.image,
        iat: moment().unix(),
        exp: moment().add(30, "days").unix
    }

    // Devolver jwt token codificado
    return jwt.encode(payload, secret)
}