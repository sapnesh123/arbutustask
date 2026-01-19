import mongoose from "mongoose";

const rideSchema = new mongoose.Schema(
  {
    pickuplocation: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },

    droplocation: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },

    passengerCount: { type: Number, required: true, min: 1 },

    status: {
      type: String,
      enum: ["pending", "assigned", "accepted", "started", "completed", "cancelled", "failed"],
      default: "pending",
      index: true,
    },

   
    Driver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },

   
    attemptedDrivers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Driver",
      },
    ],

    attemptCount: { type: Number, default: 0 },

    cancelInfo: {
      cancelledBy: {
        type: String,
        enum: ["passenger", "driver", null],
        default: null,
      },
      reason: { type: String, default: "" },
      cancelledAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

const Ride = mongoose.model("Ride", rideSchema);
export default Ride;
