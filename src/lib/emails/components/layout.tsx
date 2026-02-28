import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Link,
  Preview,
  Img,
} from "@react-email/components";
import * as React from "react";

// ─── Brand Colors ─────────────────────────────────────────────────
// Matching the app's design system (amber/gold accent)
const colors = {
  accent: "#F59E0B",
  accentDark: "#D97706",
  bg: "#F9FAFB",
  surface: "#FFFFFF",
  text: "#111827",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
};

// ─── Shared Styles ────────────────────────────────────────────────
const styles = {
  body: {
    backgroundColor: colors.bg,
    fontFamily:
      "'Segoe UI', 'Avenir Next', Avenir, 'Trebuchet MS', -apple-system, BlinkMacSystemFont, sans-serif",
    margin: "0",
    padding: "0",
  } as React.CSSProperties,
  container: {
    maxWidth: "600px",
    margin: "0 auto",
    padding: "20px",
  } as React.CSSProperties,
  card: {
    backgroundColor: colors.surface,
    borderRadius: "12px",
    border: `1px solid ${colors.border}`,
    overflow: "hidden" as const,
  } as React.CSSProperties,
  header: {
    backgroundColor: colors.text,
    padding: "24px 32px",
    textAlign: "center" as const,
  } as React.CSSProperties,
  headerTitle: {
    color: colors.accent,
    fontSize: "20px",
    fontWeight: "700",
    margin: "0",
    letterSpacing: "-0.025em",
  } as React.CSSProperties,
  content: {
    padding: "32px",
  } as React.CSSProperties,
  h1: {
    color: colors.text,
    fontSize: "24px",
    fontWeight: "700",
    lineHeight: "1.3",
    margin: "0 0 16px 0",
  } as React.CSSProperties,
  paragraph: {
    color: colors.text,
    fontSize: "15px",
    lineHeight: "1.6",
    margin: "0 0 16px 0",
  } as React.CSSProperties,
  muted: {
    color: colors.textMuted,
    fontSize: "14px",
    lineHeight: "1.5",
    margin: "0 0 16px 0",
  } as React.CSSProperties,
  hr: {
    borderColor: colors.border,
    margin: "24px 0",
  } as React.CSSProperties,
  footer: {
    padding: "24px 32px",
    borderTop: `1px solid ${colors.border}`,
  } as React.CSSProperties,
  footerText: {
    color: colors.textMuted,
    fontSize: "12px",
    lineHeight: "1.5",
    margin: "0",
    textAlign: "center" as const,
  } as React.CSSProperties,
  button: {
    backgroundColor: colors.accent,
    borderRadius: "8px",
    color: "#FFFFFF",
    display: "inline-block",
    fontSize: "15px",
    fontWeight: "600",
    padding: "12px 24px",
    textDecoration: "none",
    textAlign: "center" as const,
  } as React.CSSProperties,
  buttonDanger: {
    backgroundColor: colors.danger,
    borderRadius: "8px",
    color: "#FFFFFF",
    display: "inline-block",
    fontSize: "15px",
    fontWeight: "600",
    padding: "12px 24px",
    textDecoration: "none",
    textAlign: "center" as const,
  } as React.CSSProperties,
  infoBox: {
    backgroundColor: "#F0F9FF",
    border: `1px solid #BAE6FD`,
    borderRadius: "8px",
    padding: "16px 20px",
    margin: "16px 0",
  } as React.CSSProperties,
  warningBox: {
    backgroundColor: "#FFFBEB",
    border: `1px solid #FDE68A`,
    borderRadius: "8px",
    padding: "16px 20px",
    margin: "16px 0",
  } as React.CSSProperties,
  dangerBox: {
    backgroundColor: "#FEF2F2",
    border: `1px solid #FECACA`,
    borderRadius: "8px",
    padding: "16px 20px",
    margin: "16px 0",
  } as React.CSSProperties,
  successBox: {
    backgroundColor: "#F0FDF4",
    border: `1px solid #BBF7D0`,
    borderRadius: "8px",
    padding: "16px 20px",
    margin: "16px 0",
  } as React.CSSProperties,
  badge: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "9999px",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  } as React.CSSProperties,
  detailRow: {
    display: "flex",
    padding: "8px 0",
  } as React.CSSProperties,
  detailLabel: {
    color: colors.textMuted,
    fontSize: "13px",
    fontWeight: "600",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    width: "120px",
    minWidth: "120px",
  } as React.CSSProperties,
  detailValue: {
    color: colors.text,
    fontSize: "15px",
  } as React.CSSProperties,
};

// ─── Reusable Components ──────────────────────────────────────────

interface EmailLayoutProps {
  preview: string;
  appName?: string;
  children?: React.ReactNode;
}

export function EmailLayout({ preview, appName = "Meetup Manager", children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.card}>
            {/* Header */}
            <Section style={styles.header}>
              <Text style={styles.headerTitle}>{appName}</Text>
            </Section>

            {/* Content */}
            <Section style={styles.content}>{children}</Section>

            {/* Footer */}
            <Section style={styles.footer}>
              <Text style={styles.footerText}>
                This is an automated message from {appName}.
                <br />
                Please do not reply to this email.
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ─── Helper Components ────────────────────────────────────────────

interface DetailItemProps {
  label: string;
  value: string;
}

export function DetailItem({ label, value }: DetailItemProps) {
  return (
    <tr>
      <td style={{ ...styles.detailLabel, padding: "6px 16px 6px 0", verticalAlign: "top" }}>
        {label}
      </td>
      <td style={{ ...styles.detailValue, padding: "6px 0", verticalAlign: "top" }}>
        {value}
      </td>
    </tr>
  );
}

export function DetailTable({ children }: { children: React.ReactNode }) {
  return (
    <table
      cellPadding="0"
      cellSpacing="0"
      style={{ width: "100%", margin: "16px 0" }}
    >
      <tbody>{children}</tbody>
    </table>
  );
}

interface PriorityBadgeProps {
  priority: string;
}

const priorityColors: Record<string, { bg: string; text: string }> = {
  LOW: { bg: "#F3F4F6", text: "#6B7280" },
  MEDIUM: { bg: "#DBEAFE", text: "#1D4ED8" },
  HIGH: { bg: "#FEF3C7", text: "#92400E" },
  CRITICAL: { bg: "#FEE2E2", text: "#991B1B" },
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const color = priorityColors[priority] ?? priorityColors.MEDIUM;
  return (
    <span
      style={{
        ...styles.badge,
        backgroundColor: color.bg,
        color: color.text,
      }}
    >
      {priority}
    </span>
  );
}

// ─── Exports ──────────────────────────────────────────────────────

export { styles, colors };
export { Text, Hr, Link, Section, Img };
