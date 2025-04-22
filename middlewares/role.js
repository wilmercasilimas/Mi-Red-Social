// middlewares/role.js

// Este middleware permite proteger rutas dependiendo del rol del usuario.
// Se utiliza pasando uno o más roles permitidos (como "admin", "moderator", etc.)

const checkRole = (...rolesPermitidos) => {
  return (req, res, next) => {
    // Verificamos que el usuario esté autenticado y tenga un rol definido
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        status: "error",
        message: "No autorizado. No se encontró información del usuario.",
      });
    }

    // Verificamos si el rol del usuario está entre los permitidos
    if (!rolesPermitidos.includes(req.user.role)) {
      return res.status(403).json({
        status: "error",
        message:
          "Acceso prohibido. No tienes permiso para acceder a esta ruta.",
      });
    }

    // Si pasa la validación, continúa al siguiente middleware o controlador
    next();
  };
};

module.exports = checkRole;
