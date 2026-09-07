import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt, encryptJson, decryptJson } from './utils/encryption';

const basePrisma = new PrismaClient();

const prisma = basePrisma.$extends({
  query: {
    address: {
      async $allOperations({ operation, args, query }) {
        if (args && (args as any).data) {
          const data = (args as any).data;
          if (data.addressLine1) data.addressLine1 = encrypt(data.addressLine1 as string);
          if (data.addressLine2) data.addressLine2 = encrypt(data.addressLine2 as string);
          if (data.city) data.city = encrypt(data.city as string);
          if (data.state) data.state = encrypt(data.state as string);
          if (data.postalCode) data.postalCode = encrypt(data.postalCode as string);
        }
        
        // Handle nested create/update payloads if necessary...
        // For simplicity, we cover direct operations.

        const result = await query(args);

        const decryptAddress = (addr: any) => {
          if (!addr) return addr;
          if (addr.addressLine1) addr.addressLine1 = decrypt(addr.addressLine1);
          if (addr.addressLine2) addr.addressLine2 = decrypt(addr.addressLine2);
          if (addr.city) addr.city = decrypt(addr.city);
          if (addr.state) addr.state = decrypt(addr.state);
          if (addr.postalCode) addr.postalCode = decrypt(addr.postalCode);
          return addr;
        };

        if (Array.isArray(result)) {
          return result.map(decryptAddress);
        }
        return decryptAddress(result);
      }
    },
    order: {
      async $allOperations({ operation, args, query }) {
        if (args && (args as any).data) {
          const data = (args as any).data;
          if (data.shippingAddress) {
            // Because we changed it from Json to String in Schema,
            // the controller might still be sending a JSON object or string.
            // We ensure it gets converted to an encrypted string.
            if (typeof data.shippingAddress === 'string') {
               // Assuming it's already a stringified JSON
               data.shippingAddress = encrypt(data.shippingAddress);
            } else {
               data.shippingAddress = encryptJson(data.shippingAddress);
            }
          }
        }

        const result = await query(args);

        const decryptOrder = (ord: any) => {
          if (!ord) return ord;
          if (ord.shippingAddress && typeof ord.shippingAddress === 'string') {
             // decrypt to JSON object for application layer
             ord.shippingAddress = decryptJson(ord.shippingAddress);
          }
          if (ord.payments && Array.isArray(ord.payments)) {
             ord.payments = ord.payments.map((pay: any) => {
                 if (pay.transactionId) pay.transactionId = decrypt(pay.transactionId);
                 return pay;
             });
          }
          return ord;
        };

        if (Array.isArray(result)) {
          return result.map(decryptOrder);
        }
        return decryptOrder(result);
      }
    },
    payment: {
      async $allOperations({ operation, args, query }) {
        if (args && (args as any).data) {
          const data = (args as any).data;
          if (data.transactionId) {
            data.transactionId = encrypt(data.transactionId as string);
          }
        }

        const result = await query(args);

        const decryptPayment = (pay: any) => {
          if (!pay) return pay;
          if (pay.transactionId) pay.transactionId = decrypt(pay.transactionId);
          return pay;
        };

        if (Array.isArray(result)) {
          return result.map(decryptPayment);
        }
        return decryptPayment(result);
      }
    }
  }
});

export default prisma;
