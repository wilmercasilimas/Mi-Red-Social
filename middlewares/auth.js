// Importar el paquete jwt y moment
const jwt = require("jwt-simple");
const moment = require("moment");

// Importar la clave secreta
const libjwt = require("../services/jwt");
const secret = libjwt.secret;

// Middleware de autenticación
exports.auth = (req, res, next) => {
  // Comprobar si me llega la cabecera de autorización
  if (!req.headers.authorization) {
    return res.status(403).send({
      status: "error",
      message: "La petición no tiene la cabecera de autorización",  // Mensaje de error detallado
    });
  }

  // Limpiar el token de comillas
  let token = req.headers.authorization.replace(/['"]+/g, "");

  // Decodificar el token
  try {
    let payload = jwt.decode(token, secret);

    // Comprobar si el token ha expirado
    if (payload.exp <= moment().unix()) {
      return res.status(401).send({
        status: "error",
        message: "El token ha expirado",  // Mensaje más claro
      });
    }

    // Agregar los datos del usuario al request
    req.user = payload;
  } catch (error) {
    return res.status(404).send({
      status: "error",
      message: "El token no es válido",  // Mensaje más claro
      error,
    });
  }

  // Continuar con la ejecución de la siguiente función (ruta)
  next();
};
