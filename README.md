# ecomsite

Full-stack e-commerce site built on the existing_proj architecture: Express 5 + MongoDB backend (CommonJS, layered as controllers -> services -> models) and a Vite + React frontend.

Product data comes from a mock API (https://fakestoreapi.com) that is fetched once and seeded into MongoDB. After seeding, the concrete system serves everything: real JWT auth, carts and orders stored in the database.

## Structure

```
app.js                    express entry, mounts /api/users /api/products /api/cart /api/orders
config/db.js              mongoose connection
models/                   user, otp, product, cart, order schemas
services/                 business logic per domain
controllers/              request/response handlers per domain
routes/                   endpoint wiring with authenticate/authorize middleware
middleware/               JWT authentication + role authorization (customer/admin)
jwt/token.service.js      JWT sign/verify
email/                    nodemailer + OTP password-reset service and templates
mock/                     mockApi.js (fakestoreapi fetch) + seed.js (seeds products + admin)
src/                      React frontend (App.jsx single-page app, api.js fetch client)
```

## Running

1. Set the environment variables in `.env` (MONGODB_URI, JWT_SECRET, EMAIL_USER, EMAIL_PASS).
2. Seed the catalog and admin account (needs internet for fakestoreapi):

   ```
   npm run seed
   ```

3. Backend:

   ```
   npm start
   ```

4. Frontend (separate terminal):

   ```
   npm run dev
   ```

Default admin login (overridable via ADMIN_EMAIL / ADMIN_PASSWORD in `.env`):

- email: admin@ecomsite.com
- password: admin123

## Roles

- customer: browse/search products, add to cart, checkout, view own orders
- admin: everything above restricted to /api/products writes and /api/orders management (product create/update/soft-delete, view all orders, change order status)
