# The Everything

The Everything is a full-stack e-commerce application. The browser client is a React single-page app built with Vite. The API is an Express application backed by MongoDB through Mongoose.

Customers can browse a seeded product catalogue, search and filter products, manage a cart, apply coupon codes, place orders, and view order status. Administrators can manage products, coupons, and order status.

## Contents

- [Technology](#technology)
- [Project structure](#project-structure)
- [Requirements](#requirements)
- [Configuration](#configuration)
- [Install and run](#install-and-run)
- [Application architecture and flows](#application-architecture-and-flows)
- [Frontend functions and components](#frontend-functions-and-components)
- [Backend functions and helpers](#backend-functions-and-helpers)
- [API conventions](#api-conventions)
- [API reference](#api-reference)
- [Data models](#data-models)
- [Seed data](#seed-data)
- [Scripts and checks](#scripts-and-checks)
- [Troubleshooting](#troubleshooting)

## Technology

- **Frontend:** React 19, Vite 8, JavaScript, CSS
- **Backend:** Node.js, Express 5 (CommonJS)
- **Database:** MongoDB, Mongoose
- **Authentication:** JWT, `jsonwebtoken`, `bcryptjs`
- **Password reset email:** Nodemailer with Gmail transport
- **Development:** Nodemon, ESLint

## Project structure

```text
app.js                         Express application, middleware, and API route mounting
config/db.js                   MongoDB connection
controllers/                   HTTP request handlers and response formatting
email/email.service.js         Password-reset OTP creation, validation, and email delivery
email/templates/               Password-reset email template
jwt/token.service.js           JWT signing and verification
middleware/authenticate.js     Bearer-token authentication
middleware/authorize.js        Role checks
mock/mockApi.js                Fake Store API product importer
mock/seed.js                   Catalogue, coupon, and admin seeding script
models/                        Mongoose schemas
routes/                        Express route definitions
services/                      Application/domain operations
services/Slideshow.jsx         Featured product carousel component
src/App.jsx                    Main React app, views, and UI event handlers
src/api.js                     Frontend API client and local-storage helpers
src/App.css                    Application styles and responsive layouts
src/index.css                  Root element sizing
src/main.jsx                   React application entry point
public/                        Static public assets
```

The backend follows a route → controller → service → model flow. `app.js` mounts the route modules under `/api`; controllers translate HTTP requests into service calls and JSON responses; services perform the application logic and use Mongoose models for persistence.

## Requirements

- Node.js with npm
- A reachable MongoDB instance and database connection string
- Gmail credentials suitable for Nodemailer if password-reset email is required
- Internet access when running the seed script, which imports products from Fake Store API

## Configuration

Create a `.env` file at the project root. Do not commit credentials or production secrets.

```dotenv
PORT=2000
MONGODB_URI=mongodb://127.0.0.1:27017/ecomsite
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1d

EMAIL_USER=your-gmail-address
EMAIL_PASS=your-gmail-app-password

ADMIN_EMAIL=admin@ecomsite.com
ADMIN_PASSWORD=replace-this-before-seeding
```

| Variable | Purpose |
|---|---|
| `PORT` | Express listening port. Defaults to `2000`; the Vite development proxy reads this value too. |
| `VITE_API_URL` | Frontend API base URL for production builds, including `/api` (for example `https://api.example.com/api`). Set this in Vercel's project environment variables and redeploy. |
| `MONGODB_URI` | MongoDB connection string. `MONGODB_URL` is also accepted by the database connection helper. |
| `JWT_SECRET` | Secret used to sign and verify access tokens. Set a strong, private value. |
| `JWT_EXPIRES_IN` | JWT lifetime accepted by `jsonwebtoken` (for example `1d`). Defaults to `1d`. |
| `EMAIL_USER` | Gmail account used as the sender for password reset messages. |
| `EMAIL_PASS` | Gmail app password used by Nodemailer. |
| `ADMIN_EMAIL` | Email address for the admin account created by seeding. Defaults to `admin@ecomsite.com`. |
| `ADMIN_PASSWORD` | Password for the seeded admin account. The code has a development fallback of `admin123`; override it and protect the credentials. |

`dotenv` loads the environment in the server and seed process. Vite reads `PORT` for its local `/api` proxy; the browser client itself uses `/api` during development. A production frontend build uses `VITE_API_URL`; if it is not set, the current development tunnel URL in `src/api.js` is used as a fallback. Set `VITE_API_URL` in Vercel for production, including the `/api` suffix, then redeploy because Vite embeds `VITE_*` variables at build time.

The JWT service has a development fallback secret if `JWT_SECRET` is omitted. Always configure a private, strong `JWT_SECRET` outside local development. Admin accounts should be provisioned through trusted account-management processes.

## Install and run

Install dependencies:

```bash
npm install
```

Configure `.env`, then seed the catalogue and initial admin/coupon:

```bash
npm run seed
```

Start the backend and frontend in separate terminals:

```bash
# Terminal 1: Express API (with Nodemon)
npm start

# Terminal 2: Vite development server
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`). Wait for the backend to report both a successful MongoDB connection and that it is listening before using the frontend. The Vite proxy forwards browser requests at `/api/*` to `http://127.0.0.1:$PORT`.

The default seeded admin credentials are `admin@ecomsite.com` / `admin123` only when the corresponding environment variables are not set. Change these defaults before using the app outside a disposable local environment.

## Application architecture and flows

### Startup and API requests

1. `npm start` runs `app.js` using Nodemon.
2. `app.js` loads `.env`, installs JSON body parsing and CORS response headers, mounts the route modules, and connects to MongoDB.
3. Express starts listening on `PORT` after MongoDB connects.
4. In development, the browser calls relative `/api/...` URLs. Vite proxies these requests to local Express at `127.0.0.1:$PORT`, avoiding a separate browser-to-API origin.
5. In production, `src/api.js` uses `VITE_API_URL` instead of the Vite proxy. Set it in the frontend host's build environment.

### Signup and login

The signup view posts the user's name, email, password, and optional address/phone. The user service normalizes the email and hashes the password with bcrypt before storing it. Login checks the credentials and account state, then returns a JWT and user object. The client stores the token and user in local storage and sends the token in an `Authorization: Bearer ...` header for authenticated API calls.

The client uses `ecomsite_token` and `ecomsite_user` as its local-storage keys. Logging out removes both values and clears the in-memory cart.

### Product browsing

The shop initially requests products using the selected category and debounced search term. Search input is debounced by 250 ms. The product endpoint returns `{ products }`; category names are fetched separately from `/api/products/categories`. Selecting a product opens its detail view. Product stock is shown in the UI and is validated again by the API when changing cart contents or placing an order.

### Cart and checkout

Authenticated customers and admins can read and modify their own cart. Cart items reference products and are populated with current product data when read. The cart view computes a display subtotal and coupon discount; the server recalculates the order subtotal, discount, and total at checkout from database product prices.

At order creation, the server verifies that every cart product remains available and has enough stock, snapshots product details into order items, validates an optional coupon, creates the order, decrements stock, and empties the cart. The client then refreshes its view and navigates to orders.

### Orders and administration

Users can list their own orders. Admins can list all orders and change their status. The admin view also provides product create/edit/soft-delete operations and coupon create/delete operations. Product and coupon list data is refreshed after changes.

### Password reset

The forgot-password flow asks the API to create a one-time code and email it using Nodemailer. The code expires after 10 minutes and is marked used after a successful reset. The user submits the code, email, and new password to complete the reset.

## Frontend functions and components

### API client (`src/api.js`)

The exported `api` object contains these operations:

| Function | Purpose |
|---|---|
| `signup(payload)` | Create an account. |
| `login(payload)` | Authenticate and return a user and JWT. |
| `forgotPassword(payload)` | Request a password-reset code by email. |
| `resetPassword(payload)` | Set a new password using the emailed code. |
| `updateProfile(payload)` | Update the current account profile. |
| `deleteProfile()` | Soft-delete the current account. |
| `getProducts(params)` | List products with optional `category` and `search` query parameters. |
| `getCategories()` | List distinct product categories. |
| `createProduct(payload)` | Create a product (admin). |
| `updateProduct(id, payload)` | Update a product (admin). |
| `deleteProduct(id)` | Soft-delete a product (admin). |
| `getCart()` | Read the current user's cart. |
| `addToCart(productId, quantity)` | Add a product quantity to the cart. |
| `updateCartItem(productId, quantity)` | Set a cart item's quantity. |
| `removeCartItem(productId)` | Remove a product from the cart. |
| `clearCart()` | Empty the current user's cart. |
| `validateCoupon(code)` | Validate a coupon for the current user. |
| `getCoupons()` | List coupons (admin). |
| `createCoupon(payload)` | Create a coupon (admin). |
| `deleteCoupon(code)` | Delete a coupon (admin). |
| `placeOrder(shippingAddress, couponCode)` | Place an order from the cart. |
| `getMyOrders()` | List orders belonging to the current user. |
| `getAllOrders()` | List all orders (admin). |
| `updateOrderStatus(id, status)` | Update an order's status (admin). |

The shared `request(path, options)` helper serializes JSON bodies, adds the stored bearer token when `auth` is enabled, parses JSON responses, and throws an `Error` for non-success HTTP responses.

Other exports in `src/api.js`:

- `getToken()` / `setToken(token)`: read, store, or remove the JWT.
- `getSavedUser()` / `saveUser(user)`: read, store, or remove the cached user.

### React app (`src/App.jsx`)

`App` owns the current view and shared user, product, cart, order, and coupon state. It loads products when category/search changes, loads the cart when the user changes, and loads orders/admin data when those views are opened. Its event handlers cover login, logout, cart operations, data refresh, and user notifications.

| Component/helper | Responsibility |
|---|---|
| `money(value)` | Format numeric values as INR currency. |
| `App` | Root component, navigation, shared state, initial/conditional data loading, and view selection. |
| `showToast(text)` | Display a short-lived status message. |
| `handleLoginResult(result)` | Store the login token and user, then open the shop. |
| `handleLogout()` | Clear saved authentication/user/cart state. |
| `handleAddToCart(product, quantity)` | Require login, add an item, and refresh cart state. |
| `handleCartUpdate(productId, quantity)` | Persist a cart quantity change. |
| `handleCartRemove(productId)` | Remove a cart item. |
| `navClass(name, extra)` | Build the active navigation button class. |
| `Stepper` | Bounded quantity controls used in product/cart views. |
| `ShopView` | Search, category filters, loading/empty states, product grid, and quick add. |
| `ProductView` | Product details, stock status, quantity selection, and add-to-cart action. |
| `CartView` | Cart quantity updates, coupon validation, totals, address entry, and checkout. |
| `OrdersView` | Display order summary, status, item snapshots, and shipping address. |
| `AuthView` | Signup, login, and password reset forms. |
| `AdminView` | Product CRUD, coupon management, and order-status controls. |

`Slideshow` in `services/Slideshow.jsx` rotates through up to five products, pauses while hovered, and provides previous/next and dot controls. It receives the product list, a currency formatter, and an `onOpen(product)` callback from `App`.

## Backend functions and helpers

Routes call controller methods; controllers handle HTTP requests, delegate application logic, and format responses/errors. Most service methods are asynchronous because they read or write MongoDB.

| Module | Functions | Responsibility |
|---|---|---|
| `UserController` | `signup`, `login`, `updateProfile`, `deleteProfile`, `forgotPassword`, `resetPassword` | Handle user/auth HTTP requests and map service errors to HTTP responses. |
| `UserService` | `userSignup`, `loginUser`, `updateProfile`, `softDelete`, `deleteUser`, `requestPasswordReset`, `resetPassword`, `getUserFromToken` | Create accounts, hash/check passwords, issue login data, update/deactivate profiles, delegate reset email work, and resolve token claims to a current user. `deleteUser` is a hard-delete helper but is not exposed as an API route. |
| `ProductController` | `getProducts`, `getCategories`, `getProductById`, `createProduct`, `updateProduct`, `deleteProduct` | Handle catalogue HTTP requests. |
| `ProductService` | `getAllProducts`, `getCategories`, `getProductById`, `createProduct`, `updateProduct`, `softDelete` | Query/filter catalogue data, validate IDs, persist product changes, and soft-delete products. |
| `CartController` | `getCart`, `addItem`, `updateItem`, `removeItem`, `clearCart` | Handle cart HTTP requests. |
| `CartService` | `getCart`, `addItem`, `updateItem`, `removeItem`, `clearCart` | Find/create a per-user cart, populate product references, enforce stock limits, and modify item quantities. |
| `OrderController` | `createOrder`, `getMyOrders`, `getAllOrders`, `updateStatus` | Handle checkout and order HTTP requests. |
| `OrderService` | `createOrder`, `getOrders`, `getAllOrders`, `updateStatus` | Validate cart inventory/coupons, calculate and save orders, decrement stock, empty carts, list orders, and update status. |
| `EmailService` | `generateotp`, `sendMail`, `requestPasswordReset`, `resetPassword` | Generate a code, deliver the reset email, expire/consume codes, and update password hashes. |
| `TokenService` | `generateToken`, `verifyToken` | Sign and verify JWTs using the configured secret and expiry. |
| Middleware | `authenticate(req, res, next)`, `authorize(...roles)` | Authenticate bearer tokens, attach the current user to the request, and enforce role access. |
| Database helper | `connectDB()` | Connect to MongoDB before the server starts listening. |
| Seed API client | `MockApi.getProducts()` | Fetch Fake Store API products and map them to local product fields. |

## API conventions

- Base path: `/api`
- Request and response bodies use JSON.
- Authenticated requests use `Authorization: Bearer <JWT>`.
- Success responses are generally JSON objects with resource keys such as `product`, `products`, `cart`, `order`, or `orders`.
- Error responses generally contain `{ "message": "..." }`. Some password-reset handlers use an `error` field instead.
- Common authorization errors: `401` means a missing/invalid/expired token; `403` means the authenticated role is not allowed.
- Product writes and order administration require the `admin` role. Cart operations, coupon validation, and personal order routes require an authenticated `customer` or `admin`.

## API reference

### Users — `/api/users`

| Method and path | Access | Request body | Success response |
|---|---|---|---|
| `POST /signup` | Public | `{ "name", "email", "password", "address?", "phone?" }` | `201 { "message", "user" }` |
| `POST /login` | Public | `{ "email", "password" }` | `200 { "message", "user", "token" }` |
| `POST /forgotPassword` | Public | `{ "email" }` | `200 { "success", "message", "email" }` |
| `POST /resetPassword` | Public | `{ "email", "otp", "newPassword" }` | `200 { "success", "message", "email" }` |
| `PATCH /updateprofile` | Customer or admin | Any of `{ "name", "email", "password", "address", "phone" }` | `200 { "user" }` |
| `DELETE /deleteprofile` | Customer or admin | None | `200 { "message": "Account deleted" }` |

Signup hashes passwords before storage; login returns the bearer token used by subsequent protected calls. Password reset codes are sent to the email address via the configured email service.

### Products — `/api/products`

| Method and path | Access | Request body/query | Success response |
|---|---|---|---|
| `GET /` | Public | Optional query: `category`, `search` | `200 { "products": [...] }` |
| `GET /categories` | Public | None | `200 { "categories": [...] }` |
| `GET /:id` | Public | Product ID in path | `200 { "product": {...} }` |
| `POST /` | Admin | Product fields | `201 { "message", "product" }` |
| `PATCH /:id` | Admin | Product fields to update | `200 { "product": {...} }` |
| `DELETE /:id` | Admin | Product ID in path | `200 { "message": "Product deleted" }` |

Product fields are `title`, `description`, `price`, `category`, `image`, `rating`, and `stock`. The admin interface sends title, description, price, category, image URL, and stock. Delete is a soft delete; deleted products are excluded from public listings.

Example:

```http
GET /api/products?category=electronics&search=drive
```

### Cart — `/api/cart`

All cart routes require an authenticated customer or admin.

| Method and path | Request body | Success response |
|---|---|---|
| `GET /` | None | `200 { "cart": {...} }` |
| `POST /items` | `{ "productId": "...", "quantity": 1 }` | `200 { "message", "cart" }` |
| `PATCH /items` | `{ "productId": "...", "quantity": 2 }` | `200 { "message", "cart" }` |
| `DELETE /items/:productId` | None | `200 { "message", "cart" }` |
| `DELETE /` | None | `200 { "message": "Cart cleared" }` |

The `GET` and item mutation responses include cart items with their referenced product data populated. Quantities must be at least one when adding; an update quantity below one removes the item. Inventory limits are checked against current product stock.

### Coupons — `/api/coupons`

| Method and path | Access | Request body | Success response |
|---|---|---|---|
| `POST /validate` | Customer or admin | `{ "code": "WELCOME10" }` | `200 { "code", "discountPercentage" }` |
| `GET /` | Admin | None | `200 { "coupons": [...] }` |
| `POST /` | Admin | `{ "code": "SAVE20", "discountPercentage": 20 }` | `201 { "message", "coupon" }` |
| `DELETE /:code` | Admin | Coupon code in path | `200 { "message": "Coupon deleted successfully" }` |

Codes are trimmed and normalized to uppercase. A coupon is rejected if it does not exist, is inactive, or has expired. Discount percentage must be from 1 through 100 according to the coupon model.

### Orders — `/api/orders`

| Method and path | Access | Request body | Success response |
|---|---|---|---|
| `POST /` | Customer or admin | `{ "shippingAddress": "...", "couponCode?": "WELCOME10" }` | `201 { "message": "Order placed", "order": {...} }` |
| `GET /me` | Customer or admin | None | `200 { "orders": [...] }` |
| `GET /` | Admin | None | `200 { "orders": [...] }` |
| `PATCH /:id/status` | Admin | `{ "status": "shipped" }` | `200 { "order": {...} }` |

Supported statuses are `pending`, `shipped`, `delivered`, and `cancelled`. Order item prices and product details are saved as a snapshot so the order remains meaningful if the catalogue changes later. The server validates stock and coupon eligibility and computes order totals during checkout.

### Route access summary

| Resource | Public | Customer | Admin |
|---|---|---|---|
| Product list, category list, product detail | Read | Read | Read |
| Cart | — | Read/write own cart | Read/write own cart |
| Place order / view own orders | — | Yes | Yes |
| View all orders / change order status | — | — | Yes |
| Product create, update, delete | — | — | Yes |
| Validate coupon | — | Yes | Yes |
| List, create, delete coupons | — | — | Yes |
| Profile update/delete | — | Own account | Own account |

## Data models

Mongoose stores timestamps (`createdAt`, `updatedAt`) on the principal records.

| Model / collection | Main fields and behavior |
|---|---|
| `User` / `ecomsite` | Name, unique lowercase email, password hash (excluded from normal queries), optional address/phone, active state, role (`customer` or `admin`). |
| `Product` / `products` | Title, description, non-negative price, indexed category, image URL, rating from 0 to 5, non-negative stock, active/deleted flags, deletion timestamp. |
| `Cart` / `carts` | One cart per user; list of product references, quantity, and stored item price. Cart item IDs are disabled. |
| `Order` / `orders` | User reference, item snapshots, subtotal, discount percentage, optional coupon code, total, shipping address, and status. |
| `Coupon` | Unique uppercase code, discount percentage from 1 to 100, optional expiry date, active flag. |
| `otp` / `otps` | Email, one-time code, used flag, and expiry timestamp. Codes expire after ten minutes in the password-reset flow. |

## Seed data

`npm run seed` runs `mock/seed.js`:

1. Connects to MongoDB.
2. Downloads products from `https://fakestoreapi.com/products`.
3. Maps external product fields into the local product schema. Because the source does not provide stock, a deterministic stock value is generated from each price.
4. **Deletes all existing product documents** and inserts the downloaded product list.
5. Creates the `WELCOME10` 10%-off coupon with an expiry one year from seeding, if it does not already exist.
6. Creates the admin account if the configured admin email does not already exist.

Run this script only when replacing the catalogue is intended. Existing products and inventory changes are lost when it deletes the product collection's documents. The admin password is set only when the account is first created; changing `ADMIN_PASSWORD` later does not update an existing admin account.

## Scripts and checks

| Command | Description |
|---|---|
| `npm start` | Run the Express server with Nodemon. |
| `npm run dev` | Start the Vite development server. |
| `npm run seed` | Import the catalogue and ensure the initial coupon/admin exist. |
| `npm run build` | Create the production frontend build in `dist/`. |
| `npm run preview` | Serve the built frontend locally for preview. |
| `npm run lint` | Run ESLint. |

There is no test script configured in `package.json`.

## Troubleshooting

### Browser reports `502 Bad Gateway` for `/api/*`

For the deployed frontend, check the browser's Network panel. If the request still targets `localhost`, Vercel is serving a build that has not picked up `VITE_API_URL`; set it to the public backend URL ending in `/api` and redeploy. For the local frontend, start the backend with `npm start` and wait for `MongoDB connected successfully` and `Server is running on port : ...`. Confirm that `.env`'s `PORT` matches the backend's listening port. The local Vite proxy uses the same `PORT` value (default `2000`).

### MongoDB connection fails

Check that MongoDB is running and `MONGODB_URI` (or `MONGODB_URL`) is valid and reachable from the backend process. The API server starts only after the database connection succeeds.

### `401 Authentication required`

Protected API calls need a valid token in the `Authorization: Bearer <JWT>` header. Sign in again if the token is missing or expired.

### Password-reset email is not delivered

Check `EMAIL_USER` and `EMAIL_PASS`; for Gmail, use credentials supported for SMTP/app access. Also check the server output for Nodemailer/provider errors.

### Catalogue is empty

Run `npm run seed` after configuring MongoDB and ensuring Fake Store API is reachable. Remember that seeding replaces all product records currently in the database.
