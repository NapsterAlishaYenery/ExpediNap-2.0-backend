// Dependencias principales y de seguridad
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();
const path = require('path');

// Importar middleware de limitacion global
const globalLimiter = require('./middleware/globalLimiter.middleware');

// Importar la conexion
const conectarMongoDBAltas = require('./config/db');

// Importar las rutas
const excursionRoutes = require('./routes/excrusions.route');
const userRoutes = require('./routes/users.route');
const yachtRoutes = require('./routes/yacht.route');
const blogsRoutes = require('./routes/blog.routes');


// Crear el server
const app = express();

// Configurar el Limiter global
app.use(globalLimiter);

// Configurar el proxy
app.set('trust proxy', 1);


// Configuarar CORS 
const allowedOrigins = [
    "http://localhost:4200",
    process.env.FRONTEND_ULR
]

app.use(cors({
    origin: (origin, callback) => {
        // Permitir Postman y herramientas sin origin
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        callback(new Error("CORS not allowed"));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))

// Configuara Middlewares globales
app.use(helmet());
app.use(compression());
app.use(express.json());

// Conectar a Mongo
conectarMongoDBAltas();

// Usara las rutas
app.use('/api/excursions', excursionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/yachts', yachtRoutes);
app.use('/api/blogs',blogsRoutes);

// Configurar Middleware global de errores
app.use((err, req, res, next) => {
    console.error("Global Server Error:", err.message);
    res.status(500).json({ error: "Internal server error captured in the global error middleware" });
})

// Configurar CORS para imageneso o archivos estaticos de la app
const corsStaticOptions = {
    origin: allowedOrigins,
    credentials: true
};

app.use('/uploads', (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
},
    express.static(path.join(__dirname, '../uploads'))
);

// configurar el puesto del servidor
const port = process.env.PORT || 4000;

// Iniciar el server
app.listen(port, ()=>{
    console.log(`Server running on port ${port} ExpediNap Ready`);
});

