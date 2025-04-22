const { Schema, model } = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const FollowSchema = Schema({
  user: {
    type: Schema.ObjectId,
    ref: "User", // Referencia al modelo User
    required: true,
  },
  followed: {
    type: Schema.ObjectId,
    ref: "User", // Referencia al modelo User
    required: true,
  },

  create_at: {
    type: Date,
    default: Date.now,
  },
});

// Agregar el plugin mongoose-paginate-v2 al esquema
FollowSchema.plugin(mongoosePaginate);

module.exports = model("Follow", FollowSchema, "follow");
