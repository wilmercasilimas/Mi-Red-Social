const jwt = require("jwt-simple");
const moment = require("moment");

// Clave secreta para firmar el token
const secret = "CLAVE_SECRETA_del_proyecto_DE_LA_RED_soCIAL_987987"; // Cambia esto a una clave secreta más segura

// Función para generar el token
const createToken = (user) => {
  const payload = {
    id: user._id,
    name: user.name,
    surname: user.surname,
    nick: user.nick,
    email: user.email,
    role: user.role,
    imagen: user.image,
    iat: moment().unix(),
    exp: moment().add(30, "d").unix(),
  };

  return jwt.encode(payload, secret);
};

module.exports = {
  secret,
  createToken,
};
