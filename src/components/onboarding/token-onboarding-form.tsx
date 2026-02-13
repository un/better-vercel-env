"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ApiErrorPayload {
  error?: {
    message?: string;
  };
}

export function TokenOnboardingForm() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const response = await fetch("/api/session/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;
      setErrorMessage(payload?.error?.message ?? "Unable to verify token. Please try again.");
      setIsSubmitting(false);
      return;
    }

    setSuccessMessage("Token validated. Loading your projects...");
    setIsSubmitting(false);
    router.push("/projects");
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="vercel-token-input">
          Vercel personal token
        </label>
        <Input
          id="vercel-token-input"
          name="token"
          type="password"
          autoComplete="off"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="Paste your token"
          required
          minLength={20}
        />
      </div>
      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
      {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}
      <Button type="submit" disabled={isSubmitting || token.trim().length < 20}>
        {isSubmitting ? "Validating..." : "Continue"}
      </Button>
    </form>
  );
}
