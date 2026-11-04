const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.post('/validate', authenticate, authorize('customer', 'admin'), async (req, res) => {
  try {
    const code = typeof req.body.code === 'string' ? req.body.code.trim().toUpperCase() : '';
    if (!code) {
      return res.status(400).json({ message: 'Coupon code is required' });
    }

    const coupon = await Coupon.findOne({ code, isActive: true });
    if (!coupon || (coupon.expiryDate && coupon.expiryDate <= new Date())) {
      return res.status(404).json({ message: 'Invalid or expired coupon code' });
    }

    res.json({
      code: coupon.code,
      discountPercentage: coupon.discountPercentage,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.use(authenticate, authorize('admin'));

router.get('/', async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ coupons });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.post('/', async (req, res) => {
  try {
    const { code, discountPercentage } = req.body;
    const normalizedCode = typeof code === 'string' ? code.trim().toUpperCase() : '';
    const discount = Number(discountPercentage);

    if (!normalizedCode || !Number.isFinite(discount)) {
      return res.status(400).json({ message: 'Code and discount percentage are required' });
    }

    const existing = await Coupon.findOne({ code: normalizedCode });
    if (existing) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }

    const coupon = new Coupon({
      code: normalizedCode,
      discountPercentage: discount,
    });

    await coupon.save();
    res.status(201).json({ message: 'Coupon created successfully', coupon });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:code', async (req, res) => {
  try {
    const coupon = await Coupon.findOneAndDelete({ code: req.params.code.toUpperCase() });
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    res.json({ message: 'Coupon deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;