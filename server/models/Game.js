//Saves games to mongoDB
const mongoose = require("mongoose")
const gameSchema = new mongoose.Schema(
    {
        whitePlayer: {
            userId: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
            username: "String",
            elo: Number
        },
        blackPlayer: {
            userId: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
            username: "String",
            elo: Number
        },
        result: {
            type: String,
            enum: ["white", "black", "draw"],
            required: true
        },
        endReason: {
            type: String,
            default: "checkmate"
        },
        moves: [String],
        duration: Number,
        whiteEloChange: Number,
        blackEloChange: Number
    },
    {timestamps: true} //shows real time of creation
)

module.exports = mongoose.model("Game", gameSchema)