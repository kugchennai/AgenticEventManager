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

interface EventReminderProps {
  eventTitle: string;
  date: string;
  venue?: string | null;
  location?: string | null;
  eventUrl: string;
  daysUntil: number;
}

export function EventReminderEmail({
  eventTitle,
  date,
  venue,
  location,
  eventUrl,
  daysUntil,
}: EventReminderProps) {
  const urgencyLabel = daysUntil <= 1 ? "Tomorrow" : `In ${daysUntil} Days`;

  return (
    <EmailLayout preview={`Reminder: ${eventTitle} is ${urgencyLabel.toLowerCase()}`}>
      <Text style={styles.h1}>Event Reminder ⏰</Text>

      <div style={styles.warningBox}>
        <Text style={{ fontSize: "16px", fontWeight: "700", margin: 0, color: colors.accentDark }}>
          {eventTitle} is {urgencyLabel.toLowerCase()}!
        </Text>
      </div>

      <Text style={styles.paragraph}>
        This is a friendly reminder that the following event is coming up soon.
        Please make sure everything is prepared.
      </Text>

      <DetailTable>
        <DetailItem label="Event" value={eventTitle} />
        <DetailItem label="Date" value={date} />
        {venue && <DetailItem label="Venue" value={venue} />}
        {location && <DetailItem label="Location" value={location} />}
        <DetailItem label="Days Until" value={urgencyLabel} />
      </DetailTable>

      <Hr style={styles.hr} />

      <div style={{ textAlign: "center", margin: "24px 0" }}>
        <Link href={eventUrl} style={styles.button}>
          View Event Page
        </Link>
      </div>

      <div style={styles.infoBox}>
        <Text style={{ ...styles.muted, margin: 0 }}>
          📎 A calendar file (.ics) is attached to this email.
          Open it to add this event to your calendar.
        </Text>
      </div>

      <Text style={styles.muted}>
        You&apos;re receiving this because you&apos;re part of the event team or a confirmed speaker.
      </Text>
    </EmailLayout>
  );
}

export default EventReminderEmail;
