const { Schema, model } = require('mongoose');

const NcfPoolSchema = new Schema({
   ncf: {
    type: String,
    required: [true, 'The NCF number is mandatory'],
    unique: true,
    trim: true,
    uppercase: true,
    // Validación de 11 caracteres: 
    // Empieza con B, seguido de 01, 02, 11 o 16, y termina en 8 números.
    validate: {
      validator: function(v) {
        return /^B(01|02|11|16)\d{8}$/.test(v);
      },
      message: props => `${props.value} This is not a valid NCF format (e.g., B0200000001)`
    }
  },
    tipoNcf: {
        type: String,
        required: true,
        enum: ['B01', 'B02', 'B11', 'B16'], // Crédito Fiscal, Consumo, Compra, Exportación
        default: 'B02'
    },
    estado: {
        type: String,
        enum: ['available', 'used', 'expired', 'reserved'],
        default: 'available',
        index: true
    },
    fechaVencimiento: {
        type: Date,
        required: [true, 'The expiration date is mandatory']
    },
    // Relación para saber quién usó este número
    orderId: {
        type: String,
        ref: 'excursionsOrders',
        default: null
    },
    usadoEn: {
        type: Date,
        default: null
    }
}, { 
    timestamps: true,
    versionKey: false 
});

// Índice compuesto para buscar rápido el próximo número disponible por tipo
NcfPoolSchema.index({ tipoNcf: 1, estado: 1, createdAt: 1 });

NcfPoolSchema.pre('save', function() {
  if (this.ncf && !this.tipoNcf) {
    this.tipoNcf = 'B' + this.ncf.substring(1, 3);
  }
});

module.exports = model("ncfPool", NcfPoolSchema);