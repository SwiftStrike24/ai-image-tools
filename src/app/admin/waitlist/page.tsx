import { kv } from "@vercel/kv";

export const revalidate = 0; // Disable caching for this page

export default async function WaitlistPage() {
  const waitlistKey = "waitlist";
  const emails = await kv.smembers(waitlistKey);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Waitlist Emails</h1>
      <ul className="list-disc pl-5">
        {emails.map((email, index) => (
          <li key={index} className="mb-2">{email}</li>
        ))}
      </ul>
    </div>
  );
}