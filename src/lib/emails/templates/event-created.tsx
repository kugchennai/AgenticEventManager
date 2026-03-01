import * as React from "react";
import {
  EmailLayout,
  DetailTable,
  DetailItem,
  styles,
  Text,
  Hr,
  Link,
} from "../components/layout";

interface EventCreatedProps {
  eventTitle: string;
  date: string;
  venue?: string | null;
  eventUrl: string;
  createdBy: string;
  appName?: string;
  logoUrl?: string;
}

export function EventCreatedEmail({
  eventTitle,
  date,
  venue,
  eventUrl,
  createdBy,
  appName,
  logoUrl,
}: EventCreatedProps) {
  return (
    <EmailLayout preview={`New event scheduled: ${eventTitle}`} appName={appName} logoUrl={logoUrl}>
      <Text style={styles.h1}>New Event Scheduled 📅</Text>

      <Text style={styles.paragraph}>
        A new event has been created and is now scheduled. Here are the details:
      </Text>

      <div style={styles.infoBox}>
        <Text style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 8px 0", color: "#111827" }}>
          {eventTitle}
        </Text>
      </div>

      <DetailTable>
        <DetailItem label="Date" value={date} />
        {venue && <DetailItem label="Venue" value={venue} />}
        <DetailItem label="Created By" value={createdBy} />
      </DetailTable>

      <Hr style={styles.hr} />

      <div style={{ textAlign: "center", margin: "24px 0" }}>
        <Link href={eventUrl} style={styles.button}>
          View Event Details
        </Link>
      </div>

      <Text style={styles.muted}>
        You&apos;re receiving this because you&apos;re a member of the event team.
      </Text>
    </EmailLayout>
  );
}

export default EventCreatedEmail;
