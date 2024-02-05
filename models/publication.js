const {Schema, model} = require("mongoose")

const PublicationsSchema = Schema({
    user:{
        type: Schema.ObjectId,
        ref: "User"
    },
    text: {
        type:String,
        required: true,
    },
    file: String,
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = model("Publication",PublicationShema,"publications")