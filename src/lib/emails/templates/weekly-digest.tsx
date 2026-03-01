import * as React from "react";
import {
  EmailLayout,
  styles,
  colors,
  Text,
  Hr,
  Link,
} from "../components/layout";

interface TaskItem {
  title: string;
  eventTitle: string;
  priority: string;
  deadline?: string | null;
  taskUrl: string;
}

interface EventItem {
  title: string;
  date: string;
  venue?: string | null;
  eventUrl: string;
}

interface WeeklyDigestProps {
  userName: string;
  assignedTasks: TaskItem[];
  overdueTasks: TaskItem[];
  upcomingEvents: EventItem[];
  summary: {
    totalTasks: number;
    completedTasks: number;
    totalEvents: number;
    upcomingEventsCount: number;
  };
  appUrl: string;
  appName?: string;
  logoUrl?: string;
}

const priorityEmoji: Record<string, string> = {
  LOW: "⬜",
  MEDIUM: "🔵",
  HIGH: "🟡",
  CRITICAL: "🔴",
};

export function WeeklyDigestEmail({
  userName,
  assignedTasks,
  overdueTasks,
  upcomingEvents,
  summary,
  appUrl,
  appName,
  logoUrl,
}: WeeklyDigestProps) {
  return (
    <EmailLayout preview={`Weekly digest: ${summary.totalTasks} tasks, ${summary.upcomingEventsCount} upcoming events`} appName={appName} logoUrl={logoUrl}>
      <Text style={styles.h1}>Weekly Digest 📊</Text>

      <Text style={styles.paragraph}>
        Hi {userName}, here&apos;s your weekly summary:
      </Text>

      {/* Summary Stats */}
      <table cellPadding="0" cellSpacing="0" style={{ width: "100%", margin: "16px 0" }}>
        <tbody>
          <tr>
            <td style={{ width: "25%", textAlign: "center", padding: "12px 4px" }}>
              <div style={{ backgroundColor: "#DBEAFE", borderRadius: "8px", padding: "12px" }}>
                <Text style={{ fontSize: "24px", fontWeight: "700", margin: "0", color: "#1D4ED8" }}>
                  {summary.totalTasks}
                </Text>
                <Text style={{ fontSize: "11px", margin: "4px 0 0 0", color: "#6B7280", textTransform: "uppercase" }}>
                  Active Tasks
                </Text>
              </div>
            </td>
            <td style={{ width: "25%", textAlign: "center", padding: "12px 4px" }}>
              <div style={{ backgroundColor: "#D1FAE5", borderRadius: "8px", padding: "12px" }}>
                <Text style={{ fontSize: "24px", fontWeight: "700", margin: "0", color: "#065F46" }}>
                  {summary.completedTasks}
                </Text>
                <Text style={{ fontSize: "11px", margin: "4px 0 0 0", color: "#6B7280", textTransform: "uppercase" }}>
                  Completed
                </Text>
              </div>
            </td>
            <td style={{ width: "25%", textAlign: "center", padding: "12px 4px" }}>
              <div style={{ backgroundColor: "#FEE2E2", borderRadius: "8px", padding: "12px" }}>
                <Text style={{ fontSize: "24px", fontWeight: "700", margin: "0", color: "#991B1B" }}>
                  {overdueTasks.length}
                </Text>
                <Text style={{ fontSize: "11px", margin: "4px 0 0 0", color: "#6B7280", textTransform: "uppercase" }}>
                  Overdue
                </Text>
              </div>
            </td>
            <td style={{ width: "25%", textAlign: "center", padding: "12px 4px" }}>
              <div style={{ backgroundColor: "#FEF3C7", borderRadius: "8px", padding: "12px" }}>
                <Text style={{ fontSize: "24px", fontWeight: "700", margin: "0", color: "#92400E" }}>
                  {summary.upcomingEventsCount}
                </Text>
                <Text style={{ fontSize: "11px", margin: "4px 0 0 0", color: "#6B7280", textTransform: "uppercase" }}>
                  Upcoming
                </Text>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <>
          <Hr style={styles.hr} />
          <div style={styles.dangerBox}>
            <Text style={{ fontSize: "15px", fontWeight: "700", margin: "0 0 12px 0", color: "#991B1B" }}>
              🚨 Overdue Tasks ({overdueTasks.length})
            </Text>
            {overdueTasks.slice(0, 5).map((task, i) => (
              <div key={i} style={{ padding: "6px 0", borderTop: i > 0 ? "1px solid #FECACA" : "none" }}>
                <Link href={task.taskUrl} style={{ color: "#991B1B", textDecoration: "none", fontSize: "14px", fontWeight: "600" }}>
                  {priorityEmoji[task.priority] ?? "⬜"} {task.title}
                </Link>
                <Text style={{ fontSize: "12px", color: "#6B7280", margin: "2px 0 0 0" }}>
                  {task.eventTitle} {task.deadline ? `• Due: ${task.deadline}` : ""}
                </Text>
              </div>
            ))}
            {overdueTasks.length > 5 && (
              <Text style={{ fontSize: "12px", color: "#991B1B", margin: "8px 0 0 0" }}>
                +{overdueTasks.length - 5} more overdue task(s)
              </Text>
            )}
          </div>
        </>
      )}

      {/* Assigned Tasks */}
      {assignedTasks.length > 0 && (
        <>
          <Hr style={styles.hr} />
          <Text style={{ ...styles.paragraph, fontWeight: "600" }}>
            📋 Your Active Tasks ({assignedTasks.length})
          </Text>
          <table cellPadding="0" cellSpacing="0" style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {assignedTasks.slice(0, 10).map((task, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: "10px 0", verticalAlign: "top" }}>
                    <Link href={task.taskUrl} style={{ color: "#111827", textDecoration: "none", fontSize: "14px", fontWeight: "500" }}>
                      {priorityEmoji[task.priority] ?? "⬜"} {task.title}
                    </Link>
                    <Text style={{ fontSize: "12px", color: "#6B7280", margin: "2px 0 0 0" }}>
                      {task.eventTitle}
                    </Text>
                  </td>
                  <td style={{ padding: "10px 0", textAlign: "right", verticalAlign: "top", whiteSpace: "nowrap" }}>
                    {task.deadline && (
                      <Text style={{ fontSize: "12px", color: "#6B7280", margin: 0 }}>
                        {task.deadline}
                      </Text>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {assignedTasks.length > 10 && (
            <Text style={{ fontSize: "12px", color: colors.textMuted, margin: "8px 0 0 0" }}>
              +{assignedTasks.length - 10} more task(s)
            </Text>
          )}
        </>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <>
          <Hr style={styles.hr} />
          <Text style={{ ...styles.paragraph, fontWeight: "600" }}>
            📅 Upcoming Events ({upcomingEvents.length})
          </Text>
          {upcomingEvents.slice(0, 5).map((event, i) => (
            <div
              key={i}
              style={{
                padding: "12px 16px",
                marginBottom: "8px",
                backgroundColor: "#F9FAFB",
                borderRadius: "8px",
                border: `1px solid ${colors.border}`,
              }}
            >
              <Link href={event.eventUrl} style={{ color: "#111827", textDecoration: "none", fontSize: "15px", fontWeight: "600" }}>
                {event.title}
              </Link>
              <Text style={{ fontSize: "13px", color: "#6B7280", margin: "4px 0 0 0" }}>
                📅 {event.date} {event.venue ? `• 📍 ${event.venue}` : ""}
              </Text>
            </div>
          ))}
        </>
      )}

      <Hr style={styles.hr} />

      <div style={{ textAlign: "center", margin: "24px 0" }}>
        <Link href={`${appUrl}/dashboard`} style={styles.button}>
          Open Dashboard
        </Link>
      </div>

      <Text style={styles.muted}>
        You&apos;re receiving this weekly digest every Monday. This email is sent to all active team members.
      </Text>
    </EmailLayout>
  );
}

export default WeeklyDigestEmail;
