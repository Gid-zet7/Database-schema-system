import { NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import clientPromise from "@/lib/mongodb";
// import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

    const schemas = await db
      .collection("schemas")
      .find({ userEmail: user.email })
      .sort({ updatedAt: -1 })
      .limit(5)
      .toArray();

    return NextResponse.json(schemas);
  } catch (error) {
    console.error("Failed to fetch schemas:", error);
    return NextResponse.json(
      { error: "Failed to fetch schemas" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

    const { name, schema } = await request.json();

    const newSchema = {
      name: name || "Untitled Project",
      schema: schema || {},
      messages: [],
      userEmail: user?.email,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("schemas").insertOne(newSchema);

    // Return the complete schema document with the new _id
    return NextResponse.json({
      _id: result.insertedId,
      ...newSchema,
    });
  } catch (error) {
    console.error("Failed to create schema:", error);
    return NextResponse.json(
      { error: "Failed to create schema" },
      { status: 500 }
    );
  }
}
