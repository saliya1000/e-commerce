import { validateAddressWithGoogle } from './src/utils/googleMapsValidator';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  const address = {
    line1: 'Pellonreuna 15B',
    city: 'Jyväskylä',
    postal_code: '99999',
    country: 'FI',
  };
  const result = await validateAddressWithGoogle(address);
  console.log('Result:', result);
}

test();
