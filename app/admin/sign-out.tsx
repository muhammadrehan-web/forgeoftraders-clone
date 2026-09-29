"use client";

export function SignOutButton() {
  return (
    <button
      className="ghost"
      type="button"
      onClick={() => {
        fetch("/api/auth/logout", { method: "POST" }).finally(() => {
          window.location.href = "/sign-in";
        });
      }}
    >
      Sign out
    </button>
  );
}
