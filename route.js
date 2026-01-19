import express from 'express'
import drivierrouter from './routes/driverroutes.js'
import riderouter from './routes/rideroutes.js'
const router=express.Router()

router.use('/driver',drivierrouter)
router.use('/rides',riderouter)

export default router