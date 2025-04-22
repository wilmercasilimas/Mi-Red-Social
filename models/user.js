const { Schema, model } = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2"); // Agregar el plugin de paginación

const UserSchema = Schema({
  name: {
    type: String,
    required: true,
  },
  surname: String,
  bio: String,
  nick: {
    type: String,
    unique: true,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "admin", "moderator"], // Solo permite estos tres valores
    default: "user", // Si no se especifica un rol, se asigna "user" por defecto
  },

  image: {
    type: String,
    default: "default.jpg",
  },
  create_at: {
    type: Date,
    default: Date.now,
  },
});

// Agregar el plugin para la paginación
UserSchema.plugin(mongoosePaginate);

module.exports = model("User", UserSchema, "users");
