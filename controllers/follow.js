// Acciones de prueba
const pruebaFollow = (req,res) => {
    return res.status(200).send({
        message: "Mensaje enviado desde: controllers/follow.js"
    });
}

module.exports = {
    pruebaFollow
}