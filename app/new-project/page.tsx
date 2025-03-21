"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getUsersession } from "@/lib/actions";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  role: "user" | "assistant";
  content: string;
  type?: "response" | "question";
}

export default function NewProject() {
  const [session, setSession] = useState();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("id");

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const userSession = await getUsersession();
        setSession(userSession);
      } catch (error) {
        console.error("Error fetching session:", error);
      }
    };

    fetchSession();
  }, []);

  useEffect(() => {
    const fetchProject = async () => {
      if (projectId) {
        try {
          const response = await fetch(`/api/schema/${projectId}`);
          if (response.ok) {
            const data = await response.json();
            // setProject(data);
            setMessages(data.messages || []);
          }
        } catch (error) {
          console.error("Error fetching project:", error);
        }
      }
    };

    fetchProject();
  }, [projectId]);

  function splitSqlAndText(content: string) {
    const sqlRegex = /```(?:sql)?\s*([\s\S]*?)\s*```/;

    const sqlMatch = content.match(sqlRegex);

    if (sqlMatch) {
      const sqlPart = sqlMatch[1];
      const textPart = content.split(sqlMatch[0])[1]?.trim() || "";
      return {
        json: null,
        sql: sqlPart,
        text: textPart,
      };
    }

    return { sql: null, text: content };
  }

  function SQLTable({ sql }: { sql: string }) {
    // console.log(sql);
    // Split multiple CREATE TABLE statements
    const createTableStatements = sql.split(";").filter((stmt) => stmt.trim());
    // console.log(createTableStatements);

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
              className="overflow-x-auto bg-white rounded-lg shadow"
            >
              <div className="px-4 py-3 border-b border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700">
                  Table: {tableName}
                </h4>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Column Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Constraints
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
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
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {column.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {cleanType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {constraints.join(", ")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/schema/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.content,
        type: data.schema ? "response" : "question",
      };

      // Update messages state with the assistant's response
      setMessages((prev) => [...prev, assistantMessage]);

      if (data) {
        // Save or update the project with the complete schema
        const projectResponse = await fetch(
          projectId ? `/api/schema/${projectId}` : "/api/schema/save",
          {
            method: projectId ? "PUT" : "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              schema: data.schema,
              messages: [...messages, userMessage, assistantMessage],
              name: `Project ${new Date().toLocaleDateString()}`, // Add a default name
            }),
          }
        );

        if (!projectResponse.ok) {
          throw new Error("Failed to save project");
        }

        const projectData = await projectResponse.json();

        // Use _id instead of id for navigation
        router.push(`/project/${projectData._id}`);
      }
    } catch (error) {
      console.error("Error:", error);
      // Add error message to the UI
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, there was an error saving your project. Please try again.",
          type: "response",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex flex-col space-y-8">
          {/* Welcome Section */}
          <div
            className={`text-center ${
              messages.length > 0 ? "hidden" : "block"
            } animate-fade-in`}
          >
            <h2
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 animate-slide-up"
              style={{ animationDelay: "200ms" }}
            >
              Welcome,{" "}
              <span className="text-gray-700">
                <em>{session?.first_name || "User"}</em>
              </span>
            </h2>
            <p
              className="text-lg sm:text-xl md:text-2xl text-gray-600 animate-slide-up"
              style={{ animationDelay: "400ms" }}
            >
              What are we building today?
            </p>
          </div>

          {/* Messages Section */}
          <div
            className={`space-y-4 sm:space-y-6 ${
              messages.length > 0 ? "block" : "hidden"
            }`}
          >
            {messages.slice(-2).map((message, index) => {
              const { sql, text } = splitSqlAndText(message.content);
              return (
                <div key={index} className="space-y-4">
                  {message.role === "assistant" ? (
                    <>
                      {sql && (
                        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 animate-chat-bubble">
                          <SQLTable sql={sql} />
                        </div>
                      )}
                      {text && (
                        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 animate-chat-bubble max-w-3xl">
                          <p className="text-gray-800 text-sm sm:text-base">
                            {text}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-gray-50 rounded-lg shadow-sm p-4 sm:p-6 animate-chat-bubble max-w-3xl ml-auto">
                      <p className="text-gray-800 text-sm sm:text-base">
                        {message.content}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
            {isLoading && (
              <div className="bg-white rounded-lg shadow-sm border-gray-200 p-4 sm:p-6 animate-chat-bubble max-w-3xl">
                <p className="text-gray-800 text-sm sm:text-base">
                  Got it! Let me work on that...
                </p>
              </div>
            )}
          </div>

          {/* Input Form */}
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
        </div>
      </div>
    </div>
  );
}
