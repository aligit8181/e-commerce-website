const express = require('express');
const { db } = require('../database/init');
const router = express.Router();

// Get all products with optional category filter
router.get('/', (req, res) => {
    const { category } = req.query;
    let query = `
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id
    `;
    let params = [];

    if (category) {
        query += ' WHERE c.name = ?';
        params.push(category);
    }

    query += ' ORDER BY p.created_at DESC';

    db.all(query, params, (err, products) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(products);
    });
});

// Get single product
router.get('/:id', (req, res) => {
    const { id } = req.params;
    
    db.get(`
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.id = ?
    `, [id], (err, product) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    });
});

// Get all categories
router.get('/categories/all', (req, res) => {
    db.all('SELECT * FROM categories ORDER BY name', (err, categories) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(categories);
    });
});

// Search products
router.get('/search/:term', (req, res) => {
    const { term } = req.params;
    const searchTerm = `%${term}%`;

    db.all(`
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.name LIKE ? OR p.description LIKE ?
        ORDER BY p.name
    `, [searchTerm, searchTerm], (err, products) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(products);
    });
});

module.exports = router;
