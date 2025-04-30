// Importar dependencias necesarias
const bcrypt = require("bcrypt");
const User = require("../models/user");
const mongoosePaginate = require("mongoose-paginate-v2");
const fs = require("fs");
const path = require("path");
const jwt = require("../services/jwt");
const followService = require("../services/followService"); // Importar servicio de follow
const Follow = require("../models/follow");
const Publication = require("../models/publication"); // Importar modelo de publicación
const { validate } = require("../helpers/validate");
// Importar función de validación

// Función de prueba
const pruebaUser = (req, res) => {
  res.status(200).send({
    message: "Mensaje enviado desde: controllers/user.js",
    usuario: req.user, // Confirmación de que el middleware de autenticación funcionó
  });
};

const register = async (req, res) => {
  try {
    let params = req.body;

    // Verificar que se envíen los campos mínimos obligatorios
    if (!params.name || !params.email || !params.password || !params.nick) {
      return res
        .status(400)
        .json({ status: "error", message: "Faltan datos por enviar" });
    }

    // Validación avanzada personalizada
    const errores = validate(params);
    if (errores.length > 0) {
      return res.status(400).json({
        status: "error",
        message: "Errores de validación",
        errores,
      });
    }

    // Normalizar email y nick a minúsculas
    let email = params.email.toLowerCase();
    let nick = params.nick.toLowerCase();

    // Verificar si ya existe un usuario con el mismo email o nick
    const users = await User.find({
      $or: [{ email: email }, { nick: nick }],
    }).exec();

    if (users.length > 0) {
      return res
        .status(400)
        .json({ status: "error", message: "El usuario ya existe" });
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(params.password, 10);

    // Forzar rol como "user"
    const rolAsignado = "user";

    // Crear el objeto usuario con los datos
    let user_to_save = new User({
      name: params.name,
      surname: params.surname,
      bio: params.bio,
      email: email,
      password: hashedPassword,
      nick: nick,
      role: rolAsignado,
    });

    // Guardar el usuario en la base de datos
    await user_to_save.save();

    return res.status(200).json({
      status: "success",
      message: "Usuario registrado exitosamente",
      user: user_to_save,
    });
  } catch (error) {
    console.error("Error en el registro:", error);
    return res
      .status(500)
      .json({ status: "error", message: "Error en el servidor", error });
  }
};

// Registro exclusivo para administradores
const adminRegister = async (req, res) => {
  try {
    let params = req.body;

    // Verificar campos mínimos obligatorios
    if (!params.name || !params.email || !params.password || !params.nick) {
      return res.status(400).json({
        status: "error",
        message: "Faltan datos por enviar",
      });
    }

    // Validaciones personalizadas desde helpers/validate.js
    const errores = validate(params);
    if (errores.length > 0) {
      return res.status(400).json({
        status: "error",
        message: "Errores de validación",
        errores,
      });
    }

    // Normalizar email y nick
    const email = params.email.toLowerCase();
    const nick = params.nick.toLowerCase();

    // Verificar si ya existe un usuario con ese email o nick
    const users = await User.find({
      $or: [{ email: email }, { nick: nick }],
    }).exec();

    if (users.length > 0) {
      return res.status(400).json({
        status: "error",
        message: "El usuario ya existe",
      });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(params.password, 10);

    // Asignar rol de administrador (hardcoded)
    const rolAsignado = "admin";

    // Crear nuevo usuario
    const user_to_save = new User({
      name: params.name,
      surname: params.surname,
      bio: params.bio,
      email,
      password: hashedPassword,
      nick,
      role: rolAsignado,
    });

    // Guardar usuario en la base de datos
    await user_to_save.save();

    return res.status(200).json({
      status: "success",
      message: "Usuario administrador registrado exitosamente",
      user: user_to_save,
    });
  } catch (error) {
    console.error("Error en el registro de admin:", error);
    return res.status(500).json({
      status: "error",
      message: "Error en el servidor",
      error,
    });
  }
};

// Función para login de usuarios
const login = async (req, res) => {
  try {
    let email = req.body.email?.toLowerCase(); // Convertir a minúsculas
    let password = req.body.password;

    if (!email || !password) {
      return res
        .status(400)
        .json({ status: "error", message: "Faltan datos por enviar" });
    }

    let user = await User.findOne({ email: email }).exec();

    if (!user) {
      return res
        .status(400)
        .json({ status: "error", message: "El usuario no existe" });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res
        .status(400)
        .json({ status: "error", message: "La contraseña no es válida" });
    }

    user.password = undefined;

    const token = jwt.createToken(user);

    return res.status(200).json({
      status: "success",
      message: "Login exitoso",
      user: {
        id: user.id,
        name: user.name,
        surname: user.surname,
        bio: user.bio,
        nick: user.nick,
        email: user.email,
        image: user.image,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: "error", message: "Error en el servidor", error });
  }
};

// Nueva función para refrescar el token
const refreshToken = (req, res) => {
  try {
    // Extraer el ID del usuario del token decodificado
    const user = req.user; // Viene del middleware auth.js

    // Generar un nuevo token para el usuario
    const newToken = jwt.createToken(user);

    return res.status(200).json({
      status: "success",
      message: "Token actualizado exitosamente",
      token: newToken, // Enviar el nuevo token
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: "error", message: "Error al refrescar el token", error });
  }
};

//Método para sacar un usuario (los datos del perfil del usuario)
const profile = async (req, res) => {
  try {
    // Recibir el parámetro del id de usuario por la URL
    const id = req.params.id;

    // Verificar que el id esté presente en la URL
    if (!id) {
      return res.status(400).send({
        status: "error",
        message: "El parámetro id es obligatorio.",
      });
    }

    // Consulta para obtener los datos del usuario, excluyendo el password y role
    const userProfile = await User.findById(id).select("-password -role");

    // Verificar si el usuario existe
    if (!userProfile) {
      return res.status(404).send({
        status: "error",
        message: "El usuario no existe",
      });
    }

    // Información de seguimiento
    const followInfo = await followService.followThisUser(req.user.id, id);

    // Devolver el resultado
    return res.status(200).send({
      status: "success",
      user: userProfile,
      followInfo,
    });
  } catch (error) {
    // Manejar cualquier error
    return res.status(500).send({
      status: "error",
      message: "Error en la consulta del perfil de usuario",
      error: error.message || error,
    });
  }
};

const list = async (req, res) => {
  try {
    // Página actual
    let page = parseInt(req.params.page) || 1;
    const itemsPerPage = 6; // Número de resultados por página
    const skip = (page - 1) * itemsPerPage;

    // Obtener todos los usuarios paginados
    const usersResult = await User.find()
      .select("-password -role -__v -email ") // Excluir campos innecesarios
      .sort("_id")
      .skip(skip)
      .limit(itemsPerPage);

    // Si no hay usuarios
    if (!usersResult || usersResult.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No hay usuarios disponibles",
      });
    }

    // Total de usuarios
    const totalUsers = await User.countDocuments();

    // Obtener IDs de seguidos y seguidores
    const userId = req.user.id;

    const following = await Follow.find({ user: userId }).select(
      "followed -_id"
    );
    const followers = await Follow.find({ followed: userId }).select(
      "user -_id"
    );

    const user_following = following.map((f) => f.followed.toString());
    const user_follow_me = followers.map((f) => f.user.toString());

    // Construir respuesta limpia por usuario
    const usersCleaned = usersResult.map((user) => {
      const { password, __v, role, create_at, ...userData } = user.toObject();
      return {
        ...userData,
        createdAt: create_at,
        siguiendo: user_following.includes(user._id.toString()),
        meSigue: user_follow_me.includes(user._id.toString()),
      };
    });

    // Respuesta final
    return res.status(200).json({
      status: "success",
      users: usersCleaned,
      page,
      itemsPerPage,
      total: totalUsers,
      pages: Math.ceil(totalUsers / itemsPerPage),
      user_following,
      user_follow_me,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Error al listar usuarios",
      error: error.message,
    });
  }
};

const update = async (req, res) => {
  try {
    // Obtener la identidad del usuario autenticado desde el token
    let userIdentity = req.user;
    // Datos que el usuario quiere actualizar
    let userToUpdate = req.body;

    // Evitar que se actualicen campos sensibles o controlados por el sistema
    delete userToUpdate.iat;
    delete userToUpdate.exp;
    delete userToUpdate.role;
    delete userToUpdate.image;

    // Obtener los datos actuales del usuario para comparación
    const currentUser = await User.findById(userIdentity.id).select(
      "-role -iat -exp -__v"
    );
    if (!currentUser) {
      return res.status(404).json({
        status: "error",
        message: "El usuario no existe",
        user: null,
      });
    }

    // Verificar si el nuevo email o nick ya están en uso por otro usuario
    if (userToUpdate.email || userToUpdate.nick) {
      const existingUsers = await User.find({
        $or: [
          { email: userToUpdate.email?.toLowerCase() },
          { nick: userToUpdate.nick?.toLowerCase() },
        ],
      });

      const isEmailOrNickTaken = existingUsers.some(
        (user) => user._id.toString() !== userIdentity.id
      );

      if (isEmailOrNickTaken) {
        return res.status(400).json({
          status: "error",
          message: "El email o nick ya están en uso por otro usuario",
          user: currentUser,
        });
      }
    }

    // Cifrar nueva contraseña si se proporciona
    if (userToUpdate.password) {
      userToUpdate.password = await bcrypt.hash(userToUpdate.password, 10);
    } else {
      delete userToUpdate.password; // Eliminar si no se va a actualizar
    }

    // Actualizar el usuario en la base de datos y devolver el nuevo documento
    const updatedUser = await User.findByIdAndUpdate(
      userIdentity.id,
      userToUpdate,
      { new: true }
    ).select("-role -iat -exp -__v");

    if (!updatedUser) {
      return res.status(404).json({
        status: "error",
        message: "No se pudo actualizar el usuario",
        user: currentUser,
      });
    }

    // Respuesta con los datos antes y después de la actualización
    return res.status(200).json({
      status: "success",
      message: "Usuario actualizado correctamente",
      before: currentUser,
      after: updatedUser,
    });
  } catch (error) {
    console.error("Error en la actualización:", error);

    let errorMessage = "Error en el servidor";
    if (error.name === "CastError" && error.kind === "ObjectId") {
      errorMessage = "El ID de usuario es inválido";
    }

    // Enviar error junto con los datos actuales del usuario (si se pueden recuperar)
    return res.status(500).json({
      status: "error",
      message: errorMessage,
      user:
        (await User.findById(req.user.id).select(
          "-password -role -iat -exp -__v"
        )) || null,
    });
  }
};

const upload = async (req, res) => {
  // Recoger el fichero de la imagen y comprobar que existe
  if (!req.file) {
    return res.status(404).json({
      status: "error",
      message: "No se ha subido ningún imagen",
    });
  }

  // Conseguir el nombre del fichero
  let image = req.file.originalname;

  // Sacar la extensión del fichero
  const imageSplit = image.split(".");
  const extensión = imageSplit[1].toLowerCase(); // Aseguramos que la extensión sea minúscula

  // Comprobar si la extensión es válida
  if (
    extensión != "png" &&
    extensión != "jpg" &&
    extensión != "jpeg" &&
    extensión != "gif"
  ) {
    // Borrar el archivo subido
    const filePath = req.file.path;
    fs.unlinkSync(filePath); // Usamos unlinkSync para eliminar el archivo sincrónicamente

    // Devolver una respuesta negativa
    return res.status(400).send({
      status: "error",
      message: "La extensión de la imagen no es válida",
    });
  }

  try {
    // Si la extensión es válida, actualizar el nombre de la imagen en la base de datos
    const userUpdate = await User.findOneAndUpdate(
      { _id: req.user.id }, // Condición de búsqueda (por ID de usuario)
      { $set: { image: req.file.filename } }, // Actualización (ponemos el nuevo nombre de archivo)
      { new: true } // Opciones: Devuelve el usuario actualizado
    );

    // Devolver la respuesta con el usuario actualizado
    return res.status(200).json({
      status: "success",
      user: userUpdate, // El usuario actualizado
      file: req.file, // El archivo subido
    });
  } catch (error) {
    // Manejo de errores
    return res.status(500).json({
      status: "error",
      message: "Error al actualizar la imagen",
      error: error.message, // Información del error
    });
  }
};

// Método para sacar el Avatar
const avatar = async (req, res) => {
  // Recibir el parámetro del id de usuario por la URL
  const file = req.params.file;

  // Montar un path real para la imagen
  const filePath = "./uploads/avatars/" + file;

  // Comprobar si existe la imagen
  fs.stat(filePath, (error, exists) => {
    if (!exists) {
      return res.status(404).json({
        status: "error",
        message: "No se ha encontrado la imagen",
      });
    }
    // Si la imagen existe, devolverla
    return res.sendFile(path.resolve(filePath));
  });
};
const counters = async (req, res) => {
  // Obtener el ID del usuario autenticado por defecto
  let userId = req.user.id;

  // Si se envía un ID en la URL, se usa ese en su lugar
  if (req.params.id) {
    userId = req.params.id;
  }

  try {
    // Buscar al usuario para mostrar su _id y name
    const user = await User.findById(userId).select("_id name");

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "Usuario no encontrado",
      });
    }

    // Contar a cuántas personas sigue el usuario
    const following = await Follow.countDocuments({ user: userId });

    // Contar cuántas personas siguen al usuario
    const followed = await Follow.countDocuments({ followed: userId });

    // Contar cuántas publicaciones ha hecho el usuario
    const publications = await Publication.countDocuments({ user: userId });

    // Devolver resultados
    return res.status(200).json({
      status: "success",
      user, // Devolvemos el objeto con _id y name
      following,
      followed,
      publications,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Error al contar los seguidores",
      error: error.message,
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Evitar que el admin se elimine a sí mismo
    if (userId === req.user.id) {
      return res.status(400).json({
        status: "error",
        message: "No puedes eliminarte a ti mismo.",
      });
    }

    // Eliminar publicaciones asociadas al usuario
    await Publication.deleteMany({ user: userId });

    // Eliminar relaciones de "seguidores" y "seguidos"
    await Follow.deleteMany({ $or: [{ user: userId }, { followed: userId }] });

    // Buscar y eliminar al usuario
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({
        status: "error",
        message: "Usuario no encontrado o ya fue eliminado",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Usuario y todas las relaciones eliminadas correctamente",
      user: deletedUser,
    });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    return res.status(500).json({
      status: "error",
      message: "Error en el servidor",
    });
  }
};

