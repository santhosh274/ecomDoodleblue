const userService = require('../services/user.services');

class UserController {
    async signup(req, res) {
        try {
            const user = await userService.userSignup(req.body);
            return res.status(201).json({ message: 'Signup successful', user });
        } catch (error) {
            const status = error.statusCode || 400;
            return res.status(status).json({ message: error.message });
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;
            const result = await userService.loginUser(email, password);
            return res.status(200).json({ message: 'Login successful', ...result });
        } catch (error) {
            return res.status(401).json({ message: error.message });
        }
    }

    async updateProfile(req, res) {
        try {
            const user = await userService.updateProfile(req.user.id, req.body);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            return res.status(200).json({ user });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    async deleteProfile(req, res) {
        try {
            const user = await userService.softDelete(req.user.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            return res.status(200).json({ message: 'Account deleted' });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ message: "Email is required" });
            }

            const result = await userService.requestPasswordReset(email);
            return res.json(result);
        } catch (err) {
            const status = err.statusCode || 500;
            return res.status(status).json({ error: err.message });
        }
    }

    async resetPassword(req, res) {
        try {
            const { email, otp, newPassword } = req.body;
            const targetPassword = newPassword;
            if (email && !otp && !targetPassword) {
                const result = await userService.requestPasswordReset(email);
                return res.json(result);
            }

            if (!otp) {
                return res.status(400).json({ message: "OTP is required" });
            }

            if (!targetPassword) {
                return res.status(400).json({ message: "New password is required" });
            }

            const result = await userService.resetPassword({
                email,
                otp,
                newPassword: targetPassword,
            });

            return res.json(result);
        } catch (err) {
            const status = err.statusCode || 400;
            return res.status(status).json({ error: err.message });
        }
    }
}

module.exports = new UserController();
