const { formatAppDate, formatCurrency } = require('../utils/date-format.util');

// Configuración centralizada para evitar errores en el futuro
const COMPANY = {
    phone: "18098369303",
    email: "info@expedinap.com",
    website: "https://www.expedinap.com",
    name: "ExpediNap Team",
    rnc: "028-0091840-7"
};

function buildExcursionInvoiceTemplate(order, isAdmin = false) {
    const {
        orderNumber, customer, pax, pricing, createdAt,
        excursionName, hotelName, hotelNumber, travelDate,
        paypalOrderId, fiscalData // <--- Extraemos fiscalData
    } = order;

    // Detectamos si es PayPal
    const isPayPal = !!paypalOrderId;

    const bookingDateStr = formatAppDate(createdAt);
    const travelDateStr = formatAppDate(travelDate);
    const nombreParaMostrar = (excursionName || "Excursion").toUpperCase();

    // Lógica de NCF (si existe)
    const hasFiscalData = !!fiscalData && !!fiscalData.ncf;
    const ncfLabel = fiscalData?.tipoNcf === 'B16' ? 'EXPORT INVOICE' : 'CONSUMER INVOICE';
    const ncfVencimientoStr = fiscalData?.ncfVencimiento ? formatAppDate(fiscalData.ncfVencimiento) : '';

    // Lógica dinámica
    const statusBarText = isAdmin ? 'ADMIN NOTIFICATION | PAYMENT RECEIVED' : `BOOKED ON: ${bookingDateStr}`;
    const whatsappNumber = isAdmin ? customer.phone.replace(/\D/g, '') : COMPANY.phone.replace(/\D/g, '');
    const buttonText = isAdmin ? 'WHATSAPP CUSTOMER' : 'CONFIRM PICKUP VIA WHATSAPP';
    const whatsappMessage = isAdmin
        ? `Hello ${customer.fullName}, I am contacting you regarding your booking for ${nombreParaMostrar} (Order ${orderNumber})`
        : `Hello, I just paid for the excursion ${nombreParaMostrar}. My order is ${orderNumber}. Could you confirm my pickup time?`;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
            .header { background: #ffffff; padding: 25px; text-align: center; border-bottom: 3px solid #e11d48; }
            .status-bar { background: #f8fafc; padding: 10px 25px; border-bottom: 1px solid #eee; font-size: 12px; color: #64748b; text-align: right; }
            .content { padding: 30px; }
            .section-title { font-size: 14px; font-weight: bold; text-transform: uppercase; color: #1e40af; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
            .info-grid { margin-bottom: 25px; }
            .info-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; display: block; margin-top: 10px; }
            .info-value { font-size: 14px; font-weight: 500; }
            .fiscal-box { background: #f1f5f9; padding: 15px; border-radius: 6px; margin-bottom: 25px; border-left: 4px solid #1e40af; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #f1f5f9; text-align: left; padding: 10px; font-size: 12px; color: #475569; }
            td { padding: 12px 10px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
            .totals { margin-top: 20px; float: right; width: 100%; max-width: 250px; }
            .total-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px; }
            .grand-total { font-size: 18px; font-weight: bold; color: #e11d48; border-top: 2px solid #eee; margin-top: 10px; padding-top: 10px; }
            .footer { background: #1e293b; color: #ffffff; padding: 30px; text-align: center; font-size: 12px; }
            .recommendations { background: #fffbeb; border: 1px dashed #f59e0b; padding: 15px; border-radius: 6px; margin-top: 20px; font-size: 13px; }
            .btn-whatsapp { display: inline-block; background: #25d366; color: white !important; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 15px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="https://res.cloudinary.com/dfwpolska/image/upload/v1769135560/logo-expedinap-horizontal.png" 
                alt="ExpediNap" style="max-width: 250px; height: auto;">
            </div>
            <div class="status-bar">
                ORDER: <strong>${orderNumber}</strong> | ${statusBarText}
            </div>
            <div class="content">
                
                ${hasFiscalData ? `
                <div class="fiscal-box">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div style="padding-right: 10px;">
                            <span class="info-label" style="margin-top:0;">Invoice Type</span>
                            <span class="info-value" style="color: #1e40af; display: block;">${ncfLabel}</span>
                        </div>
                        <div style="text-align: right; padding-left: 20px;">
                            <span class="info-label" style="margin-top:0;">NCF Number</span>
                            <span class="info-value" style="font-family: monospace; font-size: 16px; letter-spacing: 1px; display: block; white-space: nowrap;">${fiscalData.ncf}</span>
                        </div>
                    </div>
                    <div style="margin-top: 10px; font-size: 10px; color: #64748b; border-top: 1px solid #cbd5e1; padding-top: 5px;">
                        NCF Valid until: ${ncfVencimientoStr}
                    </div>
                </div>
                ` : ''}

                <div class="section-title">📍 Tour & Pickup Details</div>
                <div class="info-grid">
                    <span class="info-label">Excursion</span>
                    <span class="info-value" style="font-size: 18px; color: #e11d48;">${nombreParaMostrar}</span>
                    <span class="info-label">Travel Date</span>
                    <span class="info-value" style="color: #1e40af; font-weight: bold;">${travelDateStr}</span>
                </div>

                <div class="section-title">👤 Customer Information</div>
                <div style="margin-bottom: 25px;">
                    <span class="info-label">Name</span>
                    <span class="info-value">${customer.fullName}</span>
                    <span class="info-label">Hotel / Pickup Location</span>
                    <span class="info-value">${hotelName} (Room: ${hotelNumber})</span>
                    <span class="info-label">Contact</span>
                    <span class="info-value">${customer.email} | ${customer.phone}</span>
                </div>

                <div class="section-title">💰 Payment Summary</div>
                <table>
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th style="text-align: center;">Qty</th>
                            <th style="text-align: right;">Unit</th>
                            <th style="text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Adults</td>
                            <td style="text-align: center;">${pax.adults}</td>
                            <td style="text-align: right;">${formatCurrency(pricing.adultPriceSnap)}</td>
                            <td style="text-align: right;">${formatCurrency(pax.adults * pricing.adultPriceSnap)}</td>
                        </tr>
                        ${pax.children > 0 ? `
                        <tr>
                            <td>Children</td>
                            <td style="text-align: center;">${pax.children}</td>
                            <td style="text-align: right;">${formatCurrency(pricing.childPriceSnap)}</td>
                            <td style="text-align: right;">${formatCurrency(pax.children * pricing.childPriceSnap)}</td>
                        </tr>` : ''}
                    </tbody>
                </table>
                <div class="totals">
                    <div class="total-row"><span>Subtotal:</span><span>${formatCurrency(pricing.subtotal)}</span></div>
                    <div class="total-row"><span>Tax (18%):</span><span>${formatCurrency(pricing.tax)}</span></div>
                    <div class="total-row grand-total">
                        <span>${isPayPal ? 'TOTAL PAID: ' : 'TOTAL TO PAY: '}</span>
                        <span>${formatCurrency(pricing.totalPrice)}</span>
                    </div>
                </div>
                <div style="clear: both;"></div>
                <div class="recommendations">
                    ${isAdmin ? `<strong>📢 Admin Action Required:</strong><br>Check availability for the pickup at <b>${hotelName}</b> and send the exact time to the client via WhatsApp.` :
            `<strong>📢 Recommendations:</strong><br>
                    ✅ Sunglasses, hat, and biodegradable sunscreen.<br>
                    ✅ Please arrive 15 minutes before pickup time.<br>
                    ✅ Presentation of this digital receipt is required.`}
                </div>
                <div style="text-align: center; margin-top: 30px;">
                    <p style="font-size: 14px;">${isAdmin ? 'Quick contact with customer:' : 'To confirm your exact pickup time:'}</p>
                    <a href="https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}" class="btn-whatsapp">${buttonText}</a>
                </div>
            </div>
            <div class="footer">
                <strong style="font-size: 16px;">${COMPANY.name}</strong><br>
                Punta Cana, Dominican Republic<br>
                RNC: ${COMPANY.rnc} | <a href="${COMPANY.website}" style="color: #94a3b8; text-decoration: underline;">www.expedinap.com</a><br><br>
                <div style="border-top: 1px solid #475569; padding-top: 15px; margin-top: 15px; font-size: 10px; color: #94a3b8;">
                    ${isAdmin
            ? (isPayPal
                ? `Internal transaction record. PayPal Payment Verified (ID: ${paypalOrderId}).`
                : 'Internal record. MANUAL RESERVATION - Pending payment via WhatsApp/Transfer.')
            : `This is an automatic confirmation. For support contact us at ${COMPANY.email}`
        }
                </div>
            </div>
        </div>
    </body>
    </html>`;
}

function buildTransferInvoiceTemplate(order, isAdmin = false) {
    const {
        orderNumber, customer, transferType, pickUpLocation, destination,
        numPassengers, pickUpDate, flightNumber, arrivalTime, pricing, createdAt,
        fiscalData // <--- Extraemos fiscalData
    } = order;

    const bookingDateStr = formatAppDate(createdAt);
    const travelDateStr = formatAppDate(pickUpDate);
    const isQuoteRequest = !pricing || pricing.totalPrice === 0;

    // Lógica de NCF (si existe)
    const hasFiscalData = !!fiscalData && !!fiscalData.ncf;
    const ncfLabel = fiscalData?.tipoNcf === 'B16' ? 'EXPORT INVOICE' : 'CONSUMER INVOICE';
    const ncfVencimientoStr = fiscalData?.ncfVencimiento ? formatAppDate(fiscalData.ncfVencimiento) : '';

    // Títulos y Colores dinámicos
    const mainTitle = isAdmin ? "NEW TRANSFER REQUEST" : (isQuoteRequest ? "TRANSFER QUOTATION REQUEST" : "TRANSFER BOOKING CONFIRMED");
    const statusColor = isQuoteRequest ? "#0ea5e9" : "#10b981";
    const priceDisplay = isQuoteRequest ? "PENDING QUOTE" : formatCurrency(pricing.totalPrice);

    // Lógica del botón
    const whatsappNumber = isAdmin ? customer.phone.replace(/\D/g, '') : COMPANY.phone.replace(/\D/g, '');
    const buttonText = isAdmin ? 'WHATSAPP CUSTOMER' : (isQuoteRequest ? 'CONTACT AGENT' : 'CONFIRM WITH AGENT');
    const whatsappMessage = isAdmin
        ? `Hello ${customer.fullName}, I am contacting you regarding your ExpediNap transfer request ${orderNumber}`
        : `Hello, I have a question about order ${orderNumber}`;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
            .header { background: #ffffff; padding: 25px; text-align: center; border-bottom: 3px solid #e11d48; }
            .status-bar { background: #f8fafc; padding: 10px 25px; border-bottom: 1px solid #eee; font-size: 12px; color: #64748b; text-align: right; }
            .content { padding: 30px; }
            .section-title { font-size: 14px; font-weight: bold; text-transform: uppercase; color: #1e40af; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
            .info-grid { margin-bottom: 25px; }
            .info-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; display: block; margin-top: 10px; }
            .info-value { font-size: 14px; font-weight: 500; }
            .fiscal-box { background: #f1f5f9; padding: 15px; border-radius: 6px; margin-bottom: 25px; border-left: 4px solid #1e40af; }
            .highlight-box { background: #f1f5f9; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #e11d48; }
            .price-tag { font-size: 24px; font-weight: bold; color: #e11d48; }
            .footer { background: #1e293b; color: #ffffff; padding: 30px; text-align: center; font-size: 12px; }
            .recommendations { background: #fffbeb; border: 1px dashed #f59e0b; padding: 15px; border-radius: 6px; margin-top: 20px; font-size: 13px; }
            .btn-whatsapp { display: inline-block; background: #25d366; color: white !important; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 15px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header"><img src="https://res.cloudinary.com/dfwpolska/image/upload/v1769135560/logo-expedinap-horizontal.png" alt="ExpediNap" style="max-width: 250px; height: auto;"></div>
            <div class="status-bar">ORDER: <strong>${orderNumber}</strong> | ${isAdmin ? 'ADMIN NOTIFICATION' : `REQUESTED ON: ${bookingDateStr}`}</div>
            <div class="content">
                <div style="text-align: center; margin-bottom: 25px;">
                    <h2 style="color: ${statusColor}; margin: 0;">${mainTitle}</h2>
                    <p style="font-size: 14px; color: #64748b;">${transferType.toUpperCase()} TRANSFER</p>
                </div>


                ${hasFiscalData ? `
                    <div class="fiscal-box">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div style="padding-right: 10px;">
                                <span class="info-label" style="margin-top:0;">Invoice Type</span>
                                <span class="info-value" style="color: #1e40af; display: block;">${ncfLabel}</span>
                            </div>
                            <div style="text-align: right; padding-left: 20px;">
                                <span class="info-label" style="margin-top:0;">NCF Number</span>
                                <span class="info-value" style="font-family: monospace; font-size: 16px; letter-spacing: 1px; display: block; white-space: nowrap;">${fiscalData.ncf}</span>
                            </div>
                        </div>
                        <div style="margin-top: 10px; font-size: 10px; color: #64748b; border-top: 1px solid #cbd5e1; padding-top: 5px;">
                            NCF Valid until: ${ncfVencimientoStr}
                        </div>
                    </div>
                    ` : ''}

                <div class="section-title">🚐 Route & Schedule</div>
                <div class="info-grid">
                    <div style="display: flex; justify-content: space-between;">
                        <div style="width: 48%;"><span class="info-label">From</span><span class="info-value">${pickUpLocation}</span></div>
                        <div style="width: 48%;"><span class="info-label">To</span><span class="info-value">${destination}</span></div>
                    </div>
                    <span class="info-label">Date & Pickup Time</span>
                    <span class="info-value" style="color: #1e40af; font-weight: bold;">${travelDateStr}</span>
                    ${flightNumber ? `
                    <div style="display: flex; justify-content: space-between;">
                        <div style="width: 48%;"><span class="info-label">Flight</span><span class="info-value">${flightNumber}</span></div>
                        <div style="width: 48%;"><span class="info-label">Arrival</span><span class="info-value">${arrivalTime}</span></div>
                    </div>` : ''}
                </div>
                <div class="section-title">👤 Passenger Details</div>
                <div class="info-grid">
                    <span class="info-label">Full Name</span><span class="info-value">${customer.fullName}</span>
                    <span class="info-label">Contact</span><span class="info-value">${customer.phone} | ${customer.email}</span>
                    <span class="info-label">Passengers</span><span class="info-value">${numPassengers} Persons</span>
                </div>
                <div class="highlight-box">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: bold; color: #475569;">TOTAL AMOUNT:</span>
                        <span class="price-tag">${priceDisplay}</span>
                    </div>
                </div>
                <div class="recommendations">
                    <strong>📢 Info:</strong><br>
                    ${isAdmin ? 'This is an internal notification. Review the details and contact the client to confirm.' :
            (isQuoteRequest ? '✅ Request received. We will contact you shortly.' : '✅ Price confirmed. Pay the driver in cash or ask for PayPal.')}
                    <br>✅ Our driver will have an <strong>ExpediNap</strong> sign.
                </div>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}" class="btn-whatsapp">
                        ${buttonText}
                    </a>
                    ${isAdmin ? `<br><a href="mailto:${customer.email}" style="font-size: 12px; color: #64748b; display: block; margin-top: 10px;">Send Email to Customer</a>` : ''}
                </div>
            </div>
            <div class="footer">
                <strong style="font-size: 16px;">${COMPANY.name}</strong><br>
                Punta Cana, Dominican Republic<br>
                RNC: ${COMPANY.rnc} | <a href="${COMPANY.website}" style="color: #94a3b8; text-decoration: underline;">www.expedinap.com</a>
            </div>
        </div>
    </body>
    </html>`;
}

function buildYachtInvoiceTemplate(order, isAdmin = false) {
    const {
        orderNumber, customer, yachtName, destination, duration, timeTrip,
        travelDate, pricing, createdAt, status, isAvailable,
        fiscalData // <--- Extraemos fiscalData
    } = order;

    const bookingDateStr = formatAppDate(createdAt);
    const travelDateStr = formatAppDate(travelDate);
    const isConfirmed = status === 'confirmed' && isAvailable;

    // Lógica de NCF (si existe)
    const hasFiscalData = !!fiscalData && !!fiscalData.ncf;
    const ncfLabel = fiscalData?.tipoNcf === 'B16' ? 'EXPORT INVOICE' : 'CONSUMER INVOICE';
    const ncfVencimientoStr = fiscalData?.ncfVencimiento ? formatAppDate(fiscalData.ncfVencimiento) : '';

    // Títulos dinámicos
    const mainTitle = isAdmin ? "NEW YACHT REQUEST" : (isConfirmed ? "YACHT BOOKING CONFIRMED" : "YACHT BOOKING REQUEST");
    const statusColor = isConfirmed ? "#10b981" : "#f59e0b";
    const yachtDisplayName = (yachtName || "Luxury Yacht").toUpperCase();

    // Lógica de Botones (WhatsApp)
    const whatsappNumber = isAdmin ? customer.phone.replace(/\D/g, '') : COMPANY.phone.replace(/\D/g, '');
    const buttonText = isAdmin ? 'WHATSAPP CUSTOMER' : (isConfirmed ? 'VIEW DOCK LOCATION' : 'CONTACT AGENT');
    const whatsappMessage = isAdmin
        ? `Hello ${customer.fullName}, I am contacting you regarding your Yacht booking (${yachtDisplayName}) order ${orderNumber}`
        : `Hello, I have a question about yacht order ${orderNumber}`;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
            .header { background: #ffffff; padding: 25px; text-align: center; border-bottom: 3px solid #e11d48; }
            .status-bar { background: #f8fafc; padding: 10px 25px; border-bottom: 1px solid #eee; font-size: 12px; color: #64748b; text-align: right; }
            .content { padding: 30px; }
            .section-title { font-size: 14px; font-weight: bold; text-transform: uppercase; color: #1e40af; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
            .info-grid { margin-bottom: 25px; }
            .info-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; display: block; margin-top: 10px; }
            .info-value { font-size: 14px; font-weight: 500; }
            .fiscal-box { background: #f1f5f9; padding: 15px; border-radius: 6px; margin-bottom: 25px; border-left: 4px solid #1e40af; }
            .totals { margin-top: 20px; background: #f8fafc; padding: 15px; border-radius: 6px; }
            .total-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px; }
            .grand-total { font-size: 18px; font-weight: bold; color: #e11d48; border-top: 2px solid #eee; margin-top: 10px; padding-top: 10px; }
            .footer { background: #1e293b; color: #ffffff; padding: 30px; text-align: center; font-size: 12px; }
            .recommendations { background: #fffbeb; border: 1px dashed #f59e0b; padding: 15px; border-radius: 6px; margin-top: 20px; font-size: 13px; }
            .btn-whatsapp { display: inline-block; background: #25d366; color: white !important; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 15px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header"><img src="https://res.cloudinary.com/dfwpolska/image/upload/v1769135560/logo-expedinap-horizontal.png" alt="ExpediNap" style="max-width: 250px; height: auto;"></div>
            <div class="status-bar">ORDER: <strong>${orderNumber}</strong> | ${isAdmin ? 'ADMIN NOTIFICATION' : `REQUESTED ON: ${bookingDateStr}`}</div>
            <div class="content">
                <div style="text-align: center; margin-bottom: 25px;">
                    <h2 style="color: ${statusColor}; margin: 0;">${mainTitle}</h2>
                    <p style="font-size: 18px; font-weight: bold; color: #1e293b;">${yachtDisplayName}</p>
                </div>

                ${hasFiscalData ? `
                    <div class="fiscal-box">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div style="padding-right: 10px;">
                                <span class="info-label" style="margin-top:0;">Invoice Type</span>
                                <span class="info-value" style="color: #1e40af; display: block;">${ncfLabel}</span>
                            </div>
                            <div style="text-align: right; padding-left: 20px;">
                                <span class="info-label" style="margin-top:0;">NCF Number</span>
                                <span class="info-value" style="font-family: monospace; font-size: 16px; letter-spacing: 1px; display: block; white-space: nowrap;">${fiscalData.ncf}</span>
                            </div>
                        </div>
                        <div style="margin-top: 10px; font-size: 10px; color: #64748b; border-top: 1px solid #cbd5e1; padding-top: 5px;">
                            NCF Valid until: ${ncfVencimientoStr}
                        </div>
                    </div>
                    ` : ''}

                <div class="section-title">🛥️ Charter Details</div>
                <div class="info-grid">
                    <div style="display: flex; justify-content: space-between;">
                        <div style="width: 48%;"><span class="info-label">Destination</span><span class="info-value">${destination}</span></div>
                        <div style="width: 48%;"><span class="info-label">Travel Date</span><span class="info-value" style="color: #1e40af; font-weight: bold;">${travelDateStr}</span></div>
                    </div>
                    <span class="info-label">Duration & Schedule</span><span class="info-value">${duration} (${timeTrip})</span>
                </div>
                <div class="section-title">👤 Customer Information</div>
                <div class="info-grid">
                    <span class="info-label">Lead Name</span><span class="info-value">${customer.fullName}</span>
                    <span class="info-label">Contact</span><span class="info-value">${customer.email} | ${customer.phone}</span>
                </div>
                <div class="section-title">💰 Financial Summary</div>
                <div class="totals">
                    <div class="total-row"><span>Charter Base:</span><span>${formatCurrency(pricing.basePrice)}</span></div>
                    <div class="total-row"><span>Taxes (18%):</span><span>${formatCurrency(pricing.tax)}</span></div>
                    <div class="total-row grand-total"><span>TOTAL AMOUNT:</span><span>${formatCurrency(pricing.totalPrice)}</span></div>
                </div>
                <div class="recommendations">
                    <strong>📢 Info:</strong><br>
                    ${isAdmin ? 'Review availability and contact the client to finalize the booking.' :
            (isConfirmed ? '✅ <strong>Confirmed!</strong> Arrive 20 mins before departure.' : '⏳ Verifying availability for your date.')}
                    <br>✅ Includes: Crew, fuel, ice, and water.
                </div>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}" class="btn-whatsapp">
                        ${buttonText}
                    </a>
                    ${isAdmin ? `<br><a href="mailto:${customer.email}" style="font-size: 12px; color: #64748b; display: block; margin-top: 10px;">Send Email to Customer</a>` : ''}
                </div>
            </div>
            <div class="footer">
                <strong style="font-size: 16px;">${COMPANY.name}</strong><br>
                Punta Cana, Dominican Republic<br>
                RNC: ${COMPANY.rnc} | <a href="${COMPANY.website}" style="color: #94a3b8; text-decoration: underline;">www.expedinap.com</a>
            </div>
        </div>
    </body>
    </html>`;
}

function buildContactFormTemplate(contactData, isAdmin = false) {
    const { fullName, email, phone, message } = contactData;
    const dateStr = formatAppDate(new Date());


    const titleText = isAdmin ? "NEW INQUIRY RECEIVED" : "MESSAGE CONFIRMATION";
    const greetingText = isAdmin ? "You have a new message from the website:" : "Thanks for reaching out to us!";

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            /* ... (Tus mismos estilos de antes) ... */
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
            .header { background: #ffffff; padding: 25px; text-align: center; border-bottom: 3px solid #e11d48; }
            .status-bar { background: #f8fafc; padding: 10px 25px; border-bottom: 1px solid #eee; font-size: 12px; color: #64748b; text-align: right; }
            .content { padding: 30px; }
            .section-title { font-size: 14px; font-weight: bold; text-transform: uppercase; color: #1e40af; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
            .info-grid { margin-bottom: 25px; background: #f1f5f9; padding: 15px; border-radius: 6px; }
            .info-label { font-size: 11px; color: #64748b; text-transform: uppercase; display: block; margin-top: 5px; }
            .info-value { font-size: 14px; font-weight: 500; color: #1e293b; }
            .message-box { background: #ffffff; border: 1px solid #e2e8f0; padding: 20px; border-radius: 6px; font-style: italic; color: #475569; margin-top: 10px; border-left: 4px solid #1e40af; }
            .footer { background: #1e293b; color: #ffffff; padding: 30px; text-align: center; font-size: 12px; }
            .btn-reply { display: inline-block; background: #e11d48; color: white !important; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="https://res.cloudinary.com/dfwpolska/image/upload/v1769135560/logo-expedinap-horizontal.png" alt="ExpediNap" style="max-width: 220px; height: auto;">
            </div>
            <div class="status-bar">
                ${titleText} | ${dateStr}
            </div>
            <div class="content">
                <div style="text-align: center; margin-bottom: 25px;">
                    <h2 style="color: #1e293b; margin: 0;">${isAdmin ? 'New Contact' : 'Message Received'}</h2>
                    <p style="font-size: 14px; color: #64748b;">${greetingText}</p>
                </div>

                <div class="section-title">👤 Contact Information</div>
                <div class="info-grid">
                    <div style="margin-bottom: 10px;">
                        <span class="info-label">Full Name</span>
                        <span class="info-value">${fullName}</span>
                    </div>
                    <div style="margin-bottom: 10px;">
                        <span class="info-label">Email Address</span>
                        <span class="info-value">${email}</span>
                    </div>
                    <div>
                        <span class="info-label">Phone / WhatsApp</span>
                        <span class="info-value">${phone || 'Not provided'}</span>
                    </div>
                </div>

                <div class="section-title">💬 Message Details</div>
                <div class="message-box">
                    "${message}"
                </div>

                <div style="text-align: center; margin-top: 30px;">
                    <p style="font-size: 13px; color: #64748b;">We usually respond within 24 hours.</p>
                    
                    ${isAdmin ? `
                        <a href="mailto:${email}" class="btn-reply">REPLY TO CUSTOMER</a>
                    ` : ''}
                </div>
            </div>
            <div class="footer">
                <strong style="font-size: 16px;">${COMPANY.name}</strong><br>
                Punta Cana, Dominican Republic<br>
                <a href="${COMPANY.website}" style="color: #94a3b8; text-decoration: underline;">www.expedinap.com</a>
            </div>
        </div>
    </body>
    </html>`;
}
module.exports = {
    buildExcursionInvoiceTemplate,
    buildTransferInvoiceTemplate,
    buildYachtInvoiceTemplate,
    buildContactFormTemplate
};