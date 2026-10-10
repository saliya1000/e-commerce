# HappyPets Admin Dashboard

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

A powerful, high-performance E-commerce Admin Dashboard tailored for managing premium pet supplies. Designed for scalability and exceptional user experience, the HappyPets dashboard provides administrators with robust tools for order management, bulk product operations, and dynamic reporting.

---

## Table of Contents

1. [Project Overview & Features](#project-overview--features)
2. [Security & Accessibility](#security--accessibility)
3. [Architecture & ERD](#architecture--erd)
4. [Performance Analysis](#performance-analysis)
5. [Getting Started](#getting-started)
6. [Usage Guide](#usage-guide)

---

## Project Overview & Features

HappyPets Admin Dashboard streamlines e-commerce operations with a focus on speed and productivity:

- **Structured Admin Sidebar**: Intuitive navigation layout ensuring quick access to inventory, orders, and customer management.
- **Custom Date PDF Reporting**: Dynamically generate detailed sales and inventory reports in PDF format based on custom date ranges.
- **Bulk Product Upload**: Quickly populate the catalog using CSV bulk import functionality, saving hours of manual data entry.
- **Dual-Status Order Management**: Advanced order tracking that distinctly separates **fulfillment status** (Processing, Shipped, Delivered) from **payment status** (Pending, Paid, Failed) for granular operational control.

---

## Security & Accessibility

### Security Protocols
- **Data Encryption**: All Personally Identifiable Information (PII) and passwords are securely encrypted using industry-standard hashing algorithms (bcrypt).
- **Strict Role-Based Admin Promotion**: Implements the Principle of Least Privilege. Standard admins cannot elevate privileges; only a designated `superadmin` can promote or demote other users.
- **Audit Logging**: Critical administrative actions are tracked for security and compliance.

### Frontend Accessibility
- **Responsive Design**: Flawlessly adapts to any screen size, ranging from **320px mobile devices up to 1440px ultrawide displays**.
- **Visual Scaling**: Fully supports **200% zoom** without breaking layouts or truncating text, ensuring WCAG 2.1 Level A compliance.
- **Keyboard Navigation**: Distinct `:focus-visible` states and semantic HTML structures for complete screen-reader compatibility.

---

## Architecture & ERD

The backend is built on a normalized PostgreSQL database managed by Prisma. It separates domains into clear models to handle users, products, orders, and carts efficiently.

![ERD](./docs/erd.png)

*The database structure maps out a clear relation where Users manage Orders, Cart, and Reviews, while Products are intrinsically linked to Categories, Attributes, and Cart/Order Items. Dual statuses on the Order entity manage the complex e-commerce lifecycle.*

---

## Performance Analysis

We engineered the application to handle high traffic and large datasets seamlessly:

- **Image Optimization**: Uploaded images are compressed, resized, and converted to modern web formats using Sharp before storage.
- **Server-Side Pagination**: API endpoints utilize strict server-side pagination (limit/offset) to ensure fast response times, even with catalogs containing thousands of products.
- **Full-Text Search**: Replaced standard `LIKE` operators with optimized database-level full-text search indexes (`tsvector`), drastically reducing query execution times on large tables.

---

## Getting Started

Follow these step-by-step instructions to set up your local development environment. 

**1. Clone the repository**
```bash
git clone https://github.com/your-username/happypets-admin.git
cd happypets-admin
```

**2. Install dependencies**
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

**3. Environment Setup**
Create your `.env` file from the provided example.
```bash
cp .env.example .env
```
*Ensure you update the `DATABASE_URL` in the `.env` file to point to your local PostgreSQL instance. If using Docker, you can optionally run `docker-compose up -d db` to spin up the database.*

**4. Database Migration & Seeding**
Run Prisma migrations to set up your schema and execute the seed script to create the first master admin account.
```bash
npx prisma migrate dev
npx prisma db seed
```
*(The seed script creates an initial master admin account to access the dashboard).*

**5. Start the Development Servers**
Launch both the backend and frontend concurrently.
```bash
# In the root directory, start the backend API:
npm run dev

# Open a new terminal, navigate to the frontend, and start the Vite server:
cd frontend
npm run dev
```

---

## Usage Guide

### Dual-Status Order Filtering
The dashboard's **Orders** view features a dual-status filtering system. 
1. Navigate to the **Orders** tab via the sidebar.
2. Use the dropdown filters at the top to filter by **Payment Status** (e.g., *Paid*) independently of **Fulfillment Status** (e.g., *Processing*). 
3. This allows you to quickly identify orders that are paid but waiting to be shipped.

### Generating PDF Reports
1. Navigate to the **Reports** section in the admin sidebar.
2. Select your desired start and end dates using the date picker.
3. Choose the report type (e.g., *Sales Summary* or *Inventory Levels*).
4. Click **Export to PDF**. The server will dynamically generate a clean, formatted report and trigger a download to your local machine.
