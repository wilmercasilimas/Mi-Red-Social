const mongoose = require("mongoose");
const Publication = require("../models/publication");
const User = require("../models/user");
const publication = require("../models/publication");
// importar modelo
const fs = require("fs"); // Para borrar archivos
const path = require("path"); // Para manejar rutas de archivos

// importar servicio de follow
const followService = require("../services/followService");

//Acciones de prueba
const pruebaPublication = (req, res) => {
  res.status(200).send({
    message: "Mensaje enviado desde: controllers/publication.js",
  });
};

// Acción para guardar una publicación
const save = async (req, res) => {
  try {
    // Obtener los datos del cuerpo de la petición
    const { text, file } = req.body;

    // Verificar que el texto no esté vacío (es obligatorio)
    if (!text) {
      return res.status(400).json({
        status: "error",
        message: "El texto de la publicación es obligatorio.",
      });
    }

    // Crear una nueva instancia del modelo Publication
    const newPublication = new Publication({
      user: req.user.id, // ID del usuario autenticado (añadido por el middleware de autenticación)
      text, // Texto de la publicación
      file: file || null, // Archivo opcional
    });

    // Guardar la publicación en la base de datos
    const publicationStored = await newPublication.save();

    // Devolver la publicación guardada como respuesta
    return res.status(200).json({
      status: "success",
      message: "Publicación guardada correctamente.",
      publication: publicationStored,
    });
  } catch (error) {
    // En caso de error, devolver un mensaje y el error
    return res.status(500).json({
      status: "error",
      message: "Error al guardar la publicación.",
      error: error.message,
    });
  }
};

// Acción para obtener una publicación en concreto
const detail = async (req, res) => {
  try {
    // Sacar el id de la publicación de la URL
    const publicationId = req.params.id;

    // Buscar la publicación por ID
    const publicationStored = await Publication.findById(publicationId);

    // Si no se encuentra
    if (!publicationStored) {
      return res.status(404).json({
        status: "error",
        message: "No se encontró la publicación.",
      });
    }

    // Si se encuentra, devolverla
    return res.status(200).json({
      status: "success",
      message: "se muerta la publicación",
      publication: publicationStored,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Error al obtener la publicación.",
      error: error.message,
    });
  }
};

// Acción para eliminar una publicación
const remove = async (req, res) => {
  try {
    // Obtener el ID de la publicación desde la URL
    const publicationId = req.params.id;

    // Buscar y eliminar la publicación solo si pertenece al usuario autenticado
    const deletedPublication = await Publication.findOneAndDelete({
      user: req.user.id, // Solo puede eliminar publicaciones suyas
      _id: publicationId, // El ID de la publicación a eliminar
    });

    // Verificar si se encontró y eliminó
    if (!deletedPublication) {
      return res.status(404).json({
        status: "error",
        message:
          "Publicación no encontrada o no tienes permisos para eliminarla.",
      });
    }

    // Si todo sale bien, devolver éxito
    return res.status(200).json({
      status: "success",
      message: "Publicación eliminada correctamente.",
      publication: publicationId, // Devuelve la publicación eliminada si se desea
    });
  } catch (error) {
    // Capturar cualquier error inesperado
    return res.status(500).json({
      status: "error",
      message: "Error al intentar eliminar la publicación.",
      error: error.message,
    });
  }
};

// Acción para listar publicaciones del usuario autenticado con paginación
const user = async (req, res) => {
  try {
    // Obtener el ID del usuario desde la URL
    const userId = req.params.id;

    // Controlar la página
    let page = parseInt(req.params.page) || 1; // Página por defecto en 1
    const itemsPerPage = 5; // Número de publicaciones por página

    // Calcular el salto (skip) para paginación
    const skip = (page - 1) * itemsPerPage;

    // Obtener las publicaciones con paginación
    const publications = await Publication.find({ user: userId })
      .sort("-created_at") // Ordenar por fecha de creación (más recientes primero)
      .skip(skip) // Aplicar el salto para paginación
      .limit(itemsPerPage) // Limitar el número de publicaciones por página
      .populate("user", "-password -__v -role -email"); // Poblamos el usuario, excluyendo campos innecesarios

    // Contar el total de publicaciones para calcular las páginas
    const total = await Publication.countDocuments({ user: userId });

    if (!publications || publications.length <= 0) {
      // Si no hay publicaciones, devolver error
      return res.status(404).json({
        status: "error",
        message: "No hay publicaciones para mostrar.",
      });
    }

    // Devolver la respuesta
    return res.status(200).json({
      status: "success",
      message:
        "Publicaciones del perfil de un usuario obtenidas correctamente.",
      userId: userId, // Información del usuario autenticado (si es necesario)
      currentPage: page,
      total,
      totalPages: Math.ceil(total / itemsPerPage), // Total de páginas
      user: req.user, // Información del usuario autenticado
      publications,
    });
  } catch (error) {
    // Si hay algún error, devolverlo en la respuesta
    return res.status(500).json({
      status: "error",
      message: "Error al obtener las publicaciones.",
      error: error.message,
    });
  }
};

