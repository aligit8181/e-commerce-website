const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || './database/ecommerce.db';

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH);

const initDatabase = () => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Users table
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                full_name TEXT,
                address TEXT,
                phone TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Categories table
            db.run(`CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Products table
            db.run(`CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                category_id INTEGER,
                stock_quantity INTEGER DEFAULT 0,
                image_url TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id)
            )`);

            // Cart table
            db.run(`CREATE TABLE IF NOT EXISTS cart (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (product_id) REFERENCES products(id),
                UNIQUE(user_id, product_id)
            )`);

            // Orders table
            db.run(`CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                total_amount DECIMAL(10,2) NOT NULL,
                status TEXT DEFAULT 'pending',
                shipping_address TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`);

            // Order items table
            db.run(`CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders(id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            )`);

            // Insert sample categories
            db.run(`INSERT OR IGNORE INTO categories (name, description) VALUES 
                ('Electronics', 'Electronic devices and gadgets'),
                ('Clothing', 'Fashion and apparel'),
                ('Books', 'Books and educational materials'),
                ('Home & Garden', 'Home improvement and garden supplies'),
                ('Sports', 'Sports equipment and accessories')`);

            // Clear existing products to prevent duplicates
            db.run('DELETE FROM products');
            
            // Insert sample products
            db.run(`INSERT INTO products (name, description, price, category_id, stock_quantity, image_url) VALUES 
                ('Wireless Headphones', 'High-quality wireless headphones with noise cancellation', 199.99, 1, 50, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop&crop=center'),
                ('Smartphone', 'Latest model smartphone with advanced features', 699.99, 1, 30, 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop&crop=center'),
                ('Laptop', 'Powerful laptop for work and gaming', 1299.99, 1, 20, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop&crop=center'),
                ('T-Shirt', 'Comfortable cotton t-shirt', 29.99, 2, 100, 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&h=300&fit=crop&crop=center'),
                ('Jeans', 'Classic blue jeans', 79.99, 2, 75, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=300&fit=crop&crop=center'),
                ('Programming Book', 'Learn modern web development', 49.99, 3, 40, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=300&fit=crop&crop=center'),
                ('Garden Tools Set', 'Complete set of garden tools', 89.99, 4, 25, 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop&crop=center'),
                ('Basketball', 'Professional basketball', 39.99, 5, 60, 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop&crop=center')`);

            console.log('Database tables created and sample data inserted');
            resolve();
        });
    });
};

module.exports = { db, initDatabase };
