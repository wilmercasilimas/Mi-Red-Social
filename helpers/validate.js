const validator = require("validator");

const validate = (params) => {
  let errores = [];

  const soloLetras = /^\p{L}+(\s\p{L}+)*$/u; // Expresión regular para solo letras y espacios

  if (
    !params.name ||
    validator.isEmpty(params.name.trim()) || // Verifica si el nombre está vacío o solo contiene espacios
    !soloLetras.test(params.name.trim()) || // Verifica si el nombre contiene solo letras y espacios
    params.name.trim().length < 3 // Verifica si el nombre tiene al menos 3 caracteres
  ) {
    errores.push(
      "El nombre es obligatorio, debe contener solo letras y tener al menos 3 caracteres"
    );
  }

  if (
    !params.surname ||
    validator.isEmpty(params.surname.trim()) ||
    !soloLetras.test(params.surname.trim()) ||
    params.surname.trim().length < 3
  ) {
    errores.push(
      "El apellido es obligatorio, debe contener solo letras y tener al menos 3 caracteres"
    );
  }

  if (!params.email || !validator.isEmail(params.email.trim())) {
    errores.push("Email inválido");
  }

  if (
    !params.password ||
    !validator.isLength(params.password, { min: 6 }) ||
    !/[A-Z]/.test(params.password) || // al menos una mayúscula
    !/[!@#$%^&*(),.?":{}|<>]/.test(params.password) || // al menos un carácter especial
    !/[0-9]/.test(params.password) // al menos un número
  ) {
    errores.push(
      "La contraseña debe tener al menos 6 caracteres, una letra mayúscula, un número y un carácter especial"
    );
  }

  if (!params.nick || validator.isEmpty(params.nick.trim())) {
    errores.push("El nick es obligatorio");
  }

  if (
    !params.bio ||
    validator.isEmpty(params.bio.trim()) ||
    !validator.isLength(params.bio.trim(), { min: 5, max: 250 })
  ) {
    errores.push(
      "La biografía es obligatoria y debe tener entre 5 y 250 caracteres"
    );
  }

  return errores;
};

module.exports = {
  validate,
};
