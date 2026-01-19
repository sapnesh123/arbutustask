import mongoose from "mongoose";
import Driver from "../model/driverschema.js";
import Ride from "../model/rideschema.js";

//  distance (KM)
const distanceKm = (lat1, lng1, lat2, lng2) => {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const createRideRequest = async (req, res) => {
  try {
    
    let { pickupLat, pickupLng, dropoffLat, dropoffLng, passengerCount } =
      req.body;

    pickupLat = Number(pickupLat);
    pickupLng = Number(pickupLng);
    dropoffLat = Number(dropoffLat);
    dropoffLng = Number(dropoffLng);
    passengerCount = Number(passengerCount);


    if (
      Number.isNaN(pickupLat) ||
      Number.isNaN(pickupLng) ||
      Number.isNaN(dropoffLat) ||
      Number.isNaN(dropoffLng) ||
      Number.isNaN(passengerCount)
    ) {
      return res.status(400).json({
        message: "Validation error",
        error: "pickupLat, pickupLng, dropoffLat, dropoffLng, passengerCount must be valid numbers",
      });
    }

    if (passengerCount <= 0) {
      return res.status(400).json({
        message: "Validation error",
        error: "passengerCount must be > 0",
      });
    }


    const ride = await Ride.create({
      pickuplocation: { lat: pickupLat, lng: pickupLng },
      droplocation: { lat: dropoffLat, lng: dropoffLng },
      passengerCount,
      status: "pending",
    });

  
    const drivers = await Driver.find({
      status: "available",
      capacity: { $gte: passengerCount },
    }).lean();

    console.log("passengerCount:", passengerCount);
    console.log("drivers found:", drivers.length);

    if (!drivers.length) {
      ride.status = "failed";
      await ride.save();

      return res.status(200).json({
        message: "No drivers available",
        ride,
      });
    }

   
    let nearestDriver = null;
    let nearestDist = Infinity;

    for (const d of drivers) {
      if (!d.location || d.location.lat == null || d.location.lng == null) continue;

      const dist = distanceKm(
        pickupLat,
        pickupLng,
        Number(d.location.lat),
        Number(d.location.lng)
      );

 
      console.log("driver:", d._id, "dist:", dist);

      if (dist <= 5 && dist < nearestDist) {
        nearestDist = dist;
        nearestDriver = d;
      }
    }

    if (!nearestDriver) {
      ride.status = "failed";
      await ride.save();

      return res.status(200).json({
        message: "No drivers within 5km",
        ride,
      });
    }

 
    const lockedDriver = await Driver.findOneAndUpdate(
      { _id: nearestDriver._id, status: "available" },
      { $set: { status: "on_trip" } },
      { new: true }
    );

    if (!lockedDriver) {
      ride.status = "failed";
      await ride.save();

      return res.status(200).json({
        message: "Driver already taken",
        ride,
      });
    }

    
    ride.status = "assigned";
    ride.Driver_id = lockedDriver._id;
    ride.attemptedDrivers = [lockedDriver._id];
    ride.attemptCount = 1;

    await ride.save();

    return res.status(201).json({
      message: "Ride created & driver assigned",
      ride,
      assignedDriver: lockedDriver,
      distanceKm: Number(nearestDist.toFixed(2)),
    });
  } catch (err) {
    console.log("createRideRequest error:", err);

    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};




// acceptride
export const acceptRide = async (req, res) => {
  try {
   const rideId = req.params.id
    const { driverId } = req.body;

    if (!driverId) {
      return res.status(400).json({
        message: "Validation error",
        error: "driverId is required",
      });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    // ride must be assigned
    if (ride.status !== "assigned") {
      return res.status(400).json({
        message: "Invalid ride state",
        error: `Ride is currently '${ride.status}', cannot accept.`,
      });
    }

    // must be assigned to same driver
    if (!ride.Driver_id || String(ride.Driver_id) !== String(driverId)) {
      return res.status(403).json({
        message: "Not allowed",
        error: "This ride is not assigned to this driver",
      });
    }

    ride.status = "accepted";
    await ride.save();

    return res.status(200).json({
      message: "Ride accepted",
      ride,
    });
  } catch (err) {
    console.log("acceptRide error:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

//ride statr api
export const startRide = async (req, res) => {
  try {
   const rideId = req.params.id; 
    const { driverId } = req.body;
    console.log('rideId',rideId)
  
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    if (ride.status !== "accepted") {
      return res.status(400).json({
        message: "Invalid ride state",
        error: "Ride must be accepted before start",
      });
    }

    if (String(ride.Driver_id) !== String(driverId)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    ride.status = "started";
    await ride.save();

    res.status(200).json({ message: "Ride started", ride });
  } catch (err) {
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};



export const completeRide = async (req, res) => {
  try {
    const rideId = req.params.id;
    const { driverId } = req.body;

    if (!driverId) {
      return res.status(400).json({
        message: "Validation error",
        error: "driverId is required",
      });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

  
    if (ride.status !== "started") {
      return res.status(400).json({
        message: "Invalid ride state",
        error: `Ride is '${ride.status}', cannot complete`,
      });
    }

   
    if (!ride.Driver_id || String(ride.Driver_id) !== String(driverId)) {
      return res.status(403).json({
        message: "Not allowed",
        error: "This ride is not assigned to this driver",
      });
    }

    //  mark ride completed
    ride.status = "completed";
    await ride.save();

    //  release driver
    await Driver.findByIdAndUpdate(driverId, { status: "available" });

    return res.status(200).json({
      message: "Ride completed",
      ride,
    });
  } catch (err) {
    console.log("completeRide error:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};




export const cancelRide = async (req, res) => {
  try {
    const rideId = req.params.id;
    const { cancelledBy, reason } = req.body;

    if (!cancelledBy || !["passenger", "driver"].includes(cancelledBy)) {
      return res.status(400).json({
        message: "Validation error",
        error: "cancelledBy must be passenger | driver",
      });
    }

    if (!reason) {
      return res.status(400).json({
        message: "Validation error",
        error: "reason is required",
      });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

   
    if (["completed", "cancelled", "failed"].includes(ride.status)) {
      return res.status(400).json({
        message: "Invalid ride state",
        error: `Ride already '${ride.status}', cannot cancel`,
      });
    }

    ride.status = "cancelled";
    ride.cancelInfo = {
      cancelledBy,
      reason,
      cancelledAt: new Date(),
    };

    await ride.save();

 
    if (ride.Driver_id) {
      await Driver.findByIdAndUpdate(ride.Driver_id, { status: "available" });
    }

    return res.status(200).json({
      message: "Ride cancelled",
      ride,
    });
  } catch (err) {
    console.log("cancelRide error:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

export const getActiveRides = async (req, res) => {
  try {
    const activeRides = await Ride.find({
      status: { $in: ["pending", "assigned", "accepted", "started"] },
    })
      .populate("Driver_id", "name status vehicletype capacity location")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Active rides list",
      total: activeRides.length,
      rides: activeRides,
    });
  } catch (err) {
    console.log("getActiveRides error:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};