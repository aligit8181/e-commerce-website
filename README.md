# ShopEasy - E-commerce Website

A complete, modern e-commerce website built with Node.js, Express, and SQLite. Features user authentication, product catalog, shopping cart, and order management.

## Features

### 🛍️ Core E-commerce Features
- **Product Catalog**: Browse products by category with search functionality
- **Shopping Cart**: Add, update, and remove items from cart
- **User Authentication**: Secure registration and login system
- **Order Management**: Place orders and view order history
- **Responsive Design**: Works on desktop and mobile devices

### 🔧 Technical Features
- **Backend**: Node.js with Express.js framework
- **Database**: SQLite with structured schema
- **Authentication**: JWT-based authentication
- **Security**: Password hashing with bcrypt
- **Frontend**: Vanilla JavaScript with modern CSS
- **API**: RESTful API endpoints

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd e-commerce-website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser and visit**
   ```
   http://localhost:3000
   ```

## Project Structure

```
e-commerce-website/
├── database/
│   └── init.js              # Database initialization and schema
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── products.js          # Product management routes
│   ├── cart.js              # Shopping cart routes
│   └── orders.js            # Order management routes
├── public/
│   ├── index.html           # Main HTML file
│   ├── styles.css           # CSS styling
│   ├── script.js            # Frontend JavaScript
│   └── images/              # Product images directory
├── uploads/                 # File upload directory
├── .env                     # Environment variables
├── server.js                # Main server file
├── package.json             # Dependencies and scripts
└── README.md                # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `GET /api/products/categories/all` - Get all categories
- `GET /api/products/search/:term` - Search products

### Cart (Requires Authentication)
- `GET /api/cart` - Get user's cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update/:product_id` - Update cart item quantity
- `DELETE /api/cart/remove/:product_id` - Remove item from cart
- `DELETE /api/cart/clear` - Clear entire cart

### Orders (Requires Authentication)
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders/create` - Create new order

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
PORT=3000
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
DB_PATH=./database/ecommerce.db
UPLOAD_DIR=./uploads
```

## Sample Data

The application comes with pre-populated sample data including:

### Categories
- Electronics
- Clothing
- Books
- Home & Garden
- Sports

### Sample Products
- Wireless Headphones ($199.99)
- Smartphone ($699.99)
- Laptop ($1299.99)
- T-Shirt ($29.99)
- Jeans ($79.99)
- Programming Book ($49.99)
- Garden Tools Set ($89.99)
- Basketball ($39.99)

## Usage Guide

### For Customers

1. **Browse Products**
   - Visit the homepage to see featured products
   - Navigate to "Products" to see the full catalog
   - Use category filter or search to find specific items

2. **Create Account**
   - Click "Sign Up" to create a new account
   - Fill in your details including shipping address

3. **Shopping**
   - Click on products to view details
   - Add items to cart
   - View and modify cart contents
   - Proceed to checkout

4. **Orders**
   - View order history in "Orders" section
   - Track order status

### For Developers

1. **Database**
   - SQLite database is automatically created on first run
   - Database file: `./database/ecommerce.db`
   - Schema includes users, products, categories, cart, orders, and order_items tables

2. **Authentication**
   - JWT tokens are used for authentication
   - Tokens are stored in localStorage on the frontend
   - Protected routes require valid JWT token

3. **Adding New Features**
   - Backend routes are in the `routes/` directory
   - Frontend logic is in `public/script.js`
   - Styling is in `public/styles.css`

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Input validation
- SQL injection prevention with parameterized queries
- CORS enabled for cross-origin requests

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please create an issue in the repository.

---

**Happy Shopping with ShopEasy! 🛒**
