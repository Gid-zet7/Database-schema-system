import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a database designer. Generate SQL Schemas based on user requirements.

Process:
First Response: Generate SQL schema right away.
Follow-up Questions (Direct & Concise):
-Does this look good?
-Want to modify any schema?
-Need to add more features?
-Want to change any relationships?


SQL format:
CREATE TABLE table_name (
  column_name data_type constraints,
  ...
);

No explanations—just produce the result.
Keep responses short and direct.
Continue asking relevant questions and wait for user input.
Maintain a natural conversational tone (e.g., "Got it, let's start with...").`;

function splitSqlAndText(content: string) {
  const sqlRegex = /```(?:sql)?\s*([\s\S]*?)\s*```/;

  const sqlMatch = content.match(sqlRegex);

  if (sqlMatch) {
    const sqlPart = sqlMatch[1];
    const textPart = content.split(sqlMatch[0])[1]?.trim() || "";
    return {
      sql: sqlPart,
      text: textPart,
    };
  }

  return { sql: null, text: content };
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    console.log(messages);

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0].message.content;
    console.log(response);
    if (!response) {
      throw new Error("No response from OpenAI");
    }

    let parsedResponse;

    try {
      parsedResponse = JSON.parse(response);
      console.log(parsedResponse);
    } catch (e) {
      const { sql, text } = splitSqlAndText(response);
      parsedResponse = {
        schema: sql,
        text: text,
      };
    }

    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
