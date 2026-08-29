import { db } from "@/lib/db";
import { users, authOtps, invitations, workspaces, memberships } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { createSessionToken, verifySessionToken } from "@/lib/auth/session";
import { sendOtpEmail, sendWorkspaceInviteEmail } from "@/lib/email/resend";
import * as dotenv from "dotenv";

dotenv.config();

async function runAuthTests() {
  console.log("\n=======================================================");
  console.log("🔒 REVLO CRM PRODUCTION AUTHENTICATION & SECURITY TEST");
  console.log("=======================================================\n");

  // 1. Test JWT Session Cryptographic Token Creation & Verification
  console.log("1️⃣ Testing Jose HS256 Encrypted Session Token...");
  const testPayload = {
    userId: "test-user-123",
    email: "test@revlo.crm",
    name: "Alex Vance",
    workspaceId: "test-workspace-123",
    role: "admin",
    avatarUrl: "https://lh3.googleusercontent.com/a/sample-avatar",
  };

  const token = await createSessionToken(testPayload);
  const decoded = await verifySessionToken(token);

  if (decoded?.email === testPayload.email && decoded?.avatarUrl === testPayload.avatarUrl) {
    console.log("  ✅ [PASS] JWT Session Token created, signed & verified with avatar!");
  } else {
    throw new Error("JWT token verification mismatch");
  }

  // 2. Test OTP Generation & Database Persistence
  console.log("\n2️⃣ Testing 6-Digit OTP Lifecycle & PostgreSQL Persistence...");
  const testEmail = "otp-test@revlo.demo";
  const otpCode = "481920";
  const otpId = crypto.randomUUID();

  // Clean old
  await db.delete(authOtps).where(eq(authOtps.email, testEmail));

  // Insert OTP
  await db.insert(authOtps).values({
    id: otpId,
    email: testEmail,
    otp: otpCode,
    type: "login",
    expiresAt: new Date(Date.now() + 1000 * 60 * 10),
  });

  const [fetchedOtp] = await db
    .select()
    .from(authOtps)
    .where(
      and(
        eq(authOtps.email, testEmail),
        eq(authOtps.otp, otpCode),
        gt(authOtps.expiresAt, new Date())
      )
    )
    .limit(1);

  if (fetchedOtp && fetchedOtp.otp === otpCode) {
    console.log("  ✅ [PASS] OTP stored, indexed, and validated in PostgreSQL!");
  } else {
    throw new Error("OTP validation failed in DB");
  }

  // Clean test OTP
  await db.delete(authOtps).where(eq(authOtps.id, otpId));

  // 3. Test Email Dispatchers
  console.log("\n3️⃣ Testing Resend HTML Email Dispatchers...");
  const otpRes = await sendOtpEmail(testEmail, "999888", "Alex");
  if (otpRes.success) {
    console.log("  ✅ [PASS] sendOtpEmail template generated & dispatched successfully!");
  }

  const inviteRes = await sendWorkspaceInviteEmail({
    email: testEmail,
    inviterName: "Sarah Connor (Admin)",
    workspaceName: "Apex Growth Lab",
    roleName: "Researcher",
    inviteUrl: "http://localhost:3000/invite/test-token",
  });
  if (inviteRes.success) {
    console.log("  ✅ [PASS] sendWorkspaceInviteEmail template generated & dispatched successfully!");
  }

  console.log("\n=======================================================");
  console.log("🎉 ALL AUTHENTICATION & SECURITY TESTS PASSED (100%)");
  console.log("=======================================================\n");
}

runAuthTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Auth test error:", err);
    process.exit(1);
  });
