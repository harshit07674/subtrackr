import express from 'express'
import morgan from 'morgan'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import route from './routes/index.js';

const app = express();

app.use(cors({
    origin: ['http://localhost:3002', 'http://127.0.0.1:3002', 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    // QUERY is the new RFC 10008 HTTP method — must be listed explicitly or
    // browsers will block the OPTIONS preflight with a CORS error.
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'QUERY'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(cookieParser())
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}))
app.use(express.json())
app.use(morgan("dev"))
app.use(helmet())
app.use('/api/v1', route)

export default app;




