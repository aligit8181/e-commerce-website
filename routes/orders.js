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

// Create order from cart
router.post('/create', authenticateToken, (req, res) => {
    const { shipping_address } = req.body;

    // Get cart items
    db.all(`
        SELECT c.*, p.name, p.price, p.stock_quantity
        FROM cart c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = ?
    `, [req.userId], (err, cartItems) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (cartItems.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Check stock availability
        for (let item of cartItems) {
            if (item.stock_quantity < item.quantity) {
                return res.status(400).json({ 
                    error: `Insufficient stock for ${item.name}. Available: ${item.stock_quantity}, Requested: ${item.quantity}` 
                });
            }
        }

        const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Create order
        db.run('INSERT INTO orders (user_id, total_amount, shipping_address) VALUES (?, ?, ?)',
            [req.userId, totalAmount, shipping_address], function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to create order' });
                }

                const orderId = this.lastID;

                // Insert order items and update stock
                let completed = 0;
                const totalItems = cartItems.length;

                cartItems.forEach(item => {
                    // Insert order item
                    db.run('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                        [orderId, item.product_id, item.quantity, item.price], (err) => {
                            if (err) {
                                return res.status(500).json({ error: 'Failed to create order items' });
                            }

                            // Update product stock
                            db.run('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
                                [item.quantity, item.product_id], (err) => {
                                    if (err) {
                                        return res.status(500).json({ error: 'Failed to update stock' });
                                    }

                                    completed++;
                                    if (completed === totalItems) {
                                        // Clear cart
                                        db.run('DELETE FROM cart WHERE user_id = ?', [req.userId], (err) => {
                                            if (err) {
                                                console.error('Failed to clear cart:', err);
                                            }
                                            res.json({
                                                message: 'Order created successfully',
                                                orderId: orderId,
                                                totalAmount: totalAmount.toFixed(2)
                                            });
                                        });
                                    }
                                });
                        });
                });
            });
    });
});

// Get user's orders
router.get('/', authenticateToken, (req, res) => {
    db.all(`
        SELECT o.*, COUNT(oi.id) as item_count
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.user_id = ?
        GROUP BY o.id
        ORDER BY o.created_at DESC
    `, [req.userId], (err, orders) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(orders);
    });
});

// Get order details
router.get('/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    // Get order info
    db.get('SELECT * FROM orders WHERE id = ? AND user_id = ?', [id, req.userId], (err, order) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Get order items
        db.all(`
            SELECT oi.*, p.name, p.image_url
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `, [id], (err, items) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            res.json({
                ...order,
                items: items
            });
        });
    });
});

module.exports = router;
