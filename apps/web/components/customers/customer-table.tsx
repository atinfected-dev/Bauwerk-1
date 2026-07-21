"use client";

import { Mail, MoreHorizontal, Pencil, Phone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Customer } from "@/types/customer";

interface CustomerTableProps {
  customers: Customer[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

export function CustomerTable({
  customers,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: CustomerTableProps) {
  if (customers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-white p-12 text-center">
        <h2 className="font-semibold">Keine Kunden gefunden</h2>
        <p className="mt-1 text-sm text-slate-500">
          Lege einen neuen Kunden an oder ändere den Suchbegriff.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-left">
          <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Kundennummer</th>
              <th className="px-5 py-3">Kunde</th>
              <th className="px-5 py-3">Ansprechpartner</th>
              <th className="px-5 py-3">Kontakt</th>
              <th className="px-5 py-3">Adresse</th>
              <th className="w-24 px-5 py-3 text-right">Aktionen</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-slate-50/70">
                <td className="px-5 py-4 text-sm font-medium text-blue-700">
                  {customer.customerNumber}
                </td>
                <td className="px-5 py-4">
                  <p className="font-medium text-slate-950">{customer.name}</p>
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">
                  {customer.contactName || "–"}
                </td>
                <td className="px-5 py-4">
                  <div className="space-y-1 text-sm text-slate-600">
                    {customer.email ? (
                      <div className="flex items-center gap-2">
                        <Mail className="size-4" />
                        {customer.email}
                      </div>
                    ) : null}
                    {customer.phone ? (
                      <div className="flex items-center gap-2">
                        <Phone className="size-4" />
                        {customer.phone}
                      </div>
                    ) : null}
                    {!customer.email && !customer.phone ? "–" : null}
                  </div>
                </td>
                <td className="max-w-xs px-5 py-4 text-sm text-slate-600">
                  {customer.billingAddress || "–"}
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-1">
                    {canEdit ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(customer)}
                        aria-label={`${customer.name} bearbeiten`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    ) : null}

                    {canDelete ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => onDelete(customer)}
                        aria-label={`${customer.name} löschen`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    ) : null}

                    {!canEdit && !canDelete ? (
                      <MoreHorizontal className="size-5 text-slate-400" />
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
