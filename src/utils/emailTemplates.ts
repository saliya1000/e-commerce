export const generateOrderEmailHtml = (order: any): string => {
  const customerName = order.shippingAddress?.name || 'Valued Customer';
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const subtotal = Number(order.totalAmount) - Number(order.shippingCost || 0);
  const shippingCost = Number(order.shippingCost || 0);
  const finalTotal = Number(order.totalAmount);
  const orderEmail = order.user?.email || order.shippingAddress?.email || '';
  const trackLink = `${process.env.CLIENT_URL || 'http://localhost:3000'}/track-order?orderId=${order.id}&email=${encodeURIComponent(orderEmail)}`;

  const itemsHtml = order.items.map((item: any) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <strong>${item.product.name}</strong>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
        $${(Number(item.price) * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9f9fa; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-top: 40px; margin-bottom: 40px; }
        .header { background-color: #FF7F50; color: #ffffff; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .header h2 { margin: 10px 0 0; font-size: 18px; font-weight: 400; opacity: 0.9; }
        .content { padding: 30px; color: #333333; }
        .content h3 { color: #20B2AA; font-size: 18px; margin-top: 0; }
        .order-info { background-color: #f4f6f8; padding: 15px; border-radius: 6px; margin-bottom: 25px; }
        .order-info p { margin: 5px 0; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
        th { background-color: #f4f6f8; color: #555555; padding: 12px; text-align: left; font-size: 14px; }
        td { font-size: 15px; color: #333333; }
        .totals-container { margin-left: auto; width: 50%; }
        .totals-table { width: 100%; border-collapse: collapse; }
        .totals-table td { padding: 8px; }
        .totals-table .total-row td { font-weight: bold; color: #FF7F50; font-size: 18px; border-top: 2px solid #eee; padding-top: 15px; }
        .shipping-details { margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
        .shipping-details p { margin: 5px 0; font-size: 14px; color: #555555; }
        .footer { background-color: #f4f6f8; color: #777777; padding: 20px; text-align: center; font-size: 13px; }
        .footer p { margin: 5px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>HappyPets</h1>
          <h2>Order Confirmed!</h2>
        </div>
        <div class="content">
          <p>Hi ${customerName},</p>
          <p>Thank you for shopping with HappyPets! We are thrilled to confirm that your order has been successfully placed. Here are the details:</p>
          
          <div class="order-info">
            <p><strong>Order ID:</strong> ${order.id}</p>
            <p><strong>Order Date:</strong> ${orderDate}</p>
            <div style="margin-top: 15px;">
              <a href="${trackLink}" style="display: inline-block; background-color: #20B2AA; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px;">Track Your Order</a>
            </div>
          </div>
          
          <h3>Items Purchased</h3>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div class="totals-container">
            <table class="totals-table">
              <tr>
                <td>Subtotal:</td>
                <td style="text-align: right;">$${subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Shipping:</td>
                <td style="text-align: right;">$${shippingCost.toFixed(2)}</td>
              </tr>
              <tr class="total-row">
                <td>Total:</td>
                <td style="text-align: right;">$${finalTotal.toFixed(2)}</td>
              </tr>
            </table>
          </div>
          
          <div class="shipping-details">
            <h3>Shipping Details</h3>
            <p><strong>${customerName}</strong></p>
            <p>${order.shippingAddress?.line1 || ''}</p>
            ${order.shippingAddress?.line2 ? `<p>${order.shippingAddress.line2}</p>` : ''}
            <p>${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.postal_code || ''}</p>
            <p>${order.shippingAddress?.country || ''}</p>
          </div>
        </div>
        <div class="footer">
          <p>Thank you for giving your pets the best with HappyPets!</p>
          <p>&copy; ${new Date().getFullYear()} HappyPets. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const generatePaymentFailedEmailHtml = (order: any): string => {
  const customerName = order.shippingAddress?.name || 'Valued Customer';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Payment Failed</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9f9fa; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-top: 40px; margin-bottom: 40px; }
        .header { background-color: #EF4444; color: #ffffff; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .header h2 { margin: 10px 0 0; font-size: 18px; font-weight: 400; opacity: 0.9; }
        .content { padding: 30px; color: #333333; }
        .content h3 { color: #EF4444; font-size: 18px; margin-top: 0; }
        .order-info { background-color: #f4f6f8; padding: 15px; border-radius: 6px; margin-bottom: 25px; border-left: 4px solid #EF4444; }
        .order-info p { margin: 5px 0; font-size: 14px; }
        .footer { background-color: #f4f6f8; color: #777777; padding: 20px; text-align: center; font-size: 13px; }
        .footer p { margin: 5px 0; }
        .action-button { display: inline-block; background-color: #FF7F50; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>HappyPets</h1>
          <h2>Payment Unsuccessful</h2>
        </div>
        <div class="content">
          <p>Hi ${customerName},</p>
          <p>We encountered an issue processing the payment for your recent order attempt. Don't worry, your cart is still saved on our website, but the order has not been placed.</p>
          
          <div class="order-info">
            <p><strong>Order ID:</strong> ${order.id}</p>
            <p><strong>Status:</strong> Payment Failed</p>
          </div>
          
          <p>Please double-check your payment method details or try using a different card to complete your purchase.</p>
          
          <div style="text-align: center;">
            <a href="${process.env.CLIENT_URL}/cart" class="action-button">Return to Checkout</a>
          </div>
        </div>
        <div class="footer">
          <p>If you need assistance, our support team is always here to help.</p>
          <p>&copy; ${new Date().getFullYear()} HappyPets. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const generateRefundEmailHtml = (order: any): string => {
  const customerName = order.shippingAddress?.name || 'Valued Customer';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Cancelled & Refunded</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9f9fa; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-top: 40px; margin-bottom: 40px; }
        .header { background-color: #64748B; color: #ffffff; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .header h2 { margin: 10px 0 0; font-size: 18px; font-weight: 400; opacity: 0.9; }
        .content { padding: 30px; color: #333333; }
        .content h3 { color: #64748B; font-size: 18px; margin-top: 0; }
        .order-info { background-color: #f4f6f8; padding: 15px; border-radius: 6px; margin-bottom: 25px; border-left: 4px solid #64748B; }
        .order-info p { margin: 5px 0; font-size: 14px; }
        .footer { background-color: #f4f6f8; color: #777777; padding: 20px; text-align: center; font-size: 13px; }
        .footer p { margin: 5px 0; }
        .action-button { display: inline-block; background-color: #FF7F50; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>HappyPets</h1>
          <h2>Order Cancelled & Refunded</h2>
        </div>
        <div class="content">
          <p>Hi ${customerName},</p>
          <p>Your order has been successfully cancelled and a full refund has been issued to your original payment method.</p>
          
          <div class="order-info">
            <p><strong>Order ID:</strong> ${order.id}</p>
            <p><strong>Refund Amount:</strong> $${Number(order.totalAmount).toFixed(2)}</p>
            <p><strong>Status:</strong> Cancelled & Refunded</p>
            ${order.cancelReason ? `<p><strong>Reason:</strong> ${order.cancelReason}</p>` : ''}
          </div>
          
          <p>Please allow 3-5 business days for the refund to reflect on your bank statement. If you have any questions, feel free to contact us.</p>
          
          <div style="text-align: center;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}" class="action-button">Return to Store</a>
          </div>
        </div>
        <div class="footer">
          <p>If you need assistance, our support team is always here to help.</p>
          <p>&copy; ${new Date().getFullYear()} HappyPets. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
