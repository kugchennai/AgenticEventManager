import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-helpers";
import { hasMinimumRole } from "@/lib/permissions";
import { logAudit, diffChanges } from "@/lib/audit";
import type { GlobalRole } from "@/generated/prisma/enums";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getAuthSession(req);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const venue = await prisma.venuePartner.findUnique({
    where: { id },
    include: {
      events: {
        include: {
          event: { select: { id: true, title: true, date: true, status: true } },
        },
      },
      _count: { select: { events: true } },
    },
  });

  if (!venue) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(venue);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getAuthSession(req);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasMinimumRole(session.user.globalRole as GlobalRole, "EVENT_LEAD")) {
    return NextResponse.json(
      { error: "Forbidden: Event Lead role required" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { name, contactName, email, phone, address, capacity, notes, website, photoUrl } = body;

  const before = await prisma.venuePartner.findUnique({ where: { id } });
  if (!before) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const venue = await prisma.venuePartner.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name?.trim() ?? before.name }),
      ...(contactName !== undefined && { contactName: contactName?.trim() || null }),
      ...(email !== undefined && { email: email?.trim() || null }),
      ...(phone !== undefined && { phone: phone?.trim() || null }),
      ...(address !== undefined && { address: address?.trim() || null }),
      ...(capacity !== undefined && { capacity: capacity !== null && capacity !== "" ? Number(capacity) : null }),
      ...(notes !== undefined && { notes: notes?.trim() || null }),
      ...(website !== undefined && { website: website?.trim() || null }),
      ...(photoUrl !== undefined && { photoUrl: photoUrl?.trim() || null }),
    },
    include: {
      events: true,
      _count: { select: { events: true } },
    },
  });

  const changes = diffChanges(
    {
      name: before.name,
      contactName: before.contactName,
      email: before.email,
      phone: before.phone,
      address: before.address,
      capacity: before.capacity,
      notes: before.notes,
      website: before.website,
      photoUrl: before.photoUrl,
    },
    {
      name: venue.name,
      contactName: venue.contactName,
      email: venue.email,
      phone: venue.phone,
      address: venue.address,
      capacity: venue.capacity,
      notes: venue.notes,
      website: venue.website,
      photoUrl: venue.photoUrl,
    }
  );

  if (Object.keys(changes).length > 0) {
    await logAudit({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "VenuePartner",
      entityId: id,
      entityName: venue.name,
      changes,
    });
  }

  return NextResponse.json(venue);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getAuthSession(req);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasMinimumRole(session.user.globalRole as GlobalRole, "EVENT_LEAD")) {
    return NextResponse.json(
      { error: "Forbidden: Event Lead role required" },
      { status: 403 }
    );
  }

  const venue = await prisma.venuePartner.findUnique({
    where: { id },
    include: { _count: { select: { events: true } } },
  });

  if (!venue) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.venuePartner.delete({ where: { id } });

  await logAudit({
    userId: session.user.id,
    action: "DELETE",
    entityType: "VenuePartner",
    entityId: id,
    entityName: venue.name,
  });

  return NextResponse.json({ success: true });
}
