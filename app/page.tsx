"use client";

import { useState, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  type?: "response" | "question";
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

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

      console.log(data);

      const assistantMessage: Message = {
        role: "assistant",
        content: data.content,
        type: data.schema ? "response" : "question",
      };

      // Update messages state with the assistant's response
      setMessages((prev) => [...prev, assistantMessage]);

      // }
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
    }
  };
  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="w-full flex justify-center items-center px-2 sm:px-0"
      >
        <div className="flex w-full sm:w-2/3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            className="flex-1 rounded-l-2xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-black bg-white px-2 py-3 sm:py-5 text-sm sm:text-base"
          />
          <button
            type="submit"
            className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent text-sm font-medium rounded-r-2xl shadow-sm text-white bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 cursor-pointer"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
