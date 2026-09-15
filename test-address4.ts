import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  const address = {
    line1: 'Pellonreuna 15B',
    city: 'Jyväskylä',
    postal_code: '99999',
    country: 'FI',
  };
  
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const url = `https://addressvalidation.googleapis.com/v1:validateAddress?key=${apiKey}`;

  const requestBody = {
    address: {
      regionCode: 'FI',
      addressLines: [address.line1, address.city, address.postal_code],
    },
    enableUspsCass: false,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

test();
