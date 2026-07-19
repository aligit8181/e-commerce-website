const express = require('express');
const jwt = require('jsonwebtoken');
const { db } = require('../database/init');
const router = express.Router();

// Middleware to authenticate token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.userId = decoded.userId;
        next();
    });
}

// Get user's cart
router.get('/', authenticateToken, (req, res) => {
    db.all(`
        SELECT c.*, p.name, p.price, p.image_url, (c.quantity * p.price) as subtotal
        FROM cart c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = ?
        ORDER BY c.created_at DESC
    `, [req.userId], (err, cartItems) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        const total = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
        res.json({ items: cartItems, total: total.toFixed(2) });
    });
});

// Add item to cart
router.post('/add', authenticateToken, (req, res) => {
    const { product_id, quantity = 1 } = req.body;

    // Check if product exists and has enough stock
    db.get('SELECT * FROM products WHERE id = ?', [product_id], (err, product) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        if (product.stock_quantity < quantity) {
            return res.status(400).json({ error: 'Insufficient stock' });
        }

        // Check if item already in cart
        db.get('SELECT * FROM cart WHERE user_id = ? AND product_id = ?', [req.userId, product_id], (err, existingItem) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (existingItem) {
                // Update quantity
                const newQuantity = existingItem.quantity + quantity;
                if (product.stock_quantity < newQuantity) {
                    return res.status(400).json({ error: 'Insufficient stock' });
                }

                db.run('UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?',
                    [newQuantity, req.userId, product_id], (err) => {
                        if (err) {
                            return res.status(500).json({ error: 'Failed to update cart' });
                        }
                        res.json({ message: 'Cart updated successfully' });
                    });
            } else {
                // Add new item
                db.run('INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
                    [req.userId, product_id, quantity], (err) => {
                        if (err) {
                            return res.status(500).json({ error: 'Failed to add to cart' });
                        }
                        res.json({ message: 'Item added to cart successfully' });
                    });
            }
        });
    });
});

// Update cart item quantity
router.put('/update/:product_id', authenticateToken, (req, res) => {
    const { product_id } = req.params;
    const { quantity } = req.body;

    if (quantity <= 0) {
        return res.status(400).json({ error: 'Quantity must be greater than 0' });
    }

    // Check stock availability
    db.get('SELECT stock_quantity FROM products WHERE id = ?', [product_id], (err, product) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        if (product.stock_quantity < quantity) {
            return res.status(400).json({ error: 'Insufficient stock' });
        }

        db.run('UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?',
            [quantity, req.userId, product_id], (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to update cart' });
                }
                res.json({ message: 'Cart updated successfully' });
            });
    });
});

// Remove item from cart
router.delete('/remove/:product_id', authenticateToken, (req, res) => {
    const { product_id } = req.params;

    db.run('DELETE FROM cart WHERE user_id = ? AND product_id = ?', [req.userId, product_id], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to remove item' });
        }
        res.json({ message: 'Item removed from cart successfully' });
    });
});

// Clear cart
router.delete('/clear', authenticateToken, (req, res) => {
    db.run('DELETE FROM cart WHERE user_id = ?', [req.userId], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to clear cart' });
        }
        res.json({ message: 'Cart cleared successfully' });
    });
});

module.exports = router;
