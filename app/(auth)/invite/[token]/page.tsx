import { db } from "@/lib/db";
import { invitations, workspaces, roles, users, memberships } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { Sparkles, ArrowRight, Lock, User, Mail, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function InviteAcceptancePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invList = await db
    .select({
      id: invitations.id,
      email: invitations.email,
      workspaceId: invitations.workspaceId,
      workspaceName: workspaces.name,
      roleId: invitations.roleId,
      roleName: roles.name,
      status: invitations.status,
      expiresAt: invitations.expiresAt,
    })
    .from(invitations)
    .innerJoin(workspaces, eq(invitations.workspaceId, workspaces.id))
    .innerJoin(roles, eq(invitations.roleId, roles.id))
    .where(
      and(
        eq(invitations.token, token),
        eq(invitations.status, "pending"),
        gt(invitations.expiresAt, new Date())
      )
    )
    .limit(1);

  if (invList.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-destructive/30 bg-card p-6 text-center space-y-3">
          <h2 className="text-lg font-bold text-destructive">Invalid or Expired Invitation</h2>
          <p className="text-xs text-muted-foreground">
            This invitation link has expired or has already been consumed. Please contact your workspace administrator for a new invite.
          </p>
        </div>
      </div>
    );
  }

  const invitation = invList[0];

  async function acceptInviteAction(formData: FormData) {
    "use server";
    const name = (formData.get("name") as string)?.trim();
    const password = formData.get("password") as string;

    if (!name || !password || password.length < 6) {
      redirect(`/invite/${token}?error=invalid_inputs`);
    }

    // Check if user already exists
    let userId = "";
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, invitation.email))
      .limit(1);

    if (existingUser.length > 0) {
      userId = existingUser[0].id;
    } else {
      userId = crypto.randomUUID();
      const passwordHash = await hashPassword(password);
      await db.insert(users).values({
        id: userId,
        email: invitation.email,
        name,
        passwordHash,
      });
    }

    // Create membership
    await db.insert(memberships).values({
      id: crypto.randomUUID(),
      workspaceId: invitation.workspaceId,
      userId,
      roleId: invitation.roleId,
      status: "active",
    });

    // Mark invitation accepted
    await db
      .update(invitations)
      .set({ status: "accepted" })
      .where(eq(invitations.id, invitation.id));

    await setSessionCookie({
      userId,
      email: invitation.email,
      name,
      workspaceId: invitation.workspaceId,
      role: invitation.roleName,
    });

    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 mx-auto mb-3">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">You've been invited!</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Join <span className="font-semibold text-foreground">{invitation.workspaceName}</span> as a{" "}
            <span className="font-semibold text-primary uppercase">{invitation.roleName}</span>
          </p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/80 p-6 backdrop-blur-xl shadow-2xl space-y-5">
          <form action={acceptInviteAction} className="space-y-4 text-xs">
            <div>
              <label className="block mb-1 font-medium text-foreground">Your Email Address</label>
              <Input disabled value={invitation.email} className="bg-muted/40 font-mono" />
            </div>

            <div>
              <label className="block mb-1 font-medium text-foreground">Full Name *</label>
              <Input required name="name" placeholder="Alex Miller" />
            </div>

            <div>
              <label className="block mb-1 font-medium text-foreground">Set Password (min 6 characters) *</label>
              <Input required type="password" name="password" placeholder="••••••••" />
            </div>

            <Button type="submit" variant="gradient" className="w-full font-semibold gap-2">
              Accept Invitation & Join
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
