import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  insecureSkipTLSVerify: true,
  stages: [
    { duration: '20s', target: 50 },   // Warm-up to 50 users
    { duration: '30s', target: 100 },  // Scale to 100 users
    { duration: '30s', target: 250 },  // Scale to 250 users
    { duration: '40s', target: 420 },  // Sustained load at max capacity (420 users)
    { duration: '30s', target: 480 },  // Stress load beyond capacity (480 users)
    { duration: '20s', target: 0 },    // Ramp-down to 0
  ],
  thresholds: {
    // Primary requirement: response time must not exceed 5000ms (5 seconds)
    http_req_duration: ['p(95)<5000'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.TARGET_URL || 'https://localhost:3000/api';

const ENDPOINTS = [
  '/products',
  '/products?q=dog',
  '/products?sortBy=price&sortOrder=asc',
  '/products?minPrice=20&maxPrice=50',
  '/products/brands',
  '/products/categories',
];

export default function () {
  const endpoint = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)];
  const clientIp = `10.200.${Math.floor(__VU / 250)}.${(__VU % 250) + 1}`;

  const params = {
    headers: {
      'User-Agent': 'k6-load-test/1.0',
      'X-Forwarded-For': clientIp,
    },
  };

  const res = http.get(`${BASE_URL}${endpoint}`, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response under 5 seconds': (r) => r.timings.duration < 5000,
  });

  sleep(0.5);
}
