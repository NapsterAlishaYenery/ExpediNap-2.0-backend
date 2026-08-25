// src/services/cloudinary.service.js
const cloudinary = require('../config/cloudinary');
const fs = require('fs').promises; // Para eliminar archivos temporales

/**
 * Sube un archivo a Cloudinary
 * @param {string} filePath - Ruta temporal del archivo
 * @param {string} folder - Carpeta base (ej: 'excursions', 'yachts')
 * @param {string} subFolder - Subcarpeta específica (ej: 'saona-island')
 */
exports.uploadFile = async (filePath, folder, subFolder = null) => {
    try {

        // Construir la ruta completa en Cloudinary
        let cloudinaryFolder = `Excuriones-Expedinap/${folder}`;
        if (subFolder) {
            cloudinaryFolder = `${cloudinaryFolder}/${subFolder}`;
        }

        const result = await cloudinary.uploader.upload(filePath, {
            folder: cloudinaryFolder,
            use_filename: true,
            unique_filename: true,
            overwrite: true,
            resource_type: 'auto',
        });

        return {
            public_id: result.public_id,
            url: result.secure_url,
            width: result.width,
            height: result.height,
            format: result.format,
            resource_type: result.resource_type, // 'image' o 'video'
            duration: result.duration || null
        };

    } catch (error) {
        console.error(' Cloudinary Service Error:', error.message);
        throw new Error('Error uploading the file to the cloud');
    }
};

/**
 * Elimina un archivo de Cloudinary
 * @param {string} public_id - El ID público del archivo
 */
exports.deleteFile = async (public_id, resource_type = 'image') => {
    try {
        const result = await cloudinary.uploader.destroy(public_id, {
            resource_type: resource_type,
            invalidate: true
        });
        console.log(` File deleted from Cloudinary: ${public_id}`);
        return result;
    } catch (error) {
        console.error(' Error deleting from Cloudinary:', error.message);
        throw new Error('Error deleting the file from the cloud');
    }
};