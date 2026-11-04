const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const authenticate = require('../middleware/authenticate');

router.post('/validate', authenticate, async (req, res) => {
  try {
    const code = typeof req.body.code === 'string' ? req.body.code.trim().toUpperCase() : '';
    if (!code) return res.status(400).json({ message: 'Coupon code is required' });

    const coupon = await Coupon.findOne({ code, isActive: true });

    if (!coupon) {
      return res.status(404).json({ message: 'Invalid or inactive coupon code' });
    }

    if (new Date() >= coupon.expiryDate) {
      return res.status(400).json({ message: 'This coupon has expired' });
    }

    return res.json({
      success: true,
      code: coupon.code,
      discountPercentage: coupon.discountPercentage
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;