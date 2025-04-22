const { Schema, model } = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2"); // ← importar el plugin

const PublicationSchema = Schema({
  user: {
    type: Schema.ObjectId,
    ref: "User",
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  file: String,
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// ✅ Aplicar el plugin al esquema
PublicationSchema.plugin(mongoosePaginate);

// Exportar el modelo con paginación habilitada
module.exports = model("Publication", PublicationSchema, "publications");
