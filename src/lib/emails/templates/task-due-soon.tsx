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

interface TaskDueSoonProps {
  taskTitle: string;
  deadline: string;
  daysRemaining: number;
  eventName: string;
  taskUrl: string;
  priority: string;
  appName?: string;
  logoUrl?: string;
}

export function TaskDueSoonEmail({
  taskTitle,
  deadline,
  daysRemaining,
  eventName,
  taskUrl,
  priority,
  appName,
  logoUrl,
}: TaskDueSoonProps) {
  const urgencyText =
    daysRemaining <= 1
      ? "due tomorrow"
      : `due in ${daysRemaining} days`;

  return (
    <EmailLayout preview={`Task ${urgencyText}: ${taskTitle}`} appName={appName} logoUrl={logoUrl}>
      <Text style={styles.h1}>Task Due Soon ⏳</Text>

      <div style={styles.warningBox}>
        <Text style={{ fontSize: "16px", fontWeight: "700", margin: 0, color: colors.accentDark }}>
          &ldquo;{taskTitle}&rdquo; is {urgencyText}!
        </Text>
      </div>

      <Text style={styles.paragraph}>
        A task assigned to you is approaching its deadline. Please review and
        complete it before the due date.
      </Text>

      <DetailTable>
        <DetailItem label="Task" value={taskTitle} />
        <DetailItem label="Event" value={eventName} />
        <DetailItem label="Priority" value={priority} />
        <DetailItem label="Deadline" value={deadline} />
        <DetailItem label="Time Left" value={daysRemaining <= 1 ? "Less than 1 day" : `${daysRemaining} days`} />
      </DetailTable>

      <Hr style={styles.hr} />

      <div style={{ textAlign: "center", margin: "24px 0" }}>
        <Link href={taskUrl} style={styles.button}>
          Complete Task
        </Link>
      </div>

      <Text style={styles.muted}>
        You&apos;re receiving this because this task is assigned to you and is approaching its deadline.
      </Text>
    </EmailLayout>
  );
}

export default TaskDueSoonEmail;
