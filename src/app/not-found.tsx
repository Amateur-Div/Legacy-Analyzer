"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <h1 className="text-6xl font-bold text-blue-600">404</h1>
      <p className="text-xl mt-4 text-gray-700">Page not found</p>
      <p className="text-sm text-gray-500 mb-6">
        !Sorry, the page you are looking for does not exist.
      </p>
      <Link href={"/dashboard"} className="text-blue-500 underline">
        Go back to dashboard.
      </Link>
    </div>
  );
}
