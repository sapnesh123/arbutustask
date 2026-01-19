import express from 'express'
import * as ridecontroller from '../controller/ridecontroller.js'
const riderouter=express.Router()

riderouter.post('/request',ridecontroller.createRideRequest)
riderouter.post('/:id',ridecontroller.createRideRequest)
riderouter.patch('/:id/accept',ridecontroller.acceptRide)
riderouter.patch('/:id/start',ridecontroller.startRide)
riderouter.patch('/:id/rject',ridecontroller.startRide)
riderouter.patch('/:id/complete',ridecontroller.completeRide)
riderouter.patch('/:id/cancel',ridecontroller.cancelRide)
riderouter.get('/active',ridecontroller.getActiveRides)



export default riderouter