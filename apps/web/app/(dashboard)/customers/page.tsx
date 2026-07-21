"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, Plus, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomerForm } from "@/components/customers/customer-form";
import { CustomerTable } from "@/components/customers/customer-table";
import { useAuth } from "@/providers/auth-provider";
import {
  createCustomer,
  deleteCustomer,
  getCustomers,
  updateCustomer,
} from "@/services/customers";
import type { Customer, CustomerPayload } from "@/types/customer";

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);

  const customersQuery = useQuery({
    queryKey: ["customers"],
    queryFn: () => getCustomers(),
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: CustomerPayload) => {
      if (selectedCustomer) {
        return updateCustomer(selectedCustomer.id, payload);
      }

      return createCustomer(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      closeForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const filteredCustomers = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return customersQuery.data ?? [];
    }

    return (customersQuery.data ?? []).filter((customer) =>
      [
        customer.customerNumber,
        customer.name,
        customer.contactName,
        customer.email,
        customer.phone,
        customer.billingAddress,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(value)),
    );
  }, [customersQuery.data, search]);

  const canWrite =
    user?.role === "ADMIN" ||
    user?.role === "OFFICE" ||
    user?.role === "PROJECT_MANAGER";

  const canDelete = user?.role === "ADMIN";

  function openCreateForm() {
    setSelectedCustomer(null);
    setIsFormOpen(true);
  }

  function openEditForm(customer: Customer) {
    setSelectedCustomer(customer);
    setIsFormOpen(true);
  }

  function closeForm() {
    setSelectedCustomer(null);
    setIsFormOpen(false);
  }

  async function handleSave(payload: CustomerPayload) {
    await saveMutation.mutateAsync(payload);
  }

  async function handleDelete(customer: Customer) {
    const confirmed = window.confirm(
      `Soll der Kunde "${customer.name}" wirklich gelöscht werden?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(customer.id);
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Kunde konnte nicht gelöscht werden.",
      );
    }
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">Stammdaten</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Kunden</h1>
          <p className="mt-2 text-sm text-slate-500">
            Auftraggeber und Ansprechpartner zentral verwalten.
          </p>
        </div>

        {canWrite ? (
          <Button onClick={openCreateForm}>
            <Plus className="mr-2 size-4" />
            Kunde anlegen
          </Button>
        ) : null}
      </div>

      <div className="mb-5 flex max-w-lg items-center rounded-xl border bg-white px-3 shadow-sm">
        <Search className="size-5 text-slate-400" />
        <Input
          className="border-0 bg-transparent shadow-none focus-visible:ring-0"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Kunden suchen …"
        />
      </div>

      {customersQuery.isLoading ? (
        <div className="flex items-center gap-3 rounded-xl border bg-white p-6 text-sm text-slate-600">
          <LoaderCircle className="size-5 animate-spin" />
          Kunden werden geladen …
        </div>
      ) : customersQuery.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">
          Kunden konnten nicht geladen werden.
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
            <Users className="size-4" />
            {filteredCustomers.length} Kunden
          </div>

          <CustomerTable
            customers={filteredCustomers}
            canEdit={Boolean(canWrite)}
            canDelete={Boolean(canDelete)}
            onEdit={openEditForm}
            onDelete={handleDelete}
          />
        </>
      )}

      {isFormOpen ? (
        <CustomerForm
          customer={selectedCustomer}
          isSaving={saveMutation.isPending}
          onCancel={closeForm}
          onSubmit={handleSave}
        />
      ) : null}
    </div>
  );
}
