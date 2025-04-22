// importar dependencies
const connection = require("./database/conection");
const express = require("express");
const cors = require("cors");

// Mensaje de bienvenida
console.log("Api NODE para RED SOCIAL arrancada");

// Conexion a la base de datos
connection();

// Crear servidor node
const app = express();
const puerto = 3900;

// Configuración de CORS
app.use(
  cors({
    origin: "http://localhost:5173", // Aquí coloca la URL de tu frontend (en este caso es Vite por defecto)
    credentials: true, // Permitir el uso de cookies de terceros
  })
);

// Convertir los datos del body a objetos js
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cargar configuración de las ruta
const UserRoutes = require("./routes/user");
const PublicationRoutes = require("./routes/publication");
const FollowRoutes = require("./routes/follow");

app.use("/api/user", UserRoutes);
app.use("/api/publication", PublicationRoutes);
app.use("/api/follow", FollowRoutes);

// ruta de prueba
app.get("/ruta-prueba", (req, res) => {
  return res.status(200).json({
    id: 1,
    Nombre: "Wilmer Casilimas",
    mail: "wilmercasilimas@gmail.com",
  });
});

// Poner el servidor a escuchar peticiones http://
app.listen(puerto, () => {
  console.log("Servidor corriendo en el puerto: ", puerto);
});