const changeRole = async (req, res) => {
  try {
    const userId = req.params.id;
    const { newRole } = req.body;

    // Validación simple
    if (!newRole || typeof newRole !== "string") {
      return res.status(400).json({
        status: "error",
        message: "El nuevo rol es obligatorio y debe ser un texto válido.",
      });
    }

    // Buscar y actualizar el rol
    const userUpdated = await User.findByIdAndUpdate(
      userId,
      { role: newRole },
      { new: true }
    ).select("-password");

    if (!userUpdated) {
      return res.status(404).json({
        status: "error",
        message: "Usuario no encontrado",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Rol actualizado correctamente",
      user: userUpdated,
    });
  } catch (error) {
    console.error("Error al cambiar el rol:", error);
    return res.status(500).json({
      status: "error",
      message: "Error del servidor",
    });
  }
};

const listAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" }).select("-password -__v");

    if (admins.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No se encontraron usuarios con rol admin",
      });
    }

    return res.status(200).json({
      status: "success",
      admins,
    });
  } catch (error) {
    console.error("Error al listar admins:", error);
    return res.status(500).json({
      status: "error",
      message: "Error al obtener los usuarios administradores",
    });
  }
};

// Buscar usuarios por nombre o coincidencia parcial
const buscarUsuariosPorNombre = async (req, res) => {
  try {
    const usuarioAutenticadoId = req.user.id;
    const { nombre } = req.body;

    if (!nombre || nombre.trim() === "") {
      return res.status(400).json({
        status: "error",
        message: "El nombre es obligatorio para buscar.",
      });
    }

    // Buscar usuarios por coincidencia de nombre
    const usuarios = await User.find({
      name: { $regex: new RegExp(nombre, "i") },
    }).select("-password -role");

    if (usuarios.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No se encontraron usuarios con ese nombre",
      });
    }

    const resultados = [];

    for (const usuario of usuarios) {
      const usuarioId = usuario._id.toString();

      // Verificar relaciones
      const yoLoSigo = await Follow.findOne({
        user: usuarioAutenticadoId,
        followed: usuarioId,
      });
      const elMeSigue = await Follow.findOne({
        user: usuarioId,
        followed: usuarioAutenticadoId,
      });

      // A quién sigue este usuario
      const sigueA = await Follow.find({ user: usuarioId }).populate(
        "followed",
        "name nick image"
      );

      // Quiénes lo siguen
      const loSiguen = await Follow.find({ followed: usuarioId }).populate(
        "user",
        "name nick image"
      );

      resultados.push({
        ...usuario.toObject(),
        loSigo: !!yoLoSigo,
        meSigue: !!elMeSigue,
        sigueA: sigueA.map((f) => f.followed),
        loSiguen: loSiguen.map((f) => f.user),
      });
    }

    return res.status(200).json({
      status: "success",
      resultados,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Error al buscar usuarios por nombre",
      error: error.message,
    });
  }
};

// Exportar las funciones
module.exports = {
  pruebaUser,
  register,
  login,
  refreshToken,
  profile,
  list,
  update,
  upload,
  avatar,
  counters,
  deleteUser,
  changeRole,
  listAdmins,
  adminRegister,
  buscarUsuariosPorNombre,
};
