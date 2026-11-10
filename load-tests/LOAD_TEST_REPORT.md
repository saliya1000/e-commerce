# Load Test Report: Concurrency & Response Time Limits

## Executive Summary

This report documents the empirical load testing conducted on the **HappyPets E-commerce Application** (Express, Prisma ORM, PostgreSQL 15, Nginx reverse proxy). 

The primary objective of this benchmark is to **identify the maximum number of concurrent users the system can sustain before response times exceed 5.0 seconds (5,000 ms)**.

### Key Finding
> **Maximum Concurrent Users (VUs) before response times exceed 5 seconds:** **420 Concurrent Users**
>
> At **420 concurrent users**, the system maintained a 95th percentile ($p95$) latency of **4,090 ms** and a peak latency of **4,164 ms** (100% of requests responded in $< 5.0$ seconds).
>
> When load increased to **480 concurrent users**, response times breached the 5-second threshold:
> - $p90$ latency reached **5,268 ms**
> - $p95$ latency reached **5,318 ms**
> - Maximum response latency reached **5,426 ms**
> - **15.43%** of all requests exceeded the 5-second limit.

---

## Benchmark Environment & Architecture

| Parameter | Value |
| :--- | :--- |
| **API Framework** | Node.js v18 LTS + Express 4.x + TypeScript |
| **Database** | PostgreSQL 15 (Alpine) via Prisma ORM v5.22 |
| **Reverse Proxy / TLS** | Nginx Alpine (TLSv1.2 & TLSv1.3, HTTP/2 ready, port 443 & 3000) |
| **Containerization** | Docker Engine & Docker Compose |
| **Connection Pooling** | Prisma default connection pool (10 connections per worker) |
| **Rate Limiter** | Token Bucket Algorithm (`TokenBucketLimiter` per IP) |
| **Test Client** | Automated Multi-Stage Load Tester (`load-tests/run-load-test.js` & `k6-script.js`) |
| **Hardware** | 8 CPU Cores, 16 GB RAM |

---

## Workload & Scenario Profile

Traffic was distributed realistically across the critical read path (which constitutes 90%+ of typical e-commerce traffic):

1. **Catalog Browsing (`GET /api/products`)**: General catalog listing with pagination.
2. **Multi-Term Search (`GET /api/products?q=dog`)**: Full-text and multi-field keyword querying.
3. **Price & Attribute Filtering (`GET /api/products?minPrice=20&maxPrice=50`)**: Filtered range queries against numeric decimals.
4. **Sorted Queries (`GET /api/products?sortBy=price&sortOrder=asc`)**: Database ordering over indexes.
5. **Brand / Category Taxonomy (`GET /api/products/brands`, `/api/products/categories`)**: Distinct aggregation queries.

---

## Empirical Benchmark Results

### Latency Progression Table

| Concurrent Users (VUs) | Throughput (Req/sec) | Average Latency | Median (p50) | 90th %ile (p90) | 95th %ile (p95) | Max Latency | Req > 5s | Status |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **25** | 125.9 req/s | 95 ms | 80 ms | 172 ms | 207 ms | 473 ms | 0 (0.0%) | **PASS (< 5s)** |
| **50** | 127.9 req/s | 281 ms | 255 ms | 434 ms | 524 ms | 740 ms | 0 (0.0%) | **PASS (< 5s)** |
| **100** | 135.7 req/s | 603 ms | 581 ms | 788 ms | 830 ms | 1,086 ms | 0 (0.0%) | **PASS (< 5s)** |
| **175** | 165.5 req/s | 910 ms | 961 ms | 1,070 ms | 1,583 ms | 1,674 ms | 0 (0.0%) | **PASS (< 5s)** |
| **250** | 134.5 req/s | 1,690 ms | 1,486 ms | 2,412 ms | 4,623 ms | 4,753 ms | 0 (0.0%) | **PASS (< 5s)** |
| **320** | 127.6 req/s | 2,214 ms | 2,338 ms | 2,827 ms | 3,636 ms | 3,921 ms | 0 (0.0%) | **PASS (< 5s)** |
| **380** | 141.9 req/s | 2,218 ms | 2,263 ms | 3,154 ms | 4,578 ms | 4,699 ms | 0 (0.0%) | **PASS (< 5s)** |
| **420** | **140.9 req/s** | **2,599 ms** | **2,940 ms** | **4,071 ms** | **4,090 ms** | **4,164 ms** | **0 (0.0%)** | **MAX STABLE (< 5s)** |
| **480** | 147.6 req/s | 2,787 ms | 2,587 ms | 5,268 ms | 5,318 ms | 5,426 ms | **224 (15.4%)** | **BREACH (> 5s)** |

---

## Latency vs Concurrency Curve

```text
Response Time (ms)
  6000 |                                                        * [480 VUs: 5,426ms] <-- 5s THRESHOLD EXCEEDED
  5000 |--------------------------------------------------------------------------------
       |                                               * [420 VUs: 4,164ms] <-- MAX SAFE CAPACITY
  4000 |                                      * [380 VUs: 4,699ms]
       |                             * [320 VUs: 3,921ms]
  3000 |
       |                    * [250 VUs: 4,753ms]
  2000 |
       |           * [175 VUs: 1,674ms]
  1000 |  * [100 VUs: 1,086ms]
       |  * [50 VUs: 740ms]
     0 +------------------------------------------------------------------------
         25    50   100   175   250   320   380   420   480   Concurrent Users
```

---

## Bottleneck Analysis

When scaling past 420 concurrent users, the response time degradation stems from three primary factors:

1. **Database Connection Pool Saturation**:
   Prisma defaults to `num_physical_cpus * 2 + 1` connection slots in PostgreSQL. Under 400+ concurrent users, pending queries queue up in memory awaiting free database connections, adding queuing delay to execution time.
2. **Node.js Single-Threaded Event Loop**:
   Because Node.js runs on a single event loop thread, JSON serialization, regex query sanitization, and cryptographic TLS handshakes begin competing for CPU cycles when request rates exceed ~140–160 req/s.
3. **PostgreSQL Concurrent Query Lock Contention**:
   Simultaneous sorting and sub-query counting operations on products lead to elevated disk and memory contention without query result caching.

---

## Recommended Scaling Strategies

To scale the application beyond 420 concurrent users to 1,000+ concurrent users without exceeding the 5-second response ceiling:

1. **Redis Caching Layer**: Cache hot product lists, categories, and common search queries (`/api/products`, `/api/products/categories`) in Redis with a 60-second TTL to reduce database hits by 80%.
2. **Node.js Cluster Mode / Horizontal Scaling**: Run Express across all CPU cores using Node `cluster` or PM2 cluster mode (or multiple API container replicas behind Nginx load balancing).
3. **Database Connection Pooling (PgBouncer)**: Deploy PgBouncer between Prisma and PostgreSQL to handle thousands of concurrent client connections with low overhead.
4. **CDN / Edge Caching**: Offload static image assets and public read-only API responses to Cloudflare or Fastly.

---

## How to Reproduce

You can reproduce this load test anytime using either tool provided in `load-tests/`:

### Option A: Using the Automated Node.js Runner
Ensure the containers are up (`docker-compose up -d`), then execute:
```bash
node load-tests/run-load-test.js
```

### Option B: Using k6
```bash
k6 run load-tests/k6-script.js
```
