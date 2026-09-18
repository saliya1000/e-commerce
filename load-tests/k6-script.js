import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 }, // Ramp-up to 50 users
    { duration: '1m', target: 50 },  // Stay at 50 users
    { duration: '30s', target: 0 },  // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(90)<2000'], // 90% of requests must complete within 2s
    http_req_failed: ['rate<0.05'],    // Error rate must be less than 5%
  },
};

const BASE_URL = 'http://localhost:3000/api';

export default function () {
  // 1. Browse product catalog
  let res = http.get(`${BASE_URL}/products`);
  check(res, { 'status was 200 (products)': (r) => r.status === 200 });
  sleep(1);

  // 2. Search for products
  res = http.get(`${BASE_URL}/products?q=dog`);
  check(res, { 'status was 200 (search)': (r) => r.status === 200 });
  sleep(1);

  // Note: Registration/Checkout would require dynamic payload parsing and DB cleanup
  // For the sake of this test scenario, we focus on heavy read traffic 
  // (which is 90% of e-commerce traffic).
}
