const mongoose = require('mongoose');
require('dotenv').config();

const conectarMongoDBAltas =  async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Conectado a MongoDB Atlas Para ExpediNap');
    } catch (error){
        console.error('Error al conectar a MongoDB:', error.message);
        process.exit(1); // Forzar cierre si falla

    }
}

module.exports= conectarMongoDBAltas