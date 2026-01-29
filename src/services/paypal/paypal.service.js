
const paypal = require("@paypal/checkout-server-sdk");
const { paypalClient } = require("../../config/paypal.config");

/**
 * Crea una orden de pago en PayPal pre-llenando los datos del cliente.
 */
const createPayPalOrder = async (totalAmount, customerData) => {
  try {

    const request = new paypal.orders.OrdersCreateRequest();

  
    request.prefer("return=representation");

    const nameParts = customerData.fullName.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || " ";

  
    request.requestBody({
      intent: "CAPTURE", 
      payer: {
        name: {
          given_name: firstName,
          surname: lastName
        },
        email_address: customerData.email,
        phone: {
          phone_type: "MOBILE",
          phone_number: {
            national_number: customerData.phone.replace(/\D/g, '') 
          }
        }
      },

      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: Number(totalAmount).toFixed(2),
          },
          description: "Buying Excurion - ExpediNap",
        },
      ],

      application_context: {
        brand_name: "EXPEDINAP",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
        payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED"
      }
    });

  
    const response = await paypalClient.execute(request);

    return response.result;

  } catch (error) {
    // Es vital mantener el log de error para debugging en el servidor
    console.error("PayPal Create Order Error:", error.message);
    throw error;
  }
};

/**
 * Captura el pago de una orden autorizada por el cliente.
 */
const capturePayPalOrder = async (paypalOrderId) => {
  try {

    const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);

    request.requestBody({});

    const response = await paypalClient.execute(request);

  
    return response.result;

  } catch (error) {
    console.error("❌ Error capturando pago en PayPal:", error);
    throw error;
  }
};

module.exports = {
  createPayPalOrder,
  capturePayPalOrder,
};