"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Schema {
  _id: string;
  schema: any;
  messages: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function Home() {
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchemas = async () => {
      try {
        const response = await fetch("/api/schema");
        if (!response.ok) {
          throw new Error("Failed to fetch schemas");
        }
        const data = await response.json();
        setSchemas(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchSchemas();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            AI Database Schema Designer
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Design your database schema through an interactive AI-powered
            experience
          </p>
        </div>

        <div className="mt-10 flex justify-center">
          <Link href="/new-project">
            <Button
              size="lg"
              className="bg-black hover:bg-slate-900 cursor-pointer text-white"
            >
              Create New Project
            </Button>
          </Link>
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Recent Projects
          </h2>
          {loading ? (
            <div className="text-center">
              <p className="text-gray-500">Loading projects...</p>
            </div>
          ) : error ? (
            <div className="text-center">
              <p className="text-red-500">{error}</p>
            </div>
          ) : schemas.length === 0 ? (
            <div className="text-center">
              <p className="text-gray-500">
                No projects yet. Start by creating your first project!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {schemas.map((schema) => (
                <Link
                  key={schema._id}
                  href={`/project/${schema._id}`}
                  className="block"
                >
                  <Card className="h-full hover:shadow-lg transition-shadow duration-200">
                    <CardHeader>
                      <CardTitle className="truncate">
                        {schema.schema?.name || "Untitled Schema"}
                      </CardTitle>
                      <CardDescription>
                        Created:{" "}
                        {new Date(schema.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500">
                        Last updated:{" "}
                        {new Date(schema.updatedAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                    <CardFooter>
                      <p className="text-sm text-gray-500">
                        Messages: {schema.messages.length}
                      </p>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
