# Custom Tasks, Sponsors/Gifts & Inventory

> **Status:** Planned  
> **Created:** 1 March 2026

## TL;DR

Two features: (1) Add inline "Add Checklist" and "Add Task" UI to the existing SOP Checklist tab, and (2) a new "Sponsors & Gifts" tab on the event detail page (visible to members+) with event-specific sponsors and gift tracking. Remaining gifts auto-transfer to a new top-level `/inventory` page 10 days after event ends via a daily cron job.

---

## Database Changes

### Visual Schema

```
┌─────────────────────────────────────────────────────────────────────┐
│                        NEW ENUMS                                    │
├─────────────────────────────────────────────────────────────────────┤
│  SponsorType:   MONETARY | IN_KIND | MEDIA | OTHER                 │
│  SponsorStatus: PROSPECT | CONTACTED | CONFIRMED | DECLINED        │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────┐       ┌──────────────────────────────┐
│       EventSponsor           │       │         EventGift            │
│ (NEW - event-scoped)         │       │ (NEW - event-scoped)         │
├──────────────────────────────┤       ├──────────────────────────────┤
│ id         String  @id       │◄──┐   │ id         String  @id       │
│ eventId    String  FK ───────┼─┐ │   │ eventId    String  FK ───────┼─┐
│ name       String            │ │ │   │ sponsorId  String? FK ───────┼─┼──┐
│ contactName String?          │ │ │   │ name       String            │ │  │
│ email      String?           │ │ │   │ description String?          │ │  │
│ phone      String?           │ │ │   │ quantity   Int               │ │  │
│ type       SponsorType       │ │ │   │ unitCost   Decimal?          │ │  │
│ amount     Decimal?          │ │ │   │ totalCost  Decimal?          │ │  │
│ notes      String?           │ │ │   │ distributed Int  @default(0) │ │  │
│ status     SponsorStatus     │ │ │   │ movedToInventory Boolean     │ │  │
│            @default(PROSPECT)│ │ │   │            @default(false)   │ │  │
│ createdById String FK ──┐    │ │ │   │ movedToInventoryAt DateTime? │ │  │
│ createdAt  DateTime      │   │ │ │   │ createdById String FK ──┐    │ │  │
│ updatedAt  DateTime      │   │ │ │   │ createdAt  DateTime      │   │ │  │
│                          │   │ │ │   │ updatedAt  DateTime      │   │ │  │
│ @@unique([eventId, name])│   │ │ │   │                          │   │ │  │
└──────────────────────────┼───┘ │ │   └──────────────────────────┼───┘ │  │
                           │     │ │                              │     │  │
                           ▼     │ │                              ▼     │  │
                  ┌────────────┐ │ │                     ┌────────────┐ │  │
                  │    User    │ │ │                     │    User    │ │  │
                  └────────────┘ │ │                     └────────────┘ │  │
                                 │ │                                    │  │
                                 ▼ │                                    ▼  │
         ┌───────────────────────────────────────────────────────────────┐ │
         │                     Event (EXISTING)                          │ │
         │                                                               │ │
         │  + sponsors  EventSponsor[]  ◄────────────────────────────────┘ │
         │  + gifts     EventGift[]     ◄──────────────────────────────────┘
         │                                                               │
         └───────────────────────────────────────────────────────────────┘

┌──────────────────────────────┐
│       InventoryItem          │
│ (NEW - org-wide)             │
├──────────────────────────────┤
│ id            String @id     │
│ name          String         │
│ description   String?        │
│ quantity      Int            │
│ sourceEventId String? FK ────┼──► Event
│ sourceGiftId  String? FK ────┼──► EventGift
│ createdAt     DateTime       │
│ updatedAt     DateTime       │
└──────────────────────────────┘
```

### Relationships

```
Event ──1:N──► EventSponsor ──1:N──► EventGift
  │                                      │
  ├──1:N──► EventGift (direct)           │  (optional sponsor link)
  │                                      │
  └──referenced by─── InventoryItem ◄────┘  (after cron transfer)
```

### Cron Job Flow (runs daily, 10 AM UTC)

