import * as React from "react";
import {
  EmailLayout,
  DetailTable,
  DetailItem,
  styles,
  Text,
  Hr,
} from "../components/layout";

interface SpeakerInvitationProps {
  speakerName: string;
  eventTitle: string;
  topic?: string | null;
  date: string;
  venue?: string | null;
}

export function SpeakerInvitationEmail({
  speakerName,
  eventTitle,
  topic,
  date,
  venue,
}: SpeakerInvitationProps) {
  return (
    <EmailLayout preview={`You're invited to speak at ${eventTitle}`}>
      <Text style={styles.h1}>Speaker Invitation 🎤</Text>

      <Text style={styles.paragraph}>
        Hi {speakerName},
      </Text>

      <Text style={styles.paragraph}>
        We&apos;d love to invite you to speak at our upcoming event!
        Here are the details:
      </Text>

      <div style={styles.infoBox}>
        <Text style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 8px 0", color: "#111827" }}>
          {eventTitle}
        </Text>
        {topic && (
          <Text style={{ fontSize: "14px", margin: 0, color: "#6B7280" }}>
            Topic: {topic}
          </Text>
        )}
      </div>

      <DetailTable>
        <DetailItem label="Event" value={eventTitle} />
        <DetailItem label="Date" value={date} />
        {venue && <DetailItem label="Venue" value={venue} />}
        {topic && <DetailItem label="Topic" value={topic} />}
      </DetailTable>

      <Hr style={styles.hr} />

      <Text style={styles.paragraph}>
        We&apos;re excited about the possibility of having you as a speaker.
        If you have any questions about the event or your session, please
        don&apos;t hesitate to reach out.
      </Text>

      <Text style={styles.muted}>
        You&apos;re receiving this because you were added as a speaker for this event.
      </Text>
    </EmailLayout>
  );
}

export default SpeakerInvitationEmail;
