import { createRefund } from './src/controllers/admin.controller';

const mockReq = {
  params: { orderId: 'bd23e7db-dd0b-4c95-8dbe-a113086e5261' }, // the PAID order
  body: {},
} as any;

const mockRes = {
  status: function(s: number) {
    this.statusCode = s;
    return this;
  },
  json: function(data: any) {
    console.log('Response:', this.statusCode, data);
    return this;
  }
} as any;

const mockNext = (err: any) => {
  console.error('Error passed to next:', err);
};

async function main() {
  await createRefund(mockReq, mockRes, mockNext);
}

main();
