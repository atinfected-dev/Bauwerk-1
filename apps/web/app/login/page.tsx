"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/providers/auth-provider";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading } = useAuth();

const [email, setEmail] = useState("admin@ertz-demo.de");
const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(searchParams.get("next") ?? "/dashboard");
    }
  }, [isAuthenticated, isLoading, router, searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login({ email, password });
      router.replace(searchParams.get("next") ?? "/dashboard");
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Anmeldung fehlgeschlagen.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="text-2xl font-bold tracking-tight">
          Bau<span className="text-blue-400">Werk</span>
        </div>

        <div className="max-w-xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-400">
            Handwerk digital organisiert
          </p>
          <h1 className="mt-5 text-5xl font-semibold leading-tight">
            Baustellen, Kunden und Projekte an einem Ort.
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            Die zentrale Arbeitsplattform für moderne Handwerksbetriebe.
          </p>
        </div>

        <p className="text-sm text-slate-500">
          BauWerk – entwickelt für den Arbeitsalltag im Handwerk
        </p>
      </section>

      <section className="flex items-center justify-center bg-slate-100 p-6">
        <Card className="w-full max-w-md p-8 shadow-sm">
          <div className="mb-8">
            <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-blue-600 text-white">
              <LockKeyhole className="size-6" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">Anmelden</h2>
            <p className="mt-2 text-sm text-slate-500">
              Melde dich mit deinem BauWerk-Konto an.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail-Adresse</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
              />
            </div>

            {error ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoaderCircle className="mr-2 size-4 animate-spin" />
                  Anmeldung läuft …
                </>
              ) : (
                "Anmelden"
              )}
            </Button>
          </form>
        </Card>
      </section>
    </main>
  );
}
