const express = require("express");
const router = express.Router();
const multer = require("multer");
const UserController = require("../controllers/user");
const check = require("../middlewares/auth"); // Middleware de autenticación (check.auth)
const checkRole = require("../middlewares/role"); // Middleware de roles

// Configurar Multer para subir imágenes (avatar)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/avatars");
  },
  filename: function (req, file, cb) {
    cb(null, "avatars-" + Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// ---------------- RUTAS PÚBLICAS ----------------

router.post("/register", UserController.register);
router.post("/login", UserController.login);

// ---------------- RUTAS PROTEGIDAS ----------------

// Ruta de prueba protegida
router.get("/prueba-usuario", check.auth, UserController.pruebaUser);

// Ver perfil de un usuario
router.get("/profile/:id", check.auth, UserController.profile);

// Listar usuarios paginados
router.get("/list/:page?", check.auth, UserController.list);

// Actualizar datos de perfil
router.put("/update", check.auth, UserController.update);

// Subir imagen avatar
router.post("/upload", [check.auth, upload.single("file0")], UserController.upload);

// Obtener imagen avatar
router.get("/avatar/:file", UserController.avatar);

// Obtener contadores (seguidores, seguidos, publicaciones)
router.get("/counters/:id?", check.auth, UserController.counters);

// Refrescar token
router.post("/refresh-token", check.auth, UserController.refreshToken);

// Buscar usuarios por coincidencia de nombre
router.post("/buscar", check.auth, UserController.buscarUsuariosPorNombre);

// ---------------- RUTAS SOLO PARA ADMIN ----------------

// Registrar un nuevo administrador
router.post("/admin/register", [check.auth, checkRole("admin")], UserController.adminRegister);

// Listar todos los administradores
router.get("/admins", [check.auth, checkRole("admin")], UserController.listAdmins);

// Panel de administración (ejemplo)
router.get("/panel", check.auth, checkRole("admin"), (req, res) => {
  return res.status(200).json({
    status: "success",
    message: "Bienvenido al panel de administración",
    user: req.user,
  });
});

// Cambiar el rol de un usuario
router.put("/change-role/:id", [check.auth, checkRole("admin")], UserController.changeRole);

// Eliminar un usuario (solo admin)
router.delete("/user/:id", [check.auth, checkRole("admin")], UserController.deleteUser);

// Exportar el router
module.exports = router;
