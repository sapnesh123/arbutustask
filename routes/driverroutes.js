import express from 'express'
import * as drivercontroller from '../controller/drivercontroller.js'
const drivierrouter=express.Router()

drivierrouter.post('/register',drivercontroller.registerDriver)
drivierrouter.patch('/:id/location',drivercontroller.updateDriverLocation)
drivierrouter.patch('/:id/status',drivercontroller.updateDriverStatus)
drivierrouter.get('/',drivercontroller.getDriverDetails)

export default drivierrouter