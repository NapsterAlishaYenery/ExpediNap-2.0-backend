// src/utils/sanitize-folder-name.js
const slugify = require('slugify');

/**
 * Convierte un nombre en un nombre de carpeta válido para Cloudinary
 * Ejemplo: "Saona Island VIP Tour" → "saona-island-vip-tour"
 */
const sanitizeFolderName = (name) => {
    return slugify(name, {
        lower: true,        // → todo minúsculas
        strict: true,       // → solo caracteres válidos (a-z, 0-9, -)
        remove: /[*+~.()'"!:@]/g // → eliminar caracteres especiales
    });
};

module.exports = sanitizeFolderName;