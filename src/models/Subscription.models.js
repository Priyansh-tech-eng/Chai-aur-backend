import mongoose, {Schema} from "mongoose"
import { User } from "./user.models"

const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId, //one who subscribing
        ref: "User"
    },
    Channel: {
        type: Schema.Types.ObjectId, //one to whom subscriber is subscribing
        ref: "User"
    },


    
}, {timestamps: true})



export const Subscription  = mongoose.model("Subscription", subscriptionSchema)