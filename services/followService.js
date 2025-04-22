const Follow = require("../models/follow");

const followUserIds = async (identityUserId) => {
  try {
    // Obtener los usuarios que sigue
    let following = await Follow.find({ user: identityUserId }).select({
      followed: 1,
      _id: 0,
    });

    // Obtener los usuarios que lo siguen
    let followers = await Follow.find({ followed: identityUserId }).select({
      user: 1,
      _id: 0,
    });

    // Limpiar arrays
    let followingClean = [];
    following.forEach((follow) => {
      if (follow.followed) {
        // Verifica si 'followed' no es undefined
        followingClean.push(follow.followed.toString()); // Usar .toString() en el valor correcto
      }
    });

    let followersClean = [];
    followers.forEach((follow) => {
      if (follow.user) {
        // Verifica si 'user' no es undefined
        followersClean.push(follow.user.toString()); // Usar .toString() en el valor correcto
      }
    });

    return {
      following: followingClean,
      followers: followersClean,
    };
  } catch (error) {
    return {};
  }
};

const followThisUser = async (identityUserId, profileUserId) => {
  try {
    if (identityUserId.toString() === profileUserId.toString()) {
      return {
        siguiendoYo: false,
        meSigue: false,
        followingId: null,
        followerId: null,
        message: "No puedes seguirte a ti mismo.",
      };
    }

    // ¿Estoy siguiendo al usuario del perfil?
    const followingDoc = await Follow.findOne({
      user: identityUserId,
      followed: profileUserId,
    });

    // ¿El usuario del perfil me está siguiendo?
    const followerDoc = await Follow.findOne({
      user: profileUserId,
      followed: identityUserId,
    });

    return {
      followingId: followingDoc ? followingDoc._id : null,  // Aquí devolvemos el _id del documento
      siguiendoYo: !!followingDoc,  // Booleano indicando si estamos siguiendo al usuario
      siguiendoYoDoc: followingDoc ? followingDoc : null,  // El documento completo de "siguiendoYo"
      followerId: followerDoc ? followerDoc._id : null,  // Aquí devolvemos el _id del documento
      meSigue: !!followerDoc,  // Booleano indicando si el usuario nos sigue
      meSigueDoc: followerDoc ? followerDoc : null,  // El documento completo de "meSigue"
      message: "Información de seguimiento obtenida correctamente.",
    };
    
  } catch (error) {
    console.error("Error en followThisUser:", error);
    return {
      siguiendoYo: false,
      meSigue: false,
      followingId: null,
      followerId: null,
      message: "Hubo un error al obtener la información de seguimiento.",
    };
  }
};

module.exports = {
  followUserIds,
  followThisUser,
};
