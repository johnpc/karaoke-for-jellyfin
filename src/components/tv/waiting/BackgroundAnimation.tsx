"use client";

export function BackgroundAnimation() {
  return (
    <>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 opacity-20" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500 rounded-full opacity-5 animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-500 rounded-full opacity-5 animate-pulse"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-1/2 right-1/3 w-32 h-32 bg-pink-500 rounded-full opacity-5 animate-pulse"
          style={{ animationDelay: "4s" }}
        />
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-20 left-20 text-4xl text-purple-300 opacity-20 animate-bounce"
          style={{ animationDelay: "0s", animationDuration: "3s" }}
        >
          &#9834;
        </div>
        <div
          className="absolute top-40 right-32 text-3xl text-blue-300 opacity-20 animate-bounce"
          style={{ animationDelay: "1s", animationDuration: "4s" }}
        >
          &#9835;
        </div>
        <div
          className="absolute bottom-32 left-40 text-5xl text-pink-300 opacity-20 animate-bounce"
          style={{ animationDelay: "2s", animationDuration: "5s" }}
        >
          &#9834;
        </div>
        <div
          className="absolute bottom-20 right-20 text-3xl text-indigo-300 opacity-20 animate-bounce"
          style={{ animationDelay: "3s", animationDuration: "3.5s" }}
        >
          &#9835;
        </div>
      </div>
    </>
  );
}
