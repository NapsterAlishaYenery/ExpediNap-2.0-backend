// Crear Excursiones
const Excursions = require('../models/excursion.model');

exports.createExcursion = async (req, res) => {

    const {
        name,
        description,
        regularPriceUsd,
        offerPriceUsd,
        location,
        categories,
        duration,
        includes,
        minimumAge,
        itinerary,
        recommendations,
        startingPoint,
        pickupTime,
        images

    } = req.body;

    try {

        //Crear Excursiones
        const newExcursion = await Excursions.create({
            name,
            description,
            regularPriceUsd,
            offerPriceUsd,
            location,
            categories,
            duration,
            includes,
            minimumAge,
            itinerary,
            recommendations,
            startingPoint,
            pickupTime,
            images
        });

        res.status(201).json({
            ok: true,
            data: newExcursion,
            message: 'New Excursion Added successfully'
        });

    } catch (error) {

        // 1. Log completo para TI (desarrollador) en la consola de Node
        console.error('--- EXCURSION ERROR ---');
        console.error(error);

        // 2. Errores de validación de Mongoose (campos faltantes, tipos mal, etc.)
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                message: 'One or more fields are invalid',
            });
        }

        // 3. Error de duplicidad (Nombre ya existe)
        if (error.code === 11000) {
            return res.status(400).json({
                ok: false,
                type: 'DuplicateError',
                message: `The name "${name}" already exists. Please choose another.`
            });
        }

        res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'A critical error occurred on the server'
        });
    }
}

exports.upDateExcursion = async (req, res) => {

    const { id } = req.params;
    const upDate = req.body;

    try {
        const upDateExcursion = await Excursions.findByIdAndUpdate(
            id,
            { $set: upDate },
            { new: true, runValidators: true }
        );

        //Validar si la excursion existe
        if (!upDateExcursion) {
            return res.status(404).json({
                ok: false,
                type: 'ValidationError',
                message: 'Error: The excursion does not exist.',
            });
        }

        res.status(200).json({
            ok: true,
            data: upDateExcursion,
            message: 'Excursion updated correctly'
        });


    } catch (error) {

        // 1. Log completo para TI (desarrollador) en la consola de Node
        console.error('--- EXCURSION ERROR ---');
        console.error(error);

        // 2. Errores de validación de Mongoose (campos faltantes, tipos mal, etc.)
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                message: 'One or more fields are invalid',
            });
        }

        // 3. Error de duplicidad (Nombre ya existe)
        if (error.code === 11000) {
            return res.status(400).json({
                ok: false,
                type: 'DuplicateError',
                message: 'The name already exists. Please choose another.'
            });
        }

        res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'A critical error occurred on the server'
        });
    }
}

exports.deleteExcursion = async (req, res) => {
    const { id } = req.params;

    try {
        const deleteExcursion = await Excursions.findByIdAndDelete(id);

        if (!deleteExcursion) {
            return res.status(404).json({
                ok: false,
                type: 'NotFoundError',
                message: 'Error: The excursion you are trying to delete does not exist.',
            });
        }

        res.status(200).json({
            ok: true,
            data: deleteExcursion,
            message: 'Excursion deleted successfully'
            
        });

    } catch (error) {
        console.error('--- DELETE ERROR ---', error);
        return res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'A critical error occurred while deleting.',
        });
    }
};

exports.getAllExcursions = async (req, res) => {
    try {

        // 1. CAPTURAR PARÁMETROS DE FILTRO Y PAGINACIÓN
        const { name, category, location } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;

        // 2. CONSTRUIR EL OBJETO DE BÚSQUEDA DINÁMICO
        let query = {};

        // Filtro por Nombre: Usa Regex para búsqueda parcial (ej: "saona" encuentra "Saona Island VIP")
        // 'i' significa insensitive (no importa mayúsculas/minúsculas)
        if (name) {
            query.name = { $regex: name, $options: 'i' };
        }

        // Filtro por Categoría: Mongoose busca automáticamente dentro del array
        if (category) {
            query.categories = category.toLowerCase();
        }

        // Filtro por Ubicación (opcional, por si lo necesitas)
        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }



        const skip = (page - 1) * limit; // Cálculo matemático para el desplazamiento

        /**
         * 2. EJECUCIÓN CONCURRENTE (Promise.all)
         * Lanzamos dos tareas independientes al mismo tiempo para ahorrar tiempo de espera.
         * Usamos 'destructuración' [allExcursions, totalItems] para capturar los resultados.
         */
        const [allExcursions, totalItems] = await Promise.all([
            // Tarea A: Buscar los documentos reales con filtros de orden y paginación
            Excursions.find(query)
                .sort({ createdAt: -1 }) // -1 significa descendente (lo más nuevo arriba)
                .skip(skip)              // Salta los registros de páginas anteriores
                .limit(limit),           // Trae solo la cantidad permitida

            // Tarea B: Contar cuántos documentos hay en total en la colección (sin filtros de página)
            Excursions.countDocuments(query)
        ]);

        /**
         * 3. LÓGICA DE METADATOS (Cálculos para el Frontend)
         * Estos datos ayudan a Angular a saber si debe mostrar el botón "Siguiente" o "Anterior".
         */
        const totalPages = Math.ceil(totalItems / limit); // Redondea hacia arriba (ej: 1.1 páginas = 2 páginas)
        const hasNextPage = page < totalPages;            // ¿Hay una página después de esta?
        const hasPrevPage = page > 1;                    // ¿Hay una página antes de esta?

        /**
         * 4. RESPUESTA ESTRUCTURADA
         * Mantenemos el estándar de oro: { ok, data, message, pagination }
         * Esto hace que tu servicio en Angular sea predecible y fácil de tipar.
         */
        return res.status(200).json({
            ok: true,
            data: allExcursions,
            message: totalItems > 0 ? 'Excursions retrieved successfully.' : 'No excursions found for your search.',
            pagination: {
                page,         // Página actual en la que se encuentra el usuario
                limit,        // Tamaño de página solicitado
                totalItems,   // Total de registros en toda la base de datos
                totalPages,   // Total de páginas resultantes
                hasNextPage,  // Booleano para el botón "Next"
                hasPrevPage   // Booleano para el botón "Prev"
            }
        });

    } catch (error) {
        /**
         * 5. GESTIÓN DE ERRORES
         * Si algo falla (ej: la base de datos se cae), el servidor no se detiene,
         * responde con un 500 y loguea el error para el programador.
         */
        console.error('--- GET ALL ERROR ---', error);
        return res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'A critical error occurred on the server.',
        });
    }
}

exports.getExcursionsByID = async (req, res) => {
    const { id } = req.params;
    try {

        const excursion = await Excursions.findById(id);

        if (!excursion) {
            return res.status(404).json({
                ok: false,
                type: 'NotFoundError',
                message: 'The requested excursion does not exist.'
            });
        }

        return res.status(200).json({
            ok: true,
            data: excursion,
            message: 'Excursion retrieved successfully.'
        });

    } catch (error) {

        return res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'A critical error occurred on the server.',
        });
    }
}

