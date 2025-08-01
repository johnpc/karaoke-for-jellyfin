"use client";

import { useState } from "react";
import { UserIcon } from "@heroicons/react/24/outline";

interface UserSetupProps {
  onSetup: (name: string) => void;
  title?: string;
  subtitle?: string;
}

export function UserSetup({
  onSetup,
  title = "Welcome to Karaoke!",
  subtitle = "Enter your name to join the karaoke session",
}: UserSetupProps) {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      onSetup(name.trim());
    } catch (error) {
      console.error("Setup error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
      <div
        data-testid="user-setup"
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8"
      >
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <UserIcon className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-600">{subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Your Name
            </label>
            <input
              type="text"
              id="name"
              data-testid="username-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg text-gray-900 placeholder-gray-500"
              maxLength={50}
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            data-testid="join-session-button"
            disabled={!name.trim() || isLoading}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold text-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Joining...
              </div>
            ) : (
              "Join Karaoke Session"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Your name will be visible to other participants
          </p>
        </div>
      </div>
    </div>
  );
}
