// Acciones de prueba
const pruebaUser = (req,res) => {
    return res.status(200).send({
        message: "Mensaje enviado desde: controllers/user.js"
    });
}

module.exports = {
    pruebaUser
}