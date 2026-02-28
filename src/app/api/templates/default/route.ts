import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-helpers";
import { hasMinimumRole } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import type { GlobalRole } from "@/generated/prisma/enums";

type DefaultTask = {
  title: string;
  relativeDays: number;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  section: "PRE_EVENT" | "ON_DAY" | "POST_EVENT";
  subcategory?: string;
};

const DEFAULT_SOP_TASKS: DefaultTask[] = [
  // ── PRE-EVENT: Planning & Coordination ──
  { title: "Finalize event date, time, and theme", relativeDays: 30, priority: "CRITICAL", section: "PRE_EVENT", subcategory: "Planning & Coordination" },
  { title: "Check Sessionize for speaker submissions", relativeDays: 28, priority: "HIGH", section: "PRE_EVENT", subcategory: "Planning & Coordination" },
  { title: "Confirm speaker(s) and hackathon/jam format (if applicable)", relativeDays: 21, priority: "CRITICAL", section: "PRE_EVENT", subcategory: "Planning & Coordination" },
  { title: "Create event brief (agenda, audience, outcomes)", relativeDays: 21, priority: "HIGH", section: "PRE_EVENT", subcategory: "Planning & Coordination" },
  { title: "Confirm food, swag, or sponsorships", relativeDays: 14, priority: "HIGH", section: "PRE_EVENT", subcategory: "Planning & Coordination" },
  { title: "Arrange speaker gifts", relativeDays: 7, priority: "MEDIUM", section: "PRE_EVENT", subcategory: "Planning & Coordination" },

  // ── PRE-EVENT: Creatives & Content ──
  { title: "Use last event testimonials for promotion", relativeDays: 21, priority: "MEDIUM", section: "PRE_EVENT", subcategory: "Creatives & Content" },
  { title: "Write event description (short + long)", relativeDays: 21, priority: "HIGH", section: "PRE_EVENT", subcategory: "Creatives & Content" },
  { title: "Design event banner (16:9, 1:1, and story formats)", relativeDays: 18, priority: "HIGH", section: "PRE_EVENT", subcategory: "Creatives & Content" },
  { title: "Create speaker post templates in Canva", relativeDays: 14, priority: "MEDIUM", section: "PRE_EVENT", subcategory: "Creatives & Content" },
  { title: "Design individual speaker announcement posts for all platforms", relativeDays: 14, priority: "MEDIUM", section: "PRE_EVENT", subcategory: "Creatives & Content" },
  { title: "Create Canva promo video (15–30 sec; square + story)", relativeDays: 12, priority: "MEDIUM", section: "PRE_EVENT", subcategory: "Creatives & Content" },
  { title: "Prepare speaker intro slides", relativeDays: 7, priority: "HIGH", section: "PRE_EVENT", subcategory: "Creatives & Content" },
  { title: "Draft thank-you & recap post templates", relativeDays: 5, priority: "LOW", section: "PRE_EVENT", subcategory: "Creatives & Content" },

  // ── PRE-EVENT: Event Page & Registration ──
  { title: "Create Luma page", relativeDays: 21, priority: "CRITICAL", section: "PRE_EVENT", subcategory: "Event Page & Registration" },
  { title: "Set capacity (e.g. 200) and enable over-capacity waiting list", relativeDays: 21, priority: "HIGH", section: "PRE_EVENT", subcategory: "Event Page & Registration" },
  { title: "Set up custom registration questions", relativeDays: 21, priority: "HIGH", section: "PRE_EVENT", subcategory: "Event Page & Registration" },
  { title: "Add all event details, creatives, and promo video to event page", relativeDays: 18, priority: "HIGH", section: "PRE_EVENT", subcategory: "Event Page & Registration" },
  { title: "Invite all subscribers via Luma", relativeDays: 18, priority: "HIGH", section: "PRE_EVENT", subcategory: "Event Page & Registration" },
  { title: "Add co-hosts / managers to event page", relativeDays: 18, priority: "MEDIUM", section: "PRE_EVENT", subcategory: "Event Page & Registration" },

  // ── PRE-EVENT: Promotions & Announcements ──
  { title: "Post on Twitter (X)", relativeDays: 14, priority: "HIGH", section: "PRE_EVENT", subcategory: "Promotions & Announcements" },
  { title: "Post on Instagram (feed + story + reel)", relativeDays: 14, priority: "HIGH", section: "PRE_EVENT", subcategory: "Promotions & Announcements" },
  { title: "Share on LinkedIn, WhatsApp, Slack, and Discord", relativeDays: 14, priority: "HIGH", section: "PRE_EVENT", subcategory: "Promotions & Announcements" },
  { title: "Try to partner with other communities", relativeDays: 14, priority: "MEDIUM", section: "PRE_EVENT", subcategory: "Promotions & Announcements" },
  { title: "Cross-post on tech community boards (e.g. tamilnadu.tech)", relativeDays: 12, priority: "MEDIUM", section: "PRE_EVENT", subcategory: "Promotions & Announcements" },
  { title: "Submit to official events page (e.g. JetBrains, Google)", relativeDays: 14, priority: "MEDIUM", section: "PRE_EVENT", subcategory: "Promotions & Announcements" },
  { title: "Seek goodies/swag support from sponsors", relativeDays: 14, priority: "MEDIUM", section: "PRE_EVENT", subcategory: "Promotions & Announcements" },
  { title: "Schedule reminder posts (3 days + 1 day before)", relativeDays: 5, priority: "HIGH", section: "PRE_EVENT", subcategory: "Promotions & Announcements" },

  // ── PRE-EVENT: Venue & Logistics ──
  { title: "Confirm venue booking & capacity", relativeDays: 14, priority: "CRITICAL", section: "PRE_EVENT", subcategory: "Venue & Logistics" },
  { title: "Arrange projector, mic, Wi-Fi, and seating", relativeDays: 7, priority: "HIGH", section: "PRE_EVENT", subcategory: "Venue & Logistics" },
  { title: "Keep backup cables/adapters ready", relativeDays: 3, priority: "MEDIUM", section: "PRE_EVENT", subcategory: "Venue & Logistics" },

  // ── PRE-EVENT: Volunteer Coordination ──
  { title: "Assign volunteer lead to run awards and track tasks", relativeDays: 10, priority: "HIGH", section: "PRE_EVENT", subcategory: "Volunteer Coordination" },
  { title: "Assign volunteers for: Registration desk, AV setup, Photo/video, Food coordination, Gift distribution & cleanup", relativeDays: 7, priority: "HIGH", section: "PRE_EVENT", subcategory: "Volunteer Coordination" },
  { title: "Conduct pre-event sync with all volunteers", relativeDays: 3, priority: "HIGH", section: "PRE_EVENT", subcategory: "Volunteer Coordination" },

  // ── ON-DAY: Venue Setup & Live Operations ──
  { title: "Ensure AV & lighting tested before start", relativeDays: 0, priority: "CRITICAL", section: "ON_DAY", subcategory: "Venue Setup & Live Operations" },
  { title: "Setup registration desk with QR sign-in", relativeDays: 0, priority: "HIGH", section: "ON_DAY", subcategory: "Venue Setup & Live Operations" },
  { title: "Arrange projector, mic, Wi-Fi, and seating (final check)", relativeDays: 0, priority: "HIGH", section: "ON_DAY", subcategory: "Venue Setup & Live Operations" },
  { title: "Organize stickers, swags, snacks, and water", relativeDays: 0, priority: "MEDIUM", section: "ON_DAY", subcategory: "Venue Setup & Live Operations" },
  { title: "Prepare speaker gifts for distribution after sessions", relativeDays: 0, priority: "MEDIUM", section: "ON_DAY", subcategory: "Venue Setup & Live Operations" },

  // ── ON-DAY: During the Event ──
  { title: "Capture photos & short clips", relativeDays: 0, priority: "HIGH", section: "ON_DAY", subcategory: "During the Event" },
  { title: "Post live updates/stories on social media", relativeDays: 0, priority: "MEDIUM", section: "ON_DAY", subcategory: "During the Event" },
  { title: "Track attendee count & highlights", relativeDays: 0, priority: "MEDIUM", section: "ON_DAY", subcategory: "During the Event" },
  { title: "Collect feedback or testimonials from attendees", relativeDays: 0, priority: "MEDIUM", section: "ON_DAY", subcategory: "During the Event" },

  // ── ON-DAY: Awards & Recognition ──
  { title: "Keep name list & prizes table ready by noon on event day", relativeDays: 0, priority: "HIGH", section: "ON_DAY", subcategory: "Awards & Recognition" },
  { title: "Distribute speaker gifts after their session (thank-you token)", relativeDays: 0, priority: "MEDIUM", section: "ON_DAY", subcategory: "Awards & Recognition" },
  { title: "Announce and award hackathon winners at closing", relativeDays: 0, priority: "HIGH", section: "ON_DAY", subcategory: "Awards & Recognition" },
  { title: "Certificates or goodies for top 3 winners", relativeDays: 0, priority: "MEDIUM", section: "ON_DAY", subcategory: "Awards & Recognition" },
  { title: "Special mention for creativity or teamwork", relativeDays: 0, priority: "LOW", section: "ON_DAY", subcategory: "Awards & Recognition" },
  { title: "Social promotion awards – recognize best event posts", relativeDays: 0, priority: "LOW", section: "ON_DAY", subcategory: "Awards & Recognition" },
  { title: "Pick best 1–2 posts tagged with event hashtag", relativeDays: 0, priority: "LOW", section: "ON_DAY", subcategory: "Awards & Recognition" },
  { title: "Give small gift (sticker pack, merch, voucher) for social winners", relativeDays: 0, priority: "LOW", section: "ON_DAY", subcategory: "Awards & Recognition" },
  { title: "Announce social winners publicly during closing remarks", relativeDays: 0, priority: "MEDIUM", section: "ON_DAY", subcategory: "Awards & Recognition" },
  { title: "Capture photo of each award moment for social media", relativeDays: 0, priority: "MEDIUM", section: "ON_DAY", subcategory: "Awards & Recognition" },

  // ── POST-EVENT: Follow-ups & Wrap-up ──
  { title: "Post thank-you message across platforms (X, LinkedIn, Instagram)", relativeDays: -1, priority: "HIGH", section: "POST_EVENT", subcategory: "Follow-ups & Wrap-up" },
  { title: "Add photos in shared drive", relativeDays: -1, priority: "HIGH", section: "POST_EVENT", subcategory: "Follow-ups & Wrap-up" },
  { title: "Send thank-you email to attendees", relativeDays: -1, priority: "HIGH", section: "POST_EVENT", subcategory: "Follow-ups & Wrap-up" },
  { title: "Share photo/video recap on social media", relativeDays: -2, priority: "MEDIUM", section: "POST_EVENT", subcategory: "Follow-ups & Wrap-up" },
  { title: "Send feedback form via Luma", relativeDays: -1, priority: "HIGH", section: "POST_EVENT", subcategory: "Follow-ups & Wrap-up" },
  { title: "Tag sponsors, speakers & winners in posts", relativeDays: -2, priority: "MEDIUM", section: "POST_EVENT", subcategory: "Follow-ups & Wrap-up" },
  { title: "Conduct event retro (30 min call, mandatory)", relativeDays: -3, priority: "CRITICAL", section: "POST_EVENT", subcategory: "Follow-ups & Wrap-up" },
];

export async function POST(req: NextRequest) {
  const session = await getAuthSession(req);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasMinimumRole(session.user.globalRole as GlobalRole, "ADMIN")) {
    return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
  }

  // Check if a default template already exists
  const existing = await prisma.sOPTemplate.findFirst({
    where: { name: "KUG Chennai Default SOP" },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Default SOP template already exists. You can duplicate or edit it instead." },
      { status: 409 }
    );
  }

  const template = await prisma.sOPTemplate.create({
    data: {
      name: "KUG Chennai Default SOP",
      description:
        "Standard operating procedure for KUG Chennai meetups — covers planning, creatives, promotions, venue logistics, volunteer coordination, event-day operations, awards, and post-event follow-ups.",
      defaultTasks: DEFAULT_SOP_TASKS,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "CREATE",
    entityType: "SOPTemplate",
    entityId: template.id,
    entityName: template.name,
    changes: {
      name: template.name,
      taskCount: DEFAULT_SOP_TASKS.length,
      source: "default_sop",
    },
  });

  return NextResponse.json(template, { status: 201 });
}
