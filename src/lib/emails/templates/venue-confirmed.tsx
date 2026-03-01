import * as React from "react";
import {
  EmailLayout,
  DetailTable,
  DetailItem,
  styles,
  Text,
  Hr,
} from "../components/layout";

interface VenueConfirmedProps {
  venueName: string;
  address?: string | null;
  capacity?: number | null;
  confirmationDate: string;
  eventTitle: string;
  contactName?: string | null;
  appName?: string;
  logoUrl?: string;
}

export function VenueConfirmedEmail({
  venueName,
  address,
  capacity,
  confirmationDate,
  eventTitle,
  contactName,
  appName,
  logoUrl,
}: VenueConfirmedProps) {
  return (
    <EmailLayout preview={`Venue confirmed: ${venueName} for ${eventTitle}`} appName={appName} logoUrl={logoUrl}>
      <Text style={styles.h1}>Venue Confirmed ✅</Text>

      <Text style={styles.paragraph}>
        Great news! A venue has been confirmed for <strong>{eventTitle}</strong>.
      </Text>

      <div style={styles.successBox}>
        <Text style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 4px 0", color: "#065F46" }}>
          {venueName}
        </Text>
        {address && (
          <Text style={{ fontSize: "14px", margin: 0, color: "#047857" }}>
            📍 {address}
          </Text>
        )}
      </div>

      <DetailTable>
        <DetailItem label="Venue" value={venueName} />
        {address && <DetailItem label="Address" value={address} />}
        {capacity != null && <DetailItem label="Capacity" value={`${capacity} people`} />}
        {contactName && <DetailItem label="Contact" value={contactName} />}
        <DetailItem label="Confirmed On" value={confirmationDate} />
        <DetailItem label="Event" value={eventTitle} />
      </DetailTable>

      <Hr style={styles.hr} />

      <Text style={styles.paragraph}>
        The event venue field has been automatically updated, and any
        venue-related SOP tasks have been marked as complete.
      </Text>

      <Text style={styles.muted}>
        You&apos;re receiving this because you&apos;re the event lead.
      </Text>
    </EmailLayout>
  );
}

export default VenueConfirmedEmail;
