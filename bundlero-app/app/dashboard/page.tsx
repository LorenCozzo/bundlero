"use client";
import { useState, useEffect, useCallback } from "react";
import BundleList from "@/components/BundleList";
import BundleEditor from "@/components/BundleEditor";
import { Bundle } from "@/types";

export default function DashboardPage() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [editing, setEditing] = useState<Bundle | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const shop = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("shop") || ""
    : "";

  const fetchBundles = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/bundles?shop=${shop}`);
    const data = await res.json();
    setBundles(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [shop]);

  useEffect(() => { fetchBundles(); }, [fetchBundles]);

  const handleSave = async (bundle: Partial<Bundle>) => {
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/bundles/${editing.id}` : "/api/bundles";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", "x-shop": shop },
      body: JSON.stringify(bundle),
    });
    setEditing(null);
    setCreating(false);
    fetchBundles();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/bundles/${id}`, { method: "DELETE" });
    fetchBundles();
  };

  const handleToggle = async (bundle: Bundle) => {
    await fetch(`/api/bundles/${bundle.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-shop": shop },
      body: JSON.stringify({ isActive: !bundle.isActive }),
    });
    fetchBundles();
  };

  if (creating || editing) {
    return (
      <BundleEditor
        bundle={editing}
        onSave={handleSave}
        onCancel={() => { setCreating(false); setEditing(null); }}
      />
    );
  }

  return (
    <BundleList
      bundles={bundles}
      loading={loading}
      onCreate={() => setCreating(true)}
      onEdit={setEditing}
      onDelete={handleDelete}
      onToggle={handleToggle}
    />
  );
}