```
EventGift                                    InventoryItem
┌────────────────────┐    10 days after     ┌────────────────────┐
│ quantity: 50       │    event ends         │ name: (from gift)  │
│ distributed: 35    │ ────────────────────► │ quantity: 15       │
│ remaining: 15      │    cron creates       │ sourceEventId: ... │
│ movedToInventory:  │    inventory item     │ sourceGiftId: ...  │
│   false → true     │                      └────────────────────┘
└────────────────────┘
```

---

### New Enums

| Enum | Values |
|------|--------|
| `SponsorType` | `MONETARY`, `IN_KIND`, `MEDIA`, `OTHER` |
| `SponsorStatus` | `PROSPECT`, `CONTACTED`, `CONFIRMED`, `DECLINED` |

### New Models

**`EventSponsor`** — Event-scoped sponsor tracking

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | `@id @default(cuid())` |
| `eventId` | String | FK → Event |
| `name` | String | Sponsor/company name |
| `contactName` | String? | Contact person |
| `email` | String? | |
| `phone` | String? | |
| `type` | SponsorType | `@default(MONETARY)` |
| `amount` | Decimal? | Sponsorship value |
| `notes` | String? | |
| `status` | SponsorStatus | `@default(PROSPECT)` |
| `createdById` | String | FK → User |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |
| **Constraint** | `@@unique([eventId, name])` | Prevent duplicate sponsors per event |

**`EventGift`** — Gift/swag items per event

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | `@id @default(cuid())` |
| `eventId` | String | FK → Event |
| `sponsorId` | String? | Optional FK → EventSponsor |
| `name` | String | Gift item name |
| `description` | String? | |
| `quantity` | Int | Total quantity bought/received |
| `unitCost` | Decimal? | Cost per unit |
| `totalCost` | Decimal? | Total cost |
| `distributed` | Int | `@default(0)` — count given out |
| `movedToInventory` | Boolean | `@default(false)` |
| `movedToInventoryAt` | DateTime? | When cron transferred it |
| `createdById` | String | FK → User |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

**`InventoryItem`** — Org-wide inventory (post-event leftover + manual items)

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | `@id @default(cuid())` |
| `name` | String | |
| `description` | String? | |
| `quantity` | Int | |
| `sourceEventId` | String? | FK → Event (nullable for manual items) |
| `sourceGiftId` | String? | FK → EventGift (nullable for manual items) |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

### Modified Models

**`Event`** — Add two new relations:
- `sponsors EventSponsor[]`
- `gifts EventGift[]`

---

## Implementation Steps

### Feature 1: Custom Tasks (Inline in Checklist Tab)

1. **Add "New Checklist" button** — In `src/app/events/[id]/page.tsx`, inside `ChecklistTab` (~line 924), add button next to "Change SOP Template". Visible when `canEdit`. Opens modal with `title` and `section` (Pre-Event / On-Day / Post-Event). Calls `POST /api/checklists` with `eventId`.

2. **Add "Add Task" row per checklist** — Inside each checklist task list (~line 1050), add "+ Add Task" row at bottom. Inline form: `title` (required), `priority` (dropdown), `deadline` (DateTimePicker), `assigneeId` (volunteer picker). Submits via `POST /api/checklists/[id]/tasks`.

3. **Add delete task button** — Trash icon on each `TaskRow` for EVENT_LEAD+. Calls `DELETE /api/checklists/[id]/tasks/[taskId]`.

4. **Add delete checklist API + UI** — New `DELETE` handler at `src/app/api/checklists/[id]/route.ts`. Cascade-deletes tasks. Add delete button on checklist header for ADMIN+.

5. **Refresh data after mutations** — Call `fetchEvent()` after any create/delete operation.

### Feature 2: Sponsors & Gifts Tab

6. **Add Prisma models** — Add all three new models + enums to `prisma/schema.prisma`.

7. **Create and run migration** — `npx prisma migrate dev --name add_sponsors_gifts_inventory`

