const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// Filtro de archivos (imágenes y videos)
const fileFilter = (req, file, cb) => {
    // Lista de MIME types válidos (incluyendo octet-stream)
    const validMimeTypes = [
        // Imágenes
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
        'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff',
        'image/x-icon', 'image/vnd.microsoft.icon',
        // Videos
        'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo',
        'video/x-matroska', 'video/webm', 'video/ogg', 'video/avi',
        'video/x-flv', 'video/3gpp', 'video/3gpp2',
        // ⭐ NUEVO: Para archivos que no son detectados correctamente
        'application/octet-stream'
    ];

    // Verificar por extensión (FALLBACK más robusto)
    const ext = path.extname(file.originalname).toLowerCase();
    const validExtensions = [
        '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp',
        '.tiff', '.svg', '.ico',
        '.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv',
        '.3gp', '.mpeg', '.mpg', '.m4v'
    ];

    const isValidMime = validMimeTypes.includes(file.mimetype);
    const isValidExt = validExtensions.includes(ext);

    // Log para diagnóstico
    console.log(`📎 Archivo: ${file.originalname}`);
    console.log(`   MIME Type: ${file.mimetype}`);
    console.log(`   Extensión: ${ext}`);
    console.log(`   ¿MIME válido? ${isValidMime}`);
    console.log(`   ¿Ext válida? ${isValidExt}`);

    // ACEPTAR si: MIME válido O (es octet-stream Y tiene extensión válida)
    if (isValidMime || (file.mimetype === 'application/octet-stream' && isValidExt)) {
        cb(null, true);
    } else {
        cb(new Error(
            `El archivo "${file.originalname}" It is not a valid image or video. ` +
            `MIME: ${file.mimetype}, Ext: ${ext}`
        ), false);
    }
};

// Límite de tamaño aumentado para videos (50MB)
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100 MB
    }
});

module.exports = upload;