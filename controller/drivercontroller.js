import Driver from "../model/driverschema.js";


//driver register API
export const registerDriver = async (req, res) => {
  try {
    console.log(req.body,'req.body')
    const { name, vehicletype, capacity } = req.body;

   if (!name || !vehicletype || capacity == null) {
      return res.status(400).json({
        message: "Validation error ",
        error: "name, vehicleType, and capacity are required",
      });
    }

  

    const driver = await Driver.create({
        name,
      vehicletype,
      capacity,
      status: "offline",
    });

    return res.status(201).json({
      message: "Driver registered successful",
      driver,
    });
  } catch (error) {
    console.error("registerDriver error:", error);

    
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate error",
        error: "Driver already exists",
      });
    }

    return res.status(500).json({
      message: "Server error ",
      error: error.message || "Something went wrong",
    });
  }
};


//driver detais update API
export const updateDriverLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({
        message: "Validation error ",
        error: "lat and lng are required",
      });
    }

    const driver = await Driver.findByIdAndUpdate(
      id,
      {
          location: { lat, lng }, 
        lastLocationUpdatedAt: new Date(),
      },
      { new: true }
    );

    if (!driver) {
      return res.status(404).json({
        message: "Driver not found ",
      });
    }

    return res.json({
      message: "Driver location updated",
      driver,
    });
  } catch (error) {

    return res.status(500).json({
      message: "Server error ",
      error: error.message,
    });
  }
};

// update driver Status
export const updateDriverStatus = async (req, res) => {
  try {
    const driverId = req.params.id;
    const { status } = req.body;

   
   
    if (!status) {
      return res.status(400).json({
        message: "Validation error",
        error: "status is required",
      });
    }

   const updatedDriver = await Driver.findByIdAndUpdate(
      driverId,
      { status },
      { new: true }
    );

    if (!updatedDriver) {
      return res.status(404).json({
        message: "Driver not found",
      });
    }

    return res.status(200).json({
      message: "Driver status updated",
      driver: updatedDriver,
    });
  } catch (err) {
    console.log("updateDriverStatus error:", err);

    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};


// Get driver details
export const getDriverDetails = async (req, res) => {
  try {
    

    const driver = await Driver.find();

    if (!driver) {
      return res.status(404).json({
        message: "Driver not found ",
      });
    }

    return res.json({
      message: "Driver details ",
      driver,
    });
  } catch (error) {
   
    return res.status(500).json({
      message: "Server error ",
      error: error.message,
    });
  }
};