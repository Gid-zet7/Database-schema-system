import { NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("schemas");

    const schema = await db
      .collection("schemas")
      .findOne({ _id: new ObjectId(id) });

    if (!schema) {
      return NextResponse.json({ error: "Schema not found" }, { status: 404 });
    }

    return NextResponse.json(schema);
  } catch (error) {
    console.error("Failed to fetch schema:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch schema";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("schemas");

    const { schema, messages, name } = await request.json();

    const result = await db.collection("schemas").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          schema: schema || {},
          messages: messages || [],
          name: name || "Untitled Project",
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Schema not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update schema:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update schema";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
