import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') })

if (!process.env.MONGO_URI) {
    throw new Error("database url not defined in your env")
}

if (!process.env.JWS_SECRET) {
    throw new Error("JWT Secret not defined in your env")
}

if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error("google client id not defined in your env")
}

if (!process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error("google client secret not defined in your env")
}

if (!process.env.GOOGLE_REFRESH_TOKEN) {
    throw new Error("google refresh token not defined in your env")
}

if (!process.env.GOOGLE_USER) {
    throw new Error("google user not defined in your env")
}

const config = {
    MONGO_URI: process.env.MONGO_URI,
    PORT: process.env.PORT,
    CRYPT_ALGORITHM: process.env.CRYPT_ALGORITHM,
    JWS_SECRET: process.env.JWS_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN,
    GOOGLE_USER: process.env.GOOGLE_USER,
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173'
}

export default config