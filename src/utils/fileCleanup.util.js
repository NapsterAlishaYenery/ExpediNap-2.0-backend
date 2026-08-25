const fs = require('fs').promises;
const path = require('path');

const deleteLocalFiles = async (files) => {
    if (!files) return;

    try {
        const pathsToDelete = [];

        // CASO 1: Es un string (una ruta directa)
        if (typeof files === 'string') {
            pathsToDelete.push(files);
        }
        // CASO 2: Es req.file (un solo archivo de Multer)
        else if (files.path) {
            pathsToDelete.push(files.path);
        }
        // CASO 3: Es un ARRAY (req.files con upload.array)
        else if (Array.isArray(files)) {
            files.forEach(file => {
                if (file.path) pathsToDelete.push(file.path);
            });
        }
        // CASO 4: Es un objeto con múltiples campos (req.files con upload.fields)
        else if (typeof files === 'object') {
            Object.values(files).forEach(fileArray => {
                if (Array.isArray(fileArray)) {
                    fileArray.forEach(file => {
                        if (file.path) pathsToDelete.push(file.path);
                    });
                }
            });
        }

        // Ejecutamos todos los borrados en paralelo
        await Promise.all(
            pathsToDelete.map(async (filePath) => {
                try {
                    const absolutePath = path.resolve(filePath);
                    await fs.unlink(absolutePath);
                    console.log(`✅ Temporarily deleted: ${path.basename(absolutePath)}`);
                } catch (err) {
                    console.warn(`⚠️ Could not be deleted: ${filePath}`);
                }
            })
        );

    } catch (error) {
        console.error("❌ Error in the cleaning utility:", error.message);
    }
};

module.exports = deleteLocalFiles;