8. **Sponsors API** — New `src/app/api/events/[id]/sponsors/`:
   - `route.ts`: `GET` (list), `POST` (create) — read for VOLUNTEER+, write for EVENT_LEAD+
   - `[sponsorId]/route.ts`: `PATCH`, `DELETE` — EVENT_LEAD+
   - Follow venue partner auth/audit patterns

9. **Gifts API** — New `src/app/api/events/[id]/gifts/`:
   - `route.ts`: `GET` (list with sponsor info), `POST` (create)
   - `[giftId]/route.ts`: `PATCH` (update distributed count), `DELETE`
   - Same permission pattern

10. **Inventory API** — New `src/app/api/inventory/route.ts`:
    - `GET`: List all items with search/filter — VOLUNTEER+ global role

11. **Add tab to event detail** — In `src/app/events/[id]/page.tsx`:
    - Add `"sponsors"` to `Tab` union type
    - Add `{ id: "sponsors", label: "Sponsors & Gifts", icon: Gift }` to `TABS`
    - Conditionally render tab button only for VOLUNTEER+ global role

12. **Sponsors section UI** — Summary cards (total amount, confirmed count, gifts count, budget), "Add Sponsor" modal, expandable sponsor cards with status dropdown, type badge, delete button.

13. **Gifts section UI** — "Add Gift" modal, gift table with distribute counter (±), remaining calculation, sponsor link, cost display, summary row.

### Feature 3: Inventory Page & Cron Job

14. **Inventory transfer cron** — New `src/app/api/cron/inventory-transfer/route.ts`:
    - CRON_SECRET validation (same pattern as existing crons)
    - Query: `EventGift` where `movedToInventory=false`, `quantity - distributed > 0`, event `endDate` ≤ 10 days ago, event status `COMPLETED`
    - Create `InventoryItem` per qualifying gift, mark gift as transferred
    - Return JSON summary

15. **Register cron** — Add to `vercel.json`:
    ```json
    { "path": "/api/cron/inventory-transfer", "schedule": "0 10 * * *" }
    ```

16. **Inventory page** — New `src/app/inventory/page.tsx`: `PageHeader`, searchable table, source event links, manual "Add Item" form, quantity adjustments. VOLUNTEER+ access.

17. **Add to navigation** — Add "Inventory" link with `Package` icon in sidebar for VOLUNTEER+.

---

## Permissions

| Role | Sponsors & Gifts Tab | Sponsors CRUD | Gifts CRUD | Inventory Page |
|------|---------------------|---------------|------------|----------------|
| VIEWER | Hidden | — | — | — |
| VOLUNTEER | Visible (read-only) | Read | Read | Read |
| EVENT_LEAD | Full access | Full CRUD | Full CRUD | Read + Add |
| ADMIN | Full access | Full CRUD | Full CRUD | Full CRUD |
| SUPER_ADMIN | Full access | Full CRUD | Full CRUD | Full CRUD |

---

## Verification

- **Custom Tasks**: Create event → Checklist tab → add checklist → add tasks inline → delete task → verify audit logs
- **Sponsors & Gifts**: Create event → Sponsors tab → add sponsor → add gift → update distributed count → verify calculations → confirm tab hidden for VIEWER
- **Inventory Cron**: Complete event with remaining gifts → wait 10+ days (or adjust date) → trigger cron manually via `GET /api/cron/inventory-transfer?secret=<CRON_SECRET>` → verify InventoryItem records → check `/inventory` page
- **Permissions**: VIEWER = no tab, VOLUNTEER = read-only, EVENT_LEAD = full edit

---

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Custom tasks location | Existing Checklist tab | Unified task management |
| Sponsor scope | Event-specific (no global directory) | Simpler model, no cross-event reuse needed |
| Gift model | Independent items with optional sponsor link | Flexible — not every gift comes from a sponsor |
| Inventory location | Top-level `/inventory` page | Proper visibility, org-wide context |
| Cron schedule | Daily 10 AM UTC | After existing crons, transfers 10 days post-event |
| Models | 3 new (EventSponsor, EventGift, InventoryItem) | Clean separation: event-scoped vs org-wide |
