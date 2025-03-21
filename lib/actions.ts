const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL;

export const getUsersession = async () => {
  const endpoint = `${SERVER_URL}/api/session`;
  const result = await fetch(endpoint, { method: "GET" });
  if (!result.ok) {
    const errorMessage = `Failed to fetch user. Status: ${result.status}, ${result.statusText}`;
    throw new Error(errorMessage);
  }
  const res = await result.json();
  return res;
};
