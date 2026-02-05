import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { generateId } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const event = await db.query.events.findFirst({
      where: eq(schema.events.id, id),
      with: {
        exceptions: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const editMode = searchParams.get("editMode") || "all";
  const instanceDate = searchParams.get("date");

  try {
    const body = await request.json();
    const now = new Date();

    // Check if event exists
    const existingEvent = await db.query.events.findFirst({
      where: eq(schema.events.id, id),
    });

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (editMode === "single" && instanceDate) {
      // Edit single occurrence - create/update an exception
      const originalDate = new Date(instanceDate);

      // Check for existing exception
      const existingException = await db.query.eventExceptions.findFirst({
        where: and(
          eq(schema.eventExceptions.eventId, id),
          eq(schema.eventExceptions.originalDate, originalDate)
        ),
      });

      if (existingException) {
        // Update existing exception
        await db
          .update(schema.eventExceptions)
          .set({
            modifiedName: body.name !== undefined ? body.name : existingException.modifiedName,
            modifiedStartTime: body.startTime !== undefined ? body.startTime : existingException.modifiedStartTime,
            modifiedEndTime: body.endTime !== undefined ? body.endTime : existingException.modifiedEndTime,
            modifiedLocation: body.location !== undefined ? body.location : existingException.modifiedLocation,
          })
          .where(eq(schema.eventExceptions.id, existingException.id));
      } else {
        // Create new exception
        await db.insert(schema.eventExceptions).values({
          id: generateId(),
          eventId: id,
          originalDate,
          modifiedName: body.name || null,
          modifiedStartTime: body.startTime || null,
          modifiedEndTime: body.endTime || null,
          modifiedLocation: body.location || null,
          createdAt: now,
        });
      }
    } else if (editMode === "thisAndFuture" && instanceDate) {
      // Split the series - update recurrence end on original, create new event for future
      const splitDate = new Date(instanceDate);

      // End the original series the day before
      const endDate = new Date(splitDate);
      endDate.setDate(endDate.getDate() - 1);

      await db
        .update(schema.events)
        .set({
          recurrenceEnd: endDate,
          updatedAt: now,
        })
        .where(eq(schema.events.id, id));

      // Create new event starting from split date with updated values
      const newEvent = {
        id: generateId(),
        name: body.name ?? existingEvent.name,
        description: body.description ?? existingEvent.description,
        location: body.location ?? existingEvent.location,
        startDate: splitDate,
        startTime: body.startTime ?? existingEvent.startTime,
        endTime: body.endTime ?? existingEvent.endTime,
        isAllDay: body.isAllDay ?? existingEvent.isAllDay,
        color: body.color ?? existingEvent.color,
        recurrenceRule: body.recurrenceRule ?? existingEvent.recurrenceRule,
        recurrenceEnd: body.recurrenceEnd ? new Date(body.recurrenceEnd) : existingEvent.recurrenceEnd,
        createdAt: now,
        updatedAt: now,
      };

      await db.insert(schema.events).values(newEvent);

      revalidatePath("/");
      revalidatePath("/calendar");

      return NextResponse.json({ event: newEvent, originalEvent: existingEvent });
    } else {
      // Edit all occurrences - update the main event
      const updates: Record<string, unknown> = { updatedAt: now };

      if (body.name !== undefined) updates.name = body.name;
      if (body.description !== undefined) updates.description = body.description;
      if (body.location !== undefined) updates.location = body.location;
      if (body.startDate !== undefined) updates.startDate = new Date(body.startDate);
      if (body.startTime !== undefined) updates.startTime = body.startTime;
      if (body.endTime !== undefined) updates.endTime = body.endTime;
      if (body.isAllDay !== undefined) updates.isAllDay = body.isAllDay;
      if (body.color !== undefined) updates.color = body.color;
      if (body.recurrenceRule !== undefined) updates.recurrenceRule = body.recurrenceRule;
      if (body.recurrenceEnd !== undefined) {
        updates.recurrenceEnd = body.recurrenceEnd ? new Date(body.recurrenceEnd) : null;
      }

      await db
        .update(schema.events)
        .set(updates)
        .where(eq(schema.events.id, id));
    }

    // Fetch updated event
    const event = await db.query.events.findFirst({
      where: eq(schema.events.id, id),
      with: {
        exceptions: true,
      },
    });

    revalidatePath("/");
    revalidatePath("/calendar");

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const deleteMode = searchParams.get("deleteMode") || "all";
  const instanceDate = searchParams.get("date");

  try {
    const existingEvent = await db.query.events.findFirst({
      where: eq(schema.events.id, id),
    });

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (deleteMode === "single" && instanceDate) {
      // Delete single occurrence - create a cancellation exception
      const originalDate = new Date(instanceDate);
      const now = new Date();

      // Check for existing exception
      const existingException = await db.query.eventExceptions.findFirst({
        where: and(
          eq(schema.eventExceptions.eventId, id),
          eq(schema.eventExceptions.originalDate, originalDate)
        ),
      });

      if (existingException) {
        await db
          .update(schema.eventExceptions)
          .set({ isCancelled: true })
          .where(eq(schema.eventExceptions.id, existingException.id));
      } else {
        await db.insert(schema.eventExceptions).values({
          id: generateId(),
          eventId: id,
          originalDate,
          isCancelled: true,
          createdAt: now,
        });
      }
    } else if (deleteMode === "thisAndFuture" && instanceDate) {
      // Delete this and future - update recurrence end
      const endDate = new Date(instanceDate);
      endDate.setDate(endDate.getDate() - 1);

      await db
        .update(schema.events)
        .set({
          recurrenceEnd: endDate,
          updatedAt: new Date(),
        })
        .where(eq(schema.events.id, id));
    } else {
      // Delete all occurrences - delete the event (exceptions cascade)
      await db.delete(schema.events).where(eq(schema.events.id, id));
    }

    revalidatePath("/");
    revalidatePath("/calendar");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
