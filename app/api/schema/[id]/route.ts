import { NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId, WithId, Document } from "mongodb";

interface Schema extends Document {
  _id: ObjectId;
  schema: any;
  messages: any[];
  userEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("schemas");

    const schema = await db.collection("schemas").findOne({
      _id: new ObjectId(params.id),
      userEmail: user.email,
    });

    if (!schema) {
      return NextResponse.json({ error: "Schema not found" }, { status: 404 });
    }

    return NextResponse.json(schema);
  } catch (error) {
    console.error("Failed to fetch schema:", error);
    return NextResponse.json(
      { error: "Failed to fetch schema" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("schemas");

    // First find the existing document to ensure it belongs to the user
    const existingSchema = await db.collection("schemas").findOne({
      _id: new ObjectId(params.id),
      userEmail: user.email,
    });

    if (!existingSchema) {
      return NextResponse.json({ error: "Schema not found" }, { status: 404 });
    }

    const { schema, messages } = await request.json();

    const updateData = {
      $set: {
        schema: schema || existingSchema.schema,
        messages: messages || existingSchema.messages,
        updatedAt: new Date(),
      },
    };

    const result = await db
      .collection("schemas")
      .findOneAndUpdate({ _id: new ObjectId(params.id) }, updateData, {
        returnDocument: "after",
      });

    if (!result) {
      return NextResponse.json(
        { error: "Failed to update schema" },
        { status: 500 }
      );
    }

    return NextResponse.json(result as WithId<Schema>);
  } catch (error) {
    console.error("Failed to update schema:", error);
    return NextResponse.json(
      { error: "Failed to update schema" },
      { status: 500 }
    );
  }
}
