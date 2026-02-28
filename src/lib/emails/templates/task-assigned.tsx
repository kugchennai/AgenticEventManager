import * as React from "react";
import {
  EmailLayout,
  DetailTable,
  DetailItem,
  PriorityBadge,
  styles,
  Text,
  Hr,
  Link,
} from "../components/layout";

interface TaskAssignedProps {
  taskTitle: string;
  priority: string;
  deadline?: string | null;
  eventName: string;
  taskUrl: string;
  assignedBy?: string;
}

export function TaskAssignedEmail({
  taskTitle,
  priority,
  deadline,
  eventName,
  taskUrl,
  assignedBy,
}: TaskAssignedProps) {
  return (
    <EmailLayout preview={`New task assigned: ${taskTitle}`}>
      <Text style={styles.h1}>Task Assigned 📋</Text>

      <Text style={styles.paragraph}>
        You&apos;ve been assigned a new task{assignedBy ? ` by ${assignedBy}` : ""}. Here are the details:
      </Text>

      <div style={styles.infoBox}>
        <Text style={{ fontSize: "16px", fontWeight: "700", margin: "0 0 8px 0", color: "#111827" }}>
          {taskTitle}
        </Text>
        <PriorityBadge priority={priority} />
      </div>

      <DetailTable>
        <DetailItem label="Event" value={eventName} />
        <DetailItem label="Priority" value={priority} />
        {deadline && <DetailItem label="Deadline" value={deadline} />}
      </DetailTable>

      <Hr style={styles.hr} />

      <div style={{ textAlign: "center", margin: "24px 0" }}>
        <Link href={taskUrl} style={styles.button}>
          View Task
        </Link>
      </div>

      <Text style={styles.muted}>
        You&apos;re receiving this because this task was assigned to you.
      </Text>
    </EmailLayout>
  );
}

export default TaskAssignedEmail;
