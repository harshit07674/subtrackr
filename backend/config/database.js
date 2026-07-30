import mongoose from 'mongoose'
import config from './config.js'

async function connectToDB() {
    await mongoose.connect(config.MONGO_URI, {
        tls: true,
        tlsAllowInvalidCertificates: false,
        autoSelectFamily: false,
    })
    console.log("connected to DB")
}

export default connectToDB;