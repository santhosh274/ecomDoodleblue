function getPasswordResetTemplate({ otp, name }) {
  const displayName = name ? name : "User";
  const subject = "Your Password Reset OTP";

  const text = `Hello ${displayName},\n\nYour One-Time Password (OTP) for resetting your password is: ${otp}\n\nThis OTP is valid for 10 minutes. If you did not request a password reset, please ignore this email.\n\nThank you.`;

  

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>

<body style="margin:0; padding:0; background-color:#F3F4F6; font-family:Arial, Helvetica, sans-serif; color:#374151;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background-color:#F3F4F6; padding:35px 15px;">

    <tr>
      <td align="center">

        <table width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:520px; background-color:#FFFFFF; border-radius:12px; overflow:hidden; border:1px solid #D1D5DB;">

          <!-- Header -->
          <tr>
            <td align="center"
              style="background-color:#374151; padding:30px 20px;">

              <table border="0" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td align="center" style="vertical-align:middle; padding-right:10px;">
                    <img src="src/assets/everything.webp" alt="Everything Logo" width="36" height="36" style="display:block; border:0; outline:none; text-decoration:none;" />
                  </td>
                  <td align="center" style="vertical-align:middle;">
                    <h1 style="margin:0; color:#FFFFFF; font-size:28px; font-weight:700; line-height:1.1;">
                      the everything
                    </h1>
                  </td>
                </tr>
              </table>

              <p style="margin:8px 0 0; color:#D1D5DB; font-size:14px;">
                Password Reset Verification
              </p>

            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:35px 30px;">

              <h2 style="margin:0 0 18px; font-size:21px; color:#1F2937;">
                Hello ${displayName},
              </h2>

              <p style="font-size:15px; line-height:1.7; color:#4B5563; margin:0 0 18px;">
                We received a request to reset your password.
                Use the verification code below to securely reset
                your account password.
              </p>

              <!-- OTP Section -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                style="margin:28px 0;">

                <tr>
                  <td align="center">

                    <p style="font-size:12px; font-weight:700; color:#6B7280; letter-spacing:1.5px; margin:0 0 12px;">
                      YOUR VERIFICATION CODE
                    </p>

                    <div style="display:inline-block; background-color:#F3F4F6; border:1px dashed #9CA3AF; border-radius:10px; padding:18px 30px;">

                      <span style="font-size:32px; font-weight:700; color:#374151; letter-spacing:10px;">
                        ${otp}
                      </span>

                    </div>

                    <p style="font-size:13px; color:#4B5563; margin:12px 0 0; font-weight:600;">
                      Valid for 10 minutes
                    </p>

                  </td>
                </tr>

              </table>

              <!-- Security Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                style="background-color:#F9FAFB; border:1px solid #E5E7EB; border-radius:8px; margin-bottom:22px;">

                <tr>
                  <td style="padding:15px;">

                    <p style="margin:0; font-size:13px; line-height:1.7; color:#4B5563;">
                      <strong style="color:#374151;">Security Notice:</strong>
                      Only the most recently generated OTP can be
                      used for verification.
                    </p>

                  </td>
                </tr>

              </table>

              <p style="font-size:14px; line-height:1.7; color:#6B7280; margin:0;">
                If you did not request this password reset,
                please ignore this email. Your account will remain secure.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center"
              style="background-color:#E5E7EB; padding:22px 20px; border-top:1px solid #D1D5DB;">

              <p style="margin:0 0 7px; font-size:13px; color:#4B5563;">
                © 2026 Everything. All rights reserved.
              </p>

              <p style="margin:0; font-size:12px; color:#6B7280;">
                This is an automated message. Please do not reply.
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>

  </table>

</body>
</html>
`;


  return { subject, html, text };
}

module.exports = {
  getPasswordResetTemplate,
};