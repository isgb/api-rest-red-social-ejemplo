const mongoose = require("mongoose");

const connection = () =>{

    try {
        
        mongoose.connect("mongodb://127.0.0.1:27017/mi_redsocial", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log("Conectado correctamente a la base de datos.")
    } catch (error) {
        console.log(error);
        throw new Error("No se ha podido conectar a la base de datos");
    }

}

module.exports = {
    connection
}