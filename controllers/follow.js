const mongoose = require("mongoose");
const Follow = require("../models/follow");
const User = require("../models/user");
const followService = require("../services/followService");

const mongoosePaginate = require("mongoose-paginate-v2");

// Acción de prueba
const pruebaFollow = (req, res) => {
  return res.status(200).send({
    message: "Mensaje enviado desde: controllers/follow.js",
  });
};

// Guardar un nuevo follow
const save = async (req, res) => {
  try {
    const { followed } = req.body;
    const identity = req.user;

    // Verificar que el usuario a seguir existe
    const usuarioExistente = await User.findById(followed);
    if (!usuarioExistente) {
      return res.status(404).send({
        status: "error",
        message: "El usuario al que intentas seguir no existe.",
      });
    }

    // Evitar seguirse a sí mismo
    if (identity.id === followed) {
      return res.status(400).send({
        status: "error",
        message: "No puedes seguirte a ti mismo.",
      });
    }

    // Verificar si ya existe la relación
    const existingFollow = await Follow.findOne({
      user: identity.id,
      followed: followed,
    });

    if (existingFollow) {
      return res.status(400).send({
        status: "error",
        message: "Ya estás siguiendo a este usuario.",
      });
    }

    const userToFollow = new Follow({
      user: identity.id,
      followed: followed,
    });

    const followStored = await userToFollow.save();

    if (!followStored) {
      return res.status(500).send({
        status: "error",
        message: "No se ha podido seguir al usuario",
      });
    }

    return res.status(200).send({
      status: "success",
      identity: req.user,
      follow: followStored,
    });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "Error al procesar la solicitud",
      error,
    });
  }
};

// Dejar de seguir a un usuario
const unfollow = async (req, res) => {
  try {
    const userId = req.user.id;
    const followedId = req.params.id;

    // Verificar que el usuario al que se deja de seguir existe
    const usuarioExistente = await User.findById(followedId);
    if (!usuarioExistente) {
      return res.status(404).send({
        status: "error",
        message: "El usuario al que intentas dejar de seguir no existe.",
      });
    }

    const existingFollow = await Follow.findOne({
      user: userId,
      followed: followedId,
    });

    if (!existingFollow) {
      return res.status(404).send({
        status: "error",
        message: "No estás siguiendo a este usuario.",
      });
    }

    const deletedFollow = await Follow.findOneAndDelete({
      user: userId,
      followed: followedId,
    });

    if (deletedFollow) {
      return res.status(200).send({
        status: "success",
        follow: deletedFollow,
        message: "Has dejado de seguir al usuario correctamente.",
      });
    } else {
      return res.status(404).send({
        status: "error",
        message: "No se pudo eliminar el seguimiento.",
      });
    }
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "Error al dejar de seguir al usuario.",
      error: error.message,
    });
  }
};

// Listar a los usuarios que un usuario sigue
const following = async (req, res) => {
  try {
    let userId = req.params.id || req.user.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).send({
        status: "error",
        message: "El ID del usuario no es válido",
      });
    }

    let page = parseInt(req.params.page) || 1;
    const itemsPerPage = 5;

    if (page <= 0 || itemsPerPage <= 0) {
      return res.status(400).send({
        status: "error",
        message: "Los parámetros de paginación no son válidos",
      });
    }

    const result = await Follow.paginate(
      { user: userId },
      {
        populate: [
          { path: "user followed", select: "-password -__v -role -email" },
        ],
        limit: itemsPerPage,
        page: page,
      }
    );

    // Filtrar resultados vacíos o nulos
    result.docs = result.docs.filter(
      (follow) => follow.user && follow.followed
    );

    if (!result || result.docs.length === 0) {
      return res.status(404).send({
        status: "error",
        message: "No se encontraron usuarios seguidos.",
      });
    }

    const followUserIds = await followService.followUserIds(userId);

    return res.status(200).send({
      status: "success",
      message: "Listado de usuarios que sigue este usuario",
      total: result.totalDocs,
      pages: result.totalPages,
      currentPage: result.page,
      follows: result.docs.map((follow) => ({
        user: follow.user || {},
        followed: follow.followed || {},
        create_at: follow.create_at,
      })),
      user_following: followUserIds.following,
      user_follow_me: followUserIds.followers,
    });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "Error al obtener la lista de seguidos",
      error: error.message || error,
    });
  }
};

// Listar a los usuarios que siguen a un usuario
const followers = async (req, res) => {
  try {
    let userId = req.params.id || req.user.id; // Usar el ID del usuario en la URL o el de la sesión

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      // Verificar si el ID es válido
      return res.status(400).send({
        status: "error",
        message: "El ID del usuario no es válido",
      });
    }

    let page = parseInt(req.params.page) || 1; // Paginación: página actual
    const itemsPerPage = 5; // Número de resultados por página

    if (page <= 0 || itemsPerPage <= 0) {
      // Validación de los parámetros de paginación
      return res.status(400).send({
        status: "error",
        message: "Los parámetros de paginación no son válidos",
      });
    }

    // Buscar los seguidores del usuario especificado
    const result = await Follow.paginate(
      { followed: userId }, // Consulta para obtener los seguidores
      {
        populate: [
          { path: "user", select: "-password -__v -role -email" }, // Población de usuarios y seguidos sin campos innecesarios
        ],
        limit: itemsPerPage, // Límite de resultados por página
        page: page, // Página solicitada
      }
    );

    // Filtrar los resultados vacíos o nulos
    result.docs = result.docs.filter(
      (follow) => follow.user && follow.followed
    );

    if (!result || result.docs.length === 0) {
      // Si no hay seguidores
      return res.status(404).send({
        status: "error",
        message: "Este usuario aún no tiene seguidores.",
      });
    }

    // Obtener los IDs de los usuarios que siguen y los que el usuario sigue
    const followUserIds = await followService.followUserIds(req.user.id);

    return res.status(200).send({
      status: "success",
      message: "Listado de usuarios que me siguen",
      total: result.totalDocs, // Total de seguidores
      pages: result.totalPages, // Total de páginas de resultados
      currentPage: result.page, // Página actual
      follows: result.docs.map((follow) => ({
        user: follow.user || {}, // Usuario que sigue
        followed: follow.followed || {}, // Usuario seguido
        create_at: follow.create_at, // Fecha de creación del seguimiento
      })),
      user_following: followUserIds.following, // Usuarios que sigue el usuario
      user_follow_me: followUserIds.followers, // Usuarios que siguen al usuario
    });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "Error al obtener la lista de seguidores",
      error: error.message || error,
    });
  }
};

// Exportar acciones
module.exports = {
  pruebaFollow,
  save,
  unfollow,
  following,
  followers,
};
