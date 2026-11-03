function getPasswordResetTemplate({ otp, name }) {
  const displayName = name ? name : "User";
  const subject = "Your Password Reset OTP";

  const text = `Hello ${displayName},\n\nYour One-Time Password (OTP) for resetting your password is: ${otp}\n\nThis OTP is valid for 10 minutes. If you did not request a password reset, please ignore this email.\n\nThank you.`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${subject}</title>
      <style>
        body {
          font-family: Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, sans-serif;
          background-color: #f4f6f8;
          margin: 0;
          padding: 24px;
          color: #333333;
        }
        .container {
          max-width: 500px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          border: 1px solid #e1e4e8;
        }
        .header {
          background-color: #1a73e8;
          color: #ffffff;
          padding: 24px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 22px;
          font-weight: 600;
        }
        .content {
          padding: 28px 24px;
          line-height: 1.6;
        }
        .content p {
          margin: 0 0 16px;
          font-size: 15px;
        }
        .otp-container {
          margin: 28px 0;
          text-align: center;
        }
        .otp-box {
          display: inline-block;
          font-size: 32px;
          font-weight: 700;
          letter-spacing: 8px;
          padding: 12px 28px;
          background-color: #f1f3f4;
          color: #1a73e8;
          border-radius: 6px;
          border: 1px dashed #1a73e8;
        }
        .footer {
          background-color: #fafbfc;
          padding: 16px 24px;
          border-top: 1px solid #e1e4e8;
          font-size: 13px;
          color: #6a737d;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${displayName}</strong>,</p>
          <p>We received a request to reset your password. Use the following 4-digit verification code to complete the process:</p>
          
          <div class="otp-container">
            <div class="otp-box">${otp}</div>
          </div>

          <p>This OTP is valid for <strong>10 minutes</strong>. Only the most recently generated OTP can be used for verification.</p>
          <p>If you did not request this password reset, please ignore this email or secure your account.</p>
        </div>
        <div class="footer">
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html, text };
}

module.exports = {
  getPasswordResetTemplate,
};

