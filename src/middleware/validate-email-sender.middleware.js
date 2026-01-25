

const CAMPOS_PERMITIDOS_EMAIL = [
    'fullName',
    'email',
    'phone',
    'message'
];

const validateEmailSender = {

    emailSend: (req, res, next) => {
        const data = req.body;

        const camposObligatorios = [
            'fullName',
            'email',
            'phone',
            'message'
        ];

        for (const campo of camposObligatorios) {
            if (!data[campo]) {
                return res.status(400).json({
                    ok: false,
                    type: 'ValidationError',
                    message: `The field '${campo}' is required.`
                });
            }
        }

        if (data.email && !/\S+@\S+\.\S+/.test(data.email)) {
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                message: 'Invalid email format.'
            });
        }



        const filteredData = {};
        CAMPOS_PERMITIDOS_EMAIL.forEach(campo => {
            if (data[campo] !== undefined) {
                filteredData[campo] = typeof data[campo] === 'string' ? data[campo].trim() : data[campo];
            }
        });
        req.body = filteredData;


        next();
    },
};

module.exports = validateEmailSender;