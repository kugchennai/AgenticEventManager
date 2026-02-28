import * as React from "react";
import {
  EmailLayout,
  DetailTable,
  DetailItem,
  styles,
  colors,
  Text,
  Hr,
  Link,
} from "../components/layout";

interface MemberInvitationProps {
  name: string;
  email: string;
  role: string;
  inviterName: string;
  appUrl: string;
}

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  EVENT_LEAD: "Member",
  VOLUNTEER: "Volunteer",
  VIEWER: "Viewer",
};

export function MemberInvitationEmail({
  name,
  email,
  role,
  inviterName,
  appUrl,
}: MemberInvitationProps) {
  const roleLabel = roleLabels[role] ?? role;

  return (
    <EmailLayout preview={`You've been invited to join the team as ${roleLabel}`}>
      <Text style={styles.h1}>Welcome to the Team! 🎉</Text>

      <Text style={styles.paragraph}>
        Hi {name || "there"},
      </Text>

      <Text style={styles.paragraph}>
        <strong>{inviterName}</strong> has invited you to join the team as a{" "}
        <strong>{roleLabel}</strong>.
      </Text>

      <Hr style={styles.hr} />

      <DetailTable>
        <DetailItem label="Email" value={email} />
        <DetailItem label="Role" value={roleLabel} />
        <DetailItem label="Invited By" value={inviterName} />
      </DetailTable>

      <Hr style={styles.hr} />

      <Text style={styles.paragraph}>
        Sign in with your Google account to get started:
      </Text>

      <div style={{ textAlign: "center", margin: "24px 0" }}>
        <Link href={appUrl} style={styles.button}>
          Sign In to Meetup Manager
        </Link>
      </div>

      <div style={styles.infoBox}>
        <Text style={{ ...styles.muted, margin: 0 }}>
          <strong>What&apos;s next?</strong>
          <br />
          {role === "EVENT_LEAD" || role === "ADMIN" || role === "SUPER_ADMIN"
            ? "You can create and manage events, assign tasks, and collaborate with the team."
            : "You can view events you're assigned to and participate in team activities."}
        </Text>
      </div>

      <Text style={{ ...styles.muted, color: colors.textMuted }}>
        If you didn&apos;t expect this invitation, you can safely ignore this email.
      </Text>
    </EmailLayout>
  );
}

export default MemberInvitationEmail;
