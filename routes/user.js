const express = require("express");
const router = express.Router();
const multer = require("multer");
const UserController = require("../controllers/user");
const check = require("../middlewares/auth"); // Middleware de autenticación
const checkRole = require("../middlewares/role"); // Middleware de roles

// Configurar Multer para subir imágenes avatars
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/avatars");
  },
  filename: function (req, file, cb) {
    cb(null, "avatars-" + Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Ruta para registrar un administrador, solo accesible por admins
router.post(
  "/admin/register",
  [check.auth, checkRole("admin")],
  UserController.adminRegister
);

// Rutas públicas o sin autenticación
router.get("/prueba-usuario", check.auth, UserController.pruebaUser);
router.post("/register", UserController.register);
router.post("/login", UserController.login);
router.get("/profile/:id", check.auth, UserController.profile);

// 🔒 Ruta protegida SOLO para usuarios con rol "admin"
router.get("/list/:page?", [check.auth], UserController.list);

router.put("/update", check.auth, UserController.update);
router.post(
  "/upload",
  [check.auth, upload.single("file0")],
  UserController.upload
); // Subir avatar
router.get("/avatar/:file", UserController.avatar);

// Ruta para refrescar el token
router.post("/refresh-token", check.auth, UserController.refreshToken);

// Ruta para obtener los contadores
router.get("/counters/:id?", check.auth, UserController.counters);

// Ruta de ejemplo protegida solo para admin
router.get("/panel", check.auth, checkRole("admin"), (req, res) => {
  return res.status(200).json({
    status: "success",
    message: "Bienvenido al panel de administración",
    user: req.user,
  });
});

router.delete(
  "/user/:id",
  check.auth,
  checkRole("admin"),
  UserController.deleteUser
);
// Cambiar el rol de un usuario (solo admin puede hacerlo)
router.put(
  "/change-role/:id",
  [check.auth, checkRole("admin")],
  UserController.changeRole
);

router.get(
  "/admins",
  [check.auth, checkRole("admin")],
  UserController.listAdmins
);

router.post(
  "/admin/register",
  [check.auth, checkRole("admin")],
  UserController.adminRegister
);

// Exportar el router
module.exports = router;
