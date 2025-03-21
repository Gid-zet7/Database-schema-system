import { NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import clientPromise from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("schemas");

    const { schema, messages, name } = await request.json();

    const newSchema = {
      name: name || "Untitled Project",
      schema: schema || {},
      messages: messages || [],
      userEmail: user.email,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("schemas").insertOne(newSchema);

    return NextResponse.json({
      _id: result.insertedId,
      ...newSchema,
    });
  } catch (error) {
    console.error("Failed to save schema:", error);
    const message =
      error instanceof Error ? error.message : "Failed to save schema";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
