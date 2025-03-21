"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Send } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  role: "user" | "assistant";
  content: string;
  type?: "response" | "question";
}

interface Schema {
  _id: string;
  schema: any;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

function splitJsonAndText(content: string) {
  console.log(content);
  const jsonRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/;
  const sqlRegex = /```(?:sql)?\s*([\s\S]*?)\s*```/;

  const jsonMatch = content.match(jsonRegex);
  const sqlMatch = content.match(sqlRegex);

  if (jsonMatch) {
    const jsonPart = jsonMatch[1];
    const textPart = content.split(jsonMatch[0])[1]?.trim() || "";
    return {
      json: jsonPart,
      sql: null,
      text: textPart,
    };
  }

  if (sqlMatch) {
    const sqlPart = sqlMatch[1];
    const textPart = content.split(sqlMatch[0])[1]?.trim() || "";
    return {
      json: null,
      sql: sqlPart,
      text: textPart,
    };
  }

  return { json: null, sql: null, text: content };
}

function SQLTable({ sql }: { sql: string }) {
  // Split multiple CREATE TABLE statements
  const createTableStatements = sql.split(";").filter((stmt) => stmt.trim());

  return (
    <div className="flex flex-wrap gap-6">
      {createTableStatements.map((statement, tableIndex) => {
        // Remove any line breaks and extra spaces to normalize the SQL
        const normalizedStatement = statement.replace(/\s+/g, " ").trim();

        // Updated regex to better handle multi-line statements
        const createTableMatch = normalizedStatement.match(
          /CREATE TABLE\s+(\w+)\s*\(([\s\S]*)\)/i
        );

        if (!createTableMatch) return null;

        const tableName = createTableMatch[1];
        const columnsText = createTableMatch[2];

        // Split columns handling both commas between columns and within FOREIGN KEY constraints
        const columns = columnsText
          .split(",")
          .reduce((acc: any[], col: string) => {
            const trimmed = col.trim();

            // Handle FOREIGN KEY constraints
            if (trimmed.startsWith("FOREIGN KEY")) {
              const lastCol = acc[acc.length - 1];
              if (lastCol) {
                if (!lastCol.foreignKeys) lastCol.foreignKeys = [];
                lastCol.foreignKeys.push(trimmed);
              }
              return acc;
            }

            // Handle regular columns
            const [name, ...rest] = trimmed.split(/\s+/);
            const type = rest.join(" ");
            acc.push({ name, type });
            return acc;
          }, []);

        return (
          <div
            key={tableIndex}
            className="overflow-x-auto bg-white rounded-lg shadow flex-1 min-w-[350px]"
          >
            <div className="px-4 py-3 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700">
                Table: {tableName}
              </h4>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Column Name</TableHead>
                  <TableHead>Data Type</TableHead>
                  <TableHead>Constraints</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {columns.map((column, index) => {
                  const constraints = [];
                  if (column.type.includes("PRIMARY KEY"))
                    constraints.push("Primary Key");
                  if (column.type.includes("NOT NULL"))
                    constraints.push("Not Null");
                  if (column.type.includes("UNIQUE"))
                    constraints.push("Unique");
                  if (column.type.includes("FOREIGN KEY"))
                    constraints.push("Foreign Key");
                  if (column.foreignKeys) {
                    column.foreignKeys.forEach((fk: string) => {
                      constraints.push(`FK: ${fk}`);
                    });
                  }

                  const cleanType = column.type
                    .replace("PRIMARY KEY", "")
                    .replace("NOT NULL", "")
                    .replace("UNIQUE", "")
                    .replace("FOREIGN KEY", "")
                    .trim();

                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {column.name}
                      </TableCell>
                      <TableCell>{cleanType}</TableCell>
                      <TableCell>{constraints.join(", ")}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        );
      })}
    </div>
  );
}

const renderMessage = (
  message: { role: string; content: string },
  index: number
) => {
  const isAssistant = message.role === "assistant";
  // console.log(message.content);
  const { json, sql, text } = splitJsonAndText(message.content);
  // console.log(sql);
  // console.log(text);
  const baseClasses = `p-4 rounded-lg ${
    isAssistant ? "bg-white border border-gray-200" : "bg-gray-50 ml-auto"
  }`;

  return (
    <div key={index} className="space-y-2">
      {json && (
        <div className={`${baseClasses} font-mono`}>
          <pre className="whitespace-pre-wrap break-words">
            {JSON.stringify(JSON.parse(json), null, 2)}
          </pre>
        </div>
      )}
      {sql && (
        <div className={`${baseClasses} overflow-x-auto`}>
          <div className="min-w-full md:w-auto">
            <SQLTable sql={sql} />
          </div>
        </div>
      )}
      {text && (
        <div className={`${baseClasses} w-fit`}>
          <p className="text-gray-800">{text}</p>
        </div>
      )}
    </div>
  );
};

export default function ProjectPage() {
  const params = useParams();
  const [schema, setSchema] = useState<Schema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [isEditing, setIsEditing] = useState(false);
  // const [editedSchema, setEditedSchema] = useState<any>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const schemaResponse = await fetch(`/api/schema/${params.id}`);
        if (!schemaResponse.ok) {
          throw new Error("Failed to fetch schema");
        }
        const schemaData = await schemaResponse.json();

        // Create a properly typed schema object
        const typedSchema: Schema = {
          _id: schemaData._id,
          schema: schemaData.schema,
          messages: (schemaData.messages || []).map(
            (msg: any): Message => ({
              role: msg.role as "user" | "assistant",
              content: String(msg.content),
              type:
                msg.type === "response" || msg.type === "question"
                  ? msg.type
                  : undefined,
            })
          ),
          createdAt: schemaData.createdAt,
          updatedAt: schemaData.updatedAt,
        };

        setSchema(typedSchema);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !schema) return;

    const userMessage: Message = { role: "user", content: input };
    const updatedMessages: Message[] = [...schema.messages, userMessage];

    // Update schema state immediately with user message
    setSchema((prev) => (prev ? { ...prev, messages: updatedMessages } : null));
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/schema/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages,
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.content,
        type: data.schema ? "response" : "question",
      };

      // Update schema with the new message immediately
      const updatedSchema: Schema = {
        ...schema,
        messages: [...updatedMessages, assistantMessage],
      };
      setSchema(updatedSchema);

      // Update the project in the database
      const projectResponse = await fetch(`/api/schema/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schema: data.schema || schema.schema,
          messages: updatedSchema.messages,
        }),
      });

      if (!projectResponse.ok) {
        throw new Error("Failed to update project");
      }

      // No need to update schema again with projectData since we already updated it
    } catch (error) {
      console.error("Error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to send message"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // const handleSave = async () => {
  //   try {
  //     const response = await fetch(`/api/schema/${params.id}`, {
  //       method: "PUT",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({ schema: editedSchema }),
  //     });

  //     if (!response.ok) throw new Error("Failed to update schema");

  //     const updatedData = await response.json();
  //     setSchema(updatedData);
  //     setIsEditing(false);
  //   } catch (err) {
  //     setError(err instanceof Error ? err.message : "Failed to update schema");
  //   }
  // };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <p className="text-red-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!schema) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <p className="text-gray-500">Schema not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Database Schema
              </h2>
              {/* <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditedSchema(schema.schema);
                      }}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Edit Schema
                  </button>
                )}
              </div> */}
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Conversation History
              </h3>
              <div className="space-y-4">
                {schema?.messages?.map((message, index) =>
                  renderMessage(message, index)
                ) || []}
                {isLoading && (
                  <div className="bg-white border border-gray-200 mr-4 sm:mr-12 p-2 sm:p-4 rounded-lg animate-chat-bubble">
                    <p className="text-gray-800 text-sm sm:text-base">
                      Got it! Let me work on that...
                    </p>
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything..."
                  className="flex-1 text-base sm:text-lg py-6"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={isLoading}
                  size="lg"
                  className="px-6 py-6"
                >
                  <Send className="w-5 h-5 sm:w-6 sm:h-6" />
                </Button>
              </div>
            </form>
            {/* <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Schema Definition
              </h3>
              {isEditing ? (
                <textarea
                  value={JSON.stringify(editedSchema, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setEditedSchema(parsed);
                    } catch (err) {
                      // Invalid JSON, don't update
                    }
                  }}
                  className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                />
              ) : (
                <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                  <code className="text-sm text-gray-800">
                    {JSON.stringify(schema.schema, null, 2)}
                  </code>
                </pre>
              )}
            </div> */}

            <div className="mt-6 text-sm text-gray-500">
              <p>
                Created:{" "}
                {schema?.createdAt
                  ? new Date(schema.createdAt).toLocaleString()
                  : "N/A"}
              </p>
              <p>
                Last updated:{" "}
                {schema?.updatedAt
                  ? new Date(schema.updatedAt).toLocaleString()
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
