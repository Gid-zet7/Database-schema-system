import { Users, init } from "@kinde/management-api-js";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

init();

export const GET = async () => {
  try {
    const session = await getKindeServerSession().getUser();
    if (!session) {
      console.error("No session found");
      return new Response(JSON.stringify({ error: "session expired" }), {
        status: 401,
      });
    }

    const userData = await Users.getUserData({ id: session.id });
    return new Response(JSON.stringify(userData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch {
    // console.error("Error fetching user session:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