// Subir ficheros
const upload = async (req, res) => {
  // Recoger el ID de la publicación por la URL
  const publicationId = req.params.id;

  // Verificar si se ha subido un archivo
  if (!req.file) {
    return res.status(404).json({
      status: "error",
      message: "No se ha subido ningún imagen",
    });
  }

  // Obtener el nombre original del archivo
  let image = req.file.originalname;

  // Dividir el nombre del archivo para obtener la extensión
  const imageSplit = image.split(".");
  const extension = imageSplit[1].toLowerCase(); // Convertir extensión a minúscula

  // Validar la extensión del archivo
  if (
    extension != "png" &&
    extension != "jpg" &&
    extension != "jpeg" &&
    extension != "gif"
  ) {
    // Eliminar el archivo subido si la extensión no es válida
    const filePath = req.file.path;
    fs.unlinkSync(filePath); // Borrado sincrónico

    // Responder con un error de extensión no válida
    return res.status(400).json({
      status: "error",
      message: "La extensión de la imagen no es válida",
    });
  }

  // Variable para guardar la publicación actualizada
  let publicationUpdate;

  try {
    // Actualizar el campo 'file' de la publicación, si pertenece al usuario autenticado
    publicationUpdate = await Publication.findOneAndUpdate(
      { user: req.user.id, _id: publicationId }, // Condición para buscar la publicación
      { $set: { file: req.file.filename } }, // Archivo a actualizar
      { new: true } // Devolver la publicación actualizada
    );

    // Si no se encuentra la publicación, enviar error
    if (!publicationUpdate) {
      return res.status(404).json({
        status: "error",
        message: "La publicación no existe",
      });
    }

    // Devolver éxito con los datos de la publicación actualizada y el archivo
    return res.status(200).json({
      status: "success",
      publication: publicationUpdate,
      file: req.file, // Información del archivo subido
    });
  } catch (error) {
    // Si ocurre un error inesperado, devolver error 500
    return res.status(500).json({
      status: "error",
      message: "Error al actualizar la imagen",
      error: error.message,
      publicationUpdate, // A veces útil para debug
    });
  }
};

//Devolver archivos multimedia
const media = async (req, res) => {
  // Recibir el parámetro del id de usuario por la URL
  const file = req.params.file;

  // Montar un path real para la imagen
  const filePath = "./uploads/publications/" + file;

  // Comprobar si existe la imagen
  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) {
      return res.status(404).json({
        status: "error",
        message: "No se ha encontrado la imagen",
      });
    }

    return res.sendFile(path.resolve(filePath));
  });
};
const feed = async (req, res) => {
  let page = 1;
  if (req.params.page) {
    page = parseInt(req.params.page);
  }

  let itemsPerPage = 5;

  try {
    const myFollows = await followService.followUserIds(req.user.id);

    const result = await Publication.paginate(
      { user: { $in: myFollows.following } },
      {
        populate: {
          path: "user",
          select: "-password -__v -role -email",
        },
        sort: { created_at: -1 },
        page,
        limit: itemsPerPage,
      }
    );

    // Mover el chequeo aquí
    if (!result || result.docs.length === 0) {
      return res.status(200).json({
        status: "success",
        message: "No hay publicaciones para mostrar.",
        publications: [],
        total: 0,
        page,
        pages: 0,
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Feed de publicaciones",
      following: myFollows.following,
      total: result.totalDocs,
      page: result.page,
      pages: result.totalPages,
      publications: result.docs,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Error al obtener las publicaciones del feed.",
      error: error.message,
    });
  }
};

// ✅ Exportar ambas funciones
module.exports = {
  pruebaPublication,
  save,
  detail,
  remove,
  user,
  upload,
  media,
  feed,
};
