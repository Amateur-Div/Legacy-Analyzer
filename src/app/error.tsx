"use client";

import { Link } from "lucide-react";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error : ", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <h1 className="text-6xl font-bold text-red-600">500</h1>
      <p className="text-xl mt-4 text-gray-700">Something went wrong.</p>
      <p className="text-sm text-gray-500 mb-6">{error.message}</p>
      <div className="flex gap-4">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          onClick={() => reset()}
        >
          Try again
        </button>
        <Link href={"/dashboard"} className="text-blue-500 underline">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
