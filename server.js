import express, { urlencoded } from 'express'
import router from './route.js'
import mongoose from 'mongoose'


const app=express()



app.use(express.json())
app.use(express.urlencoded({extended:true}))


app.use('/api',router)

const mongodb=async()=>{
    try {
         const res = await mongoose.connect('mongodb://localhost:27017/arbutus')
         console.log('mongodb connected succesful')
    } catch (error) {
        console.log(error)
    }
   
}
mongodb()

app.listen(3000,()=>[
    console.log('server start')
])