"use client";

import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import { LoaderCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Customer, CustomerPayload } from "@/types/customer";

interface CustomerFormProps {
  customer?: Customer | null;
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (payload: CustomerPayload) => Promise<void>;
}

const emptyForm: CustomerPayload = {
  customerNumber: "",
  name: "",
  contactName: "",
  email: "",
  phone: "",
  billingAddress: "",
};

function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    return data?.error ?? "Kunde konnte nicht gespeichert werden.";
  }

  return error instanceof Error
    ? error.message
    : "Kunde konnte nicht gespeichert werden.";
}

export function CustomerForm({
  customer,
  isSaving,
  onCancel,
  onSubmit,
}: CustomerFormProps) {
  const [form, setForm] = useState<CustomerPayload>(emptyForm);
  const [error, setError] = useState("");

  useEffect(() => {
    if (customer) {
      setForm({
        customerNumber: customer.customerNumber,
        name: customer.name,
        contactName: customer.contactName ?? "",
        email: customer.email ?? "",
        phone: customer.phone ?? "",
        billingAddress: customer.billingAddress ?? "",
      });
      return;
    }

    setForm(emptyForm);
  }, [customer]);

  function change(field: keyof CustomerPayload, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.customerNumber.trim() || !form.name.trim()) {
      setError("Kundennummer und Firmenname sind Pflichtfelder.");
      return;
    }

    try {
      await onSubmit({
        customerNumber: form.customerNumber.trim(),
        name: form.name.trim(),
        contactName: form.contactName?.trim(),
        email: form.email?.trim(),
        phone: form.phone?.trim(),
        billingAddress: form.billingAddress?.trim(),
      });
    } catch (submitError) {
      setError(errorMessage(submitError));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl border bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">
              {customer ? "Kunde bearbeiten" : "Kunde anlegen"}
            </h2>
            <p className="text-sm text-slate-500">
              Stammdaten des Kunden erfassen.
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onCancel}
            aria-label="Formular schließen"
          >
            <X className="size-5" />
          </Button>
        </div>

        <form className="grid gap-5 p-6 sm:grid-cols-2" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="customerNumber">Kundennummer *</Label>
            <Input
              id="customerNumber"
              value={form.customerNumber}
              onChange={(event) =>
                change("customerNumber", event.target.value)
              }
              placeholder="K-1002"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Firmenname / Name *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(event) => change("name", event.target.value)}
              placeholder="Muster Elektro GmbH"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactName">Ansprechpartner</Label>
            <Input
              id="contactName"
              value={form.contactName ?? ""}
              onChange={(event) => change("contactName", event.target.value)}
              placeholder="Max Mustermann"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-Mail</Label>
            <Input
              id="email"
              type="email"
              value={form.email ?? ""}
              onChange={(event) => change("email", event.target.value)}
              placeholder="info@kunde.de"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefon</Label>
            <Input
              id="phone"
              value={form.phone ?? ""}
              onChange={(event) => change("phone", event.target.value)}
              placeholder="+49 6841 123456"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="billingAddress">Rechnungsadresse</Label>
            <Input
              id="billingAddress"
              value={form.billingAddress ?? ""}
              onChange={(event) =>
                change("billingAddress", event.target.value)
              }
              placeholder="Musterstraße 1, 66424 Homburg"
            />
          </div>

          {error ? (
            <p className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-3 border-t pt-5 sm:col-span-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <LoaderCircle className="mr-2 size-4 animate-spin" />
                  Speichern …
                </>
              ) : (
                "Speichern"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
