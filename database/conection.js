const mongoose = require("mongoose");

const connection = async () => {
    try {
        await mongoose.connect("mongodb://localhost:27017/mi_redsocial",);

        
        console.log("Conectado correctamente a la base de datos mi_BD_redsocial");

    } catch (error) {
        console.log(error);
        throw new Error("Error al conectar a la base de datos");
    }
}

module.exports = connection
