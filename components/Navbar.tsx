"use client";

import { useEffect, useState } from "react";
import { getUsersession } from "@/lib/actions";
import Link from "next/link";
import { LogoutLink, LoginLink } from "@kinde-oss/kinde-auth-nextjs/components";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Project {
  _id: string;
  name: string;
  updatedAt: string;
}

interface Session {
  first_name?: string;
  last_name?: string;
  email?: string;
  picture?: string;
  preferred_email?: string;
}

export default function Navbar() {
  const [session, setSession] = useState<Session | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

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
    const fetchProjects = async () => {
      if (session) {
        try {
          const response = await fetch("/api/schema");
          if (response.ok) {
            const data = await response.json();
            setProjects(data);
          }
        } catch (error) {
          console.error("Failed to fetch projects:", error);
        }
      }
    };

    fetchProjects();
  }, [session]);

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center text-xl font-bold">
              KeyMap
            </Link>
          </div>

          <div className="flex items-center">
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={`${session?.picture}`} alt="profile" />
                    <AvatarFallback>
                      {session?.first_name?.[0] || ""}{" "}
                      {session?.last_name?.[0] || ""}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                      Signed in as {session?.preferred_email}
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem>
                    {" "}
                    <Link
                      href="/new-project"
                      className={`block px-4 py-2 text-sm text-gray-700 `}
                    >
                      New Project
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <LogoutLink>Log out</LogoutLink>
                    <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="text-gray-700 hover:text-indigo-600">
                <LoginLink>Sign in</LoginLink>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
