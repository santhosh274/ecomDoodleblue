const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const User = require("../models/user.models");
const otpModel = require("../models/otp.models");
const { getPasswordResetTemplate } = require("./templates/passwordReset.template");

class EmailService {
  constructor() {
    this.emailUser = process.env.EMAIL_USER;
    this.emailPass = process.env.EMAIL_PASS;

    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: this.emailUser,
        pass: this.emailPass,
      },
    });
  }

  generateotp() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  async sendMail({ to, subject, html, text }) {
    const mailOptions = {
      from:this.emailUser,
      to,
      subject,
      text,
      html,
    };

    return await this.transporter.sendMail(mailOptions);
  }

  async requestPasswordReset(email) {
    if (!email) {
      throw new Error("Email is required");
    }
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      const err = new Error("User with this email not found");
      err.statusCode = 404;
      throw err;
    }
    await otpModel.updateMany(
      { email: normalizedEmail, used: false },
      { $set: { used: true } }
    );
    const otpValue = this.generateotp();
    await otpModel.create({
      email: normalizedEmail,
      otp: otpValue,
      used: false,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    const template = getPasswordResetTemplate({
      otp: otpValue,
      name: user.name,
    });

    await this.sendMail({
      to: normalizedEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    return {
      success: true,
      message: "Password reset OTP has been sent successfully to your email.",
      email: normalizedEmail,
    };
  }

  
  async resetPassword({ email, otp, newPassword }) {
    if (!otp) {
      const err = new Error("OTP is required");
      err.statusCode = 400;
      throw err;
    }

    if (!newPassword) {
      const err = new Error("New password is required");
      err.statusCode = 400;
      throw err;
    }

    if (newPassword.length < 6) {
      const err = new Error("Password must be at least 6 characters long");
      err.statusCode = 400;
      throw err;
    }

    const trimmedotp = otp.toString().trim();

    // Query for the active, unused OTP
    const query = {
      otp: trimmedotp,
      used: false,
    };

    if (email) {
      query.email = email.trim().toLowerCase();
    }

    const otpRecord = await otpModel.findOne(query).sort({ createdAt: -1 });

    if (!otpRecord) {
      const err = new Error("Invalid or already used OTP");
      err.statusCode = 400;
      throw err;
    }

    if (otpRecord.expiresAt && otpRecord.expiresAt < new Date()) {
      otpRecord.used = true;
      await otpRecord.save();
      const err = new Error("OTP has expired. Please request a new one.");
      err.statusCode = 400;
      throw err;
    }

    const user = await User.findOne({ email: otpRecord.email });
    if (!user) {
      const err = new Error("User associated with this OTP not found");
      err.statusCode = 404;
      throw err;
    }

    const salt = 10;
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    otpRecord.used = true;
    await otpRecord.save();

    return {
      success: true,
      message: "Password has been reset successfully.",
      email: user.email,
    };
  }
}

module.exports = new EmailService();
