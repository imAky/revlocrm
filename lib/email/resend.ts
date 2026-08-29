/**
 * Production-ready email delivery engine using Resend REST API
 * Includes modern HTML templates for OTP and Workspace Invites,
 * and built-in development logging fallback.
 */

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Revlo CRM <onboarding@resend.dev>";

  if (!apiKey) {
    console.log("\n=======================================================");
    console.log("📧 [RESEND DEVELOPMENT LOG] Email requested (No API Key set in .env)");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log("=======================================================\n");
    return { success: true };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject,
        html,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Resend API error:", data);
      return { success: false, error: data.message || "Failed to send email" };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Failed to send email via Resend:", err);
    return { success: false, error: err.message || "Email delivery failed" };
  }
}

/**
 * Send 6-Digit Authentication OTP Email
 */
export async function sendOtpEmail(email: string, otp: string, name?: string): Promise<{ success: boolean; error?: string }> {
  const subject = `Your Revlo Verification Code: ${otp}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0d0d12; color: #f4f4f5; margin: 0; padding: 40px 20px; }
          .container { max-width: 520px; margin: 0 auto; background: #16161f; border: 1px solid #27273a; border-radius: 24px; padding: 36px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
          .logo { display: inline-block; padding: 8px 16px; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: #ffffff; font-weight: bold; border-radius: 12px; font-size: 16px; margin-bottom: 24px; }
          h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 12px; }
          p { font-size: 14px; line-height: 1.6; color: #a1a1aa; margin-bottom: 24px; }
          .otp-card { background: #1f1f2e; border: 1px solid #383854; border-radius: 16px; text-align: center; padding: 24px; margin: 24px 0; }
          .otp-code { font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #818cf8; text-shadow: 0 0 20px rgba(129,140,248,0.4); }
          .footer { font-size: 12px; color: #71717a; border-top: 1px solid #27273a; padding-top: 20px; margin-top: 30px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">⚡ Revlo CRM</div>
          <h1>Security Verification Code</h1>
          <p>Hello${name ? ` ${name}` : ""}, use the 6-digit code below to securely sign in to your workspace. This code is valid for <strong>10 minutes</strong>.</p>
          <div class="otp-card">
            <div class="otp-code">${otp}</div>
          </div>
          <p style="font-size: 12px; color: #71717a;">If you did not request this login code, you can safely ignore this email.</p>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Revlo CRM. Multi-tenant prospecting & lead scoring platform.
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
}

/**
 * Send Workspace Team Invitation Email
 */
export async function sendWorkspaceInviteEmail({
  email,
  inviterName,
  workspaceName,
  roleName,
  inviteUrl,
}: {
  email: string;
  inviterName: string;
  workspaceName: string;
  roleName: string;
  inviteUrl: string;
}): Promise<{ success: boolean; error?: string }> {
  const subject = `${inviterName} invited you to join ${workspaceName} on Revlo`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0d0d12; color: #f4f4f5; margin: 0; padding: 40px 20px; }
          .container { max-width: 520px; margin: 0 auto; background: #16161f; border: 1px solid #27273a; border-radius: 24px; padding: 36px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
          .logo { display: inline-block; padding: 8px 16px; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: #ffffff; font-weight: bold; border-radius: 12px; font-size: 16px; margin-bottom: 24px; }
          h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 12px; }
          p { font-size: 14px; line-height: 1.6; color: #a1a1aa; margin-bottom: 24px; }
          .role-badge { display: inline-block; background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.4); color: #a5b4fc; font-weight: 600; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; font-size: 11px; margin-bottom: 20px; }
          .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 14px; font-size: 14px; box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4); }
          .footer { font-size: 12px; color: #71717a; border-top: 1px solid #27273a; padding-top: 20px; margin-top: 30px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">⚡ Revlo CRM</div>
          <h1>You've been invited!</h1>
          <p><strong>${inviterName}</strong> has invited you to join the <strong>${workspaceName}</strong> workspace on Revlo CRM.</p>
          <div>
            <span class="role-badge">Assigned Role: ${roleName}</span>
          </div>
          <div style="margin: 28px 0;">
            <a href="${inviteUrl}" class="btn">Accept Invitation & Join</a>
          </div>
          <p style="font-size: 12px; color: #71717a;">Or copy and paste this link into your browser:<br><span style="color: #818cf8; word-break: break-all;">${inviteUrl}</span></p>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Revlo CRM. Fast, collaborative B2B lead prospecting.
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
}
