import * as React from "react";
import {
  EmailLayout,
  styles,
  Text,
  Hr,
} from "../components/layout";

interface VolunteerPromotionProps {
  name: string;
  newRole: string;
  permissions: string[];
  nextSteps: string[];
}

export function VolunteerPromotionEmail({
  name,
  newRole,
  permissions,
  nextSteps,
}: VolunteerPromotionProps) {
  return (
    <EmailLayout preview={`Congratulations! You've been promoted to ${newRole}`}>
      <Text style={styles.h1}>Congratulations! 🎊</Text>

      <Text style={styles.paragraph}>
        Hi {name},
      </Text>

      <Text style={styles.paragraph}>
        Great news! You&apos;ve been promoted to <strong>{newRole}</strong> in recognition
        of your outstanding contributions. Thank you for your dedication!
      </Text>

      <div style={styles.successBox}>
        <Text style={{ ...styles.paragraph, margin: 0, fontWeight: "600" }}>
          🏆 New Role: {newRole}
        </Text>
      </div>

      <Hr style={styles.hr} />

      <Text style={{ ...styles.paragraph, fontWeight: "600" }}>
        Your New Permissions:
      </Text>
      <ul style={{ margin: "0 0 16px 0", paddingLeft: "20px" }}>
        {permissions.map((perm, i) => (
          <li key={i} style={{ ...styles.paragraph, margin: "4px 0" }}>
            {perm}
          </li>
        ))}
      </ul>

      <Hr style={styles.hr} />

      <Text style={{ ...styles.paragraph, fontWeight: "600" }}>
        Next Steps:
      </Text>
      <ol style={{ margin: "0 0 16px 0", paddingLeft: "20px" }}>
        {nextSteps.map((step, i) => (
          <li key={i} style={{ ...styles.paragraph, margin: "4px 0" }}>
            {step}
          </li>
        ))}
      </ol>

      <Text style={styles.muted}>
        If you have any questions about your new role, reach out to your team lead.
      </Text>
    </EmailLayout>
  );
}

export default VolunteerPromotionEmail;
