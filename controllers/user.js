// Acciones de prueba
const prueba = (req,res) => {
    return res.status(200).send({
        message: "Mensaje enviado desde : controllers/user.js"
    });
}