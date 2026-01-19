import mongoose, { Schema } from "mongoose";


const driverschema=new Schema({
    name:{
      type:String,
      required:[true,'name is required']
    },
    vehicletype:{
        type:String,
          required:[true,'Vehicle Type is required']
    },
   capacity:{
  type:Number,
  required:[true,'capacity is required']
},

    status: {
      type: String,
      enum: ["available", "on_trip", "offline"],
      default: "offline",
      index: true,
    },

  location: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  },

    lastLocationUpdatedAt: { type: Date, default: null },


} ,{ timestamps: true }) 

const Driver=mongoose.model('Driver',driverschema)

export default Driver