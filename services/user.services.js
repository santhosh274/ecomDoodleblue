const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user.models');
const tokenService = require('../jwt/token.service');
const emailService = require('../email/email.service');

class UserService {
    async userSignup({ name, email, password, address, phone, role }) {
        const normalizedEmail = email.trim().toLowerCase();
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) {
            const err = new Error('Email already registered');
            err.statusCode = 409;
            throw err;
        }
        const salt = 10;
        const hashedPassword = await bcrypt.hash(password, salt);
        const savedUser = await User.create({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            address,
            phone,
            role: role === 'admin' ? 'admin' : 'customer'
        });
        if (savedUser) savedUser.password = undefined;
        return savedUser;
    }

    async updateProfile(id, { name, email, password, address, phone }) {
        if (!mongoose.isValidObjectId(id)) {
            return null;
        }
        const changes = {};
        if (name !== undefined) changes.name = name;
        if (email !== undefined) changes.email = email;
        if (address !== undefined) changes.address = address;
        if (phone !== undefined) changes.phone = phone;
        if (password) changes.password = await bcrypt.hash(password, 10);

        return await User.findOneAndUpdate(
            { _id: id, isDeleted: { $ne: true } },
            changes,
            { new: true }
        );
    }

    async softDelete(id) {
        if (!mongoose.isValidObjectId(id)) {
            return null;
        }
        return await User.findOneAndUpdate(
            { _id: id, isDeleted: { $ne: true } },
            { isActive: false, isDeleted: true, deletedAt: new Date() },
            { new: true }
        );
    }

    async deleteUser(id) {
        if (!mongoose.isValidObjectId(id)) {
            return null;
        }
        return await User.findByIdAndDelete(id);
    }

    async loginUser(email, password) {
        const user = await User.findOne({ email, isDeleted: { $ne: true } }).select('+password');

        if (!user) {
            throw new Error('Invalid email or password');
        }

        if (!user.isActive) {
            throw new Error('Account is deactivated');
        }

        if (!user.password) {
            throw new Error('Invalid email or password');
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            throw new Error('Invalid email or password');
        }

        const userData = {
            id: user._id.toString(),
            _id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive
        };

        const token = tokenService.generateToken(userData);
        const userWithoutPassword = user.toObject();
        delete userWithoutPassword.password;

        return { user: userWithoutPassword, token };
    }

    async requestPasswordReset(email) {
        return await emailService.requestPasswordReset(email);
    }

    async resetPassword({ email, otp, newPassword }) {
        return await emailService.resetPassword({ email, otp, newPassword });
    }

    async getUserFromToken(token) {
        let decoded;
        try {
            decoded = tokenService.verifyToken(token);
        } catch (error) {
            throw new Error('Invalid or expired token', { cause: error });
        }

        const id = decoded.id || decoded._id || decoded.userId || decoded.sub;
        let user = null;
        if (id && mongoose.isValidObjectId(id)) {
            user = await User.findOne({ _id: id, isDeleted: { $ne: true } });
        }
        if (!user && decoded.email) {
            user = await User.findOne({ email: decoded.email, isDeleted: { $ne: true } });
        }

        if (user) {
            if (!user.isActive) {
                throw new Error('Account is deactivated');
            }
            return {
                decoded,
                user: {
                    id: user._id,
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    isActive: user.isActive
                }
            };
        }

        const fallbackUser = decoded.user || {
            id: decoded.id || decoded._id || decoded.userId || decoded.sub,
            _id: decoded.id || decoded._id || decoded.userId || decoded.sub,
            name: decoded.name,
            email: decoded.email,
            role: decoded.role,
            isActive: decoded.isActive
        };

        return { decoded, user: fallbackUser };
    }
}

module.exports = new UserService();
