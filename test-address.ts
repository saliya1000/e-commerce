import { validateAddressWithGoogle } from './src/utils/googleMapsValidator';

// Load .env
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  console.log('Testing with a completely fake address...');
  const badAddress = {
    line1: '999 Nowhere Fake Street',
    city: 'FakeCityville',
    postal_code: '00000',
    country: 'FI',
  };
  const badResult = await validateAddressWithGoogle(badAddress);
  console.log('Bad Address Result:', badResult);

  console.log('\nTesting with a real address...');
  const goodAddress = {
    line1: 'Mannerheimintie 1',
    city: 'Helsinki',
    postal_code: '00100',
    country: 'FI',
  };
  const goodResult = await validateAddressWithGoogle(goodAddress);
  console.log('Good Address Result:', goodResult);
}

test();
