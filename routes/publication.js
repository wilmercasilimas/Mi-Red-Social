const express = require("express");
const router = express.Router();
const multer = require("multer");
const publicationController = require("../controllers/publication");
const check = require("../middlewares/auth");

// Configurar Multer para subir imágenes avatars
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./uploads/publications/");
    },
    filename: function (req, file, cb) {
        cb(null, "pub-"+Date.now()+"-"+file.originalname);
    }    
});

const upload = multer({ storage });

// Definir las rutas
router.get("/prueba-publication", publicationController.pruebaPublication);
// Ruta para guardar una publicación (requiere autenticación)
router.post("/save", check.auth, publicationController.save);
// Obtener una publicación en concreto
router.get("/detail/:id", check.auth, publicationController.detail);
// Eliminar una publicación (requiere autenticación)
router.delete("/remove/:id", check.auth, publicationController.remove);
// Obtener publicaciones de un usuario (requiere autenticación)
router.get("/user/:id/:page?", check.auth, publicationController.user);
// Subir un archivo (requiere autenticación)
router.post("/upload/:id", [check.auth, upload.single("file0")], publicationController.upload);
// Obtener un archivo (requiere autenticación)
router.get("/media/:file", publicationController.media);
// Obtener el feed de publicaciones (requiere autenticación)
router.get("/feed/:page?", check.auth, publicationController.feed);


// Exportar el router
module.exports = router;
