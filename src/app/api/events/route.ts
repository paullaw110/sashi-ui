import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { and, gte, lte } from "drizzle-orm";
import { generateId } from "@/lib/utils";
import { RRule } from "rrule";

// Expand recurring events into individual occurrences
function expandRecurringEvents(
  event: typeof schema.events.$inferSelect & { exceptions?: typeof schema.eventExceptions.$inferSelect[] },
  start: Date,
  end: Date
): Array<typeof schema.events.$inferSelect & {
  instanceDate: number;
  isRecurringInstance: boolean;
  exceptions?: typeof schema.eventExceptions.$inferSelect[];
}> {
  const exceptions = event.exceptions || [];
  const exceptionsByDate = new Map(
    exceptions.map((e) => [new Date(e.originalDate).toDateString(), e])
  );

  // Non-recurring event
  if (!event.recurrenceRule) {
    const eventDate = new Date(event.startDate);
    // Check if it falls within range
    if (eventDate >= start && eventDate <= end) {
      return [
        {
          ...event,
          instanceDate: eventDate.getTime(),
          isRecurringInstance: false,
        },
      ];
    }
    return [];
  }

  // Recurring event - expand occurrences
  try {
    const rule = RRule.fromString(event.recurrenceRule);
    // Set dtstart to event's start date
    rule.options.dtstart = new Date(event.startDate);

    const occurrences = rule.between(start, end, true);

    return occurrences
      .map((date) => {
        const dateKey = date.toDateString();
        const exception = exceptionsByDate.get(dateKey);

        // Skip cancelled occurrences
        if (exception?.isCancelled) {
          return null;
        }

        return {
          ...event,
          instanceDate: date.getTime(),
          isRecurringInstance: true,
          // Apply exception overrides if any
          name: exception?.modifiedName || event.name,
          startTime: exception?.modifiedStartTime || event.startTime,
          endTime: exception?.modifiedEndTime || event.endTime,
          location: exception?.modifiedLocation || event.location,
        };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null);
  } catch (error) {
    console.error("Error parsing recurrence rule:", error);
    // Fall back to single occurrence
    return [
      {
        ...event,
        instanceDate: new Date(event.startDate).getTime(),
        isRecurringInstance: false,
      },
    ];
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");

  // Default to current week if no range specified
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const start = startParam ? new Date(startParam) : startOfWeek;
  const end = endParam ? new Date(endParam) : endOfWeek;

  try {
    // Fetch events that could fall within the range
    // For recurring events, we need to fetch events that start before the end date
    const events = await db.query.events.findMany({
      where: and(
        lte(schema.events.startDate, end),
        // For recurring events, we can't filter by end date easily
        // So we fetch all events that start before our end date
      ),
      with: {
        exceptions: true,
      },
      orderBy: (events, { asc }) => [asc(events.startDate)],
    });

    // Expand recurring events and filter to date range
    const expandedEvents = events.flatMap((event) =>
      expandRecurringEvents(event, start, end)
    );

    // Sort by instance date
    expandedEvents.sort((a, b) => {
      if (!a || !b) return 0;
      return (a.instanceDate as number) - (b.instanceDate as number);
    });

    return NextResponse.json({ events: expandedEvents });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const now = new Date();

    // Parse startDate
    let parsedStartDate: Date;
    if (body.startDate) {
      if (typeof body.startDate === "string" && body.startDate.includes("T")) {
        parsedStartDate = new Date(body.startDate);
      } else if (typeof body.startDate === "string") {
        parsedStartDate = new Date(body.startDate + "T12:00:00");
      } else {
        parsedStartDate = new Date(body.startDate);
      }
    } else {
      parsedStartDate = now;
    }

    // Parse recurrenceEnd if provided
    let parsedRecurrenceEnd: Date | null = null;
    if (body.recurrenceEnd) {
      parsedRecurrenceEnd = new Date(body.recurrenceEnd);
    }

    const newEvent = {
      id: generateId(),
      name: body.name,
      description: body.description || null,
      location: body.location || null,
      startDate: parsedStartDate,
      startTime: body.startTime || null,
      endTime: body.endTime || null,
      isAllDay: body.isAllDay || false,
      color: body.color || "#3b82f6",
      recurrenceRule: body.recurrenceRule || null,
      recurrenceEnd: parsedRecurrenceEnd,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(schema.events).values(newEvent);

    // Query back for complete data
    const event = await db.query.events.findFirst({
      where: (events, { eq }) => eq(events.id, newEvent.id),
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
