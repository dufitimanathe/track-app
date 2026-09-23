"use client";

import { Button } from "@/components/ui/button";
import { Card, MetricCard } from "@/components/ui/card";
import { Field, Input, SearchInput } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState, PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal, FloatingMenu } from "@/components/ui/overlay";
import {
  createRider,
  deactivateRider,
  deleteRider,
  fetchRiders,
  markRiderUnavailable,
  updateRider,
  updateRiderAvailability,
  type RiderDto,
} from "@/lib/api/resources";
import { isValidRwandaPhone, normalizeRwandaPhone } from "@/lib/validation/rwanda";
import { useAppSelector } from "@/store";
import { Bike, MoreHorizontal, Phone, Plus, Smartphone, Users } from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

type ConfirmAction = "deactivate" | "delete" | "unavailable";

interface ConfirmState {
  action: ConfirmAction;
  rider: RiderDto;
}

const CONFIRM_COPY: Record<
  ConfirmAction,
  { title: string; description: (name: string) => string; confirmLabel: string }
> = {
  deactivate: {
    title: "Deactivate rider?",
    description: (name) =>
      `${name} will be suspended and removed from assignment. They can be reactivated later.`,
    confirmLabel: "Deactivate",
  },
  delete: {
    title: "Delete rider?",
    description: (name) =>
      `${name} will be removed from this company. Trip history is kept, but they will no longer appear in the riders list.`,
    confirmLabel: "Delete",
  },
  unavailable: {
    title: "Mark unavailable?",
    description: (name) =>
      `${name} will be marked offline and will not receive new trip assignments until they go available again.`,
    confirmLabel: "Mark unavailable",
  },
};

function riderDisplayName(r: RiderDto) {
  return r.firstName || r.lastName
    ? `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim()
    : r.phone;
}

export default function RidersPage() {
  const companyId = useAppSelector((s) => s.auth.companyId);
  const hydrated = useAppSelector((s) => s.auth.hydrated);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<RiderDto[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [busy, setBusy] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editRider, setEditRider] = useState<RiderDto | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [inviteSentTo, setInviteSentTo] = useState<string | null>(null);
  const [activationToken, setActivationToken] = useState<string | null>(null);
  const menuAnchorRef = useRef<HTMLButtonElement | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    licenseNumber: "",
  });

  const load = useCallback(async () => {
    if (!hydrated || !companyId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchRiders(companyId, {
        page,
        limit: 20,
        search: search || undefined,
        sort: "createdAt:DESC",
      });
      setItems(result.items);
      setTotal(result.meta.total);
      setTotalPages(result.meta.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load riders");
    } finally {
      setLoading(false);
    }
  }, [companyId, hydrated, page, search]);

  useEffect(() => {
    void load();
  }, [load]);

  function openAdd() {
    setForm({
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      licenseNumber: "",
    });
    setTempPassword(null);
    setInviteSentTo(null);
    setActivationToken(null);
    setAddOpen(true);
  }

  function openEdit(rider: RiderDto) {
    setEditRider(rider);
    setForm({
      firstName: rider.firstName ?? "",
      lastName: rider.lastName ?? "",
      phone: rider.phone,
      email: "",
      licenseNumber: rider.licenseNumber ?? "",
    });
    setMenuOpenId(null);
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!companyId) return;
    if (!isValidRwandaPhone(form.phone)) {
      setError("Phone must be a valid Rwanda mobile (e.g. 0788123456 or +250788123456).");
      return;
    }
    const phone = normalizeRwandaPhone(form.phone);
    if (!phone) {
      setError("Phone must be a valid Rwanda mobile number.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (!form.email.trim()) {
        setError("Email is required so the rider can activate the FleetOps mobile app.");
        setBusy(false);
        return;
      }
      const created = await createRider(companyId, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone,
        email: form.email.trim(),
        licenseNumber: form.licenseNumber.trim() || undefined,
      });
      if (created.inviteSent) {
        setInviteSentTo(form.email.trim());
        setActivationToken(created.activationToken ?? null);
        setTempPassword(null);
      } else if (created.temporaryPassword) {
        setTempPassword(created.temporaryPassword);
        setInviteSentTo(null);
        setActivationToken(null);
      } else {
        setAddOpen(false);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add rider");
    } finally {
      setBusy(false);
    }
  }

  async function onUpdate(e: FormEvent) {
    e.preventDefault();
    if (!companyId || !editRider) return;
    if (!isValidRwandaPhone(form.phone)) {
      setError("Phone must be a valid Rwanda mobile (e.g. 0788123456 or +250788123456).");
      return;
    }
    const phone = normalizeRwandaPhone(form.phone);
    if (!phone) {
      setError("Phone must be a valid Rwanda mobile number.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await updateRider(companyId, editRider.id, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone,
        licenseNumber: form.licenseNumber.trim() || null,
      });
      setEditRider(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update rider");
    } finally {
      setBusy(false);
    }
  }

  async function runConfirm() {
    if (!companyId || !confirm) return;
    setBusy(true);
    setError(null);
    try {
      const { action, rider } = confirm;
      if (action === "deactivate") await deactivateRider(companyId, rider.id);
      if (action === "delete") await deleteRider(companyId, rider.id);
      if (action === "unavailable") await markRiderUnavailable(companyId, rider.id);
      setConfirm(null);
      setMenuOpenId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  const availableCount = items.filter((r) => r.availabilityStatus === "AVAILABLE").length;

  return (
    <div className="space-y-4 sm:space-y-5 max-w-[1400px] mx-auto">
      <PageHeader
        title="Riders"
        description="Manage rider profiles. Location is tracked from each rider’s phone — hardware GPS is not required."
        actions={
          <Button size="sm" leftIcon={<Plus className="size-3.5" />} onClick={openAdd}>
            Add rider
          </Button>
        }
      />

      <div className="flex items-start gap-2 rounded-[10px] border border-border bg-primary-soft/40 px-3 py-2.5 text-sm text-text-secondary">
        <Smartphone className="size-4 mt-0.5 shrink-0 text-primary" />
        <p>
          Phone tracking is active for this company. Riders share location from the mobile app
          after they are assigned a motorcycle unit.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-md">
        <MetricCard label="Total" value={total} icon={<Users className="size-4" />} />
        <MetricCard
          label="Available (page)"
          value={availableCount}
          accent="success"
          icon={<Bike className="size-4" />}
        />
      </div>

      <SearchInput
        placeholder="Search riders…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        className="max-w-md"
      />

      {error ? (
        <p className="text-sm text-danger bg-danger-soft rounded-[8px] px-3 py-2">{error}</p>
      ) : null}

      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <EmptyState title="Loading riders…" />
        ) : items.length === 0 ? (
          <EmptyState
            title="No riders"
            description="Add your first rider to start phone-based tracking and assignments."
            action={
              <Button size="sm" leftIcon={<Plus className="size-3.5" />} onClick={openAdd}>
                Add rider
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((r) => {
              const name = riderDisplayName(r);
              return (
                <li key={r.id} className="relative flex items-center gap-2 px-4 py-3">
                  <Link
                    href={`/admin/riders/${r.id}`}
                    className="min-w-0 flex-1 hover:opacity-90"
                  >
                    <p className="text-sm font-semibold text-text">{name}</p>
                    <p className="text-xs text-text-secondary inline-flex items-center gap-1.5">
                      <Phone className="size-3" />
                      {r.phone}
                      <span>·</span>
                      {r.licenseNumber ?? "No license on file"}
                    </p>
                  </Link>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge
                      status={
                        r.availabilityStatus === "AVAILABLE"
                          ? "available"
                          : r.availabilityStatus === "OFFLINE"
                            ? "offline"
                            : "on_trip"
                      }
                      label={r.availabilityStatus.toLowerCase()}
                    />
                    <StatusBadge
                      status={r.status === "ACTIVE" ? "online" : "offline"}
                      label={r.status.toLowerCase()}
                    />
                    <div className="relative">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={`Manage ${name}`}
                        aria-expanded={menuOpenId === r.id}
                        onClick={(e) => {
                          menuAnchorRef.current = e.currentTarget;
                          setMenuOpenId((id) => (id === r.id ? null : r.id));
                        }}
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                      <FloatingMenu
                        open={menuOpenId === r.id}
                        onClose={() => setMenuOpenId(null)}
                        anchorRef={menuAnchorRef}
                      >
                          <button
                            type="button"
                            role="menuitem"
                            className="w-full px-3 py-2 text-left text-sm text-text hover:bg-surface-muted"
                            onClick={() => openEdit(r)}
                          >
                            Edit profile
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            className="w-full px-3 py-2 text-left text-sm text-text hover:bg-surface-muted disabled:opacity-40"
                            disabled={
                              r.availabilityStatus === "AVAILABLE" ||
                              r.status !== "ACTIVE" ||
                              busy
                            }
                            onClick={() => {
                              if (!companyId) return;
                              setBusy(true);
                              setMenuOpenId(null);
                              void updateRiderAvailability(companyId, r.id, "AVAILABLE")
                                .then(() => load())
                                .catch((err) =>
                                  setError(
                                    err instanceof Error
                                      ? err.message
                                      : "Could not set available (assign a motorcycle first)",
                                  ),
                                )
                                .finally(() => setBusy(false));
                            }}
                          >
                            Set available
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            className="w-full px-3 py-2 text-left text-sm text-text hover:bg-surface-muted disabled:opacity-40"
                            disabled={
                              r.availabilityStatus === "OFFLINE" ||
                              r.status !== "ACTIVE"
                            }
                            onClick={() => {
                              setConfirm({ action: "unavailable", rider: r });
                              setMenuOpenId(null);
                            }}
                          >
                            Mark unavailable
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            className="w-full px-3 py-2 text-left text-sm text-text hover:bg-surface-muted disabled:opacity-40"
                            disabled={r.status !== "ACTIVE"}
                            onClick={() => {
                              setConfirm({ action: "deactivate", rider: r });
                              setMenuOpenId(null);
                            }}
                          >
                            Deactivate
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            className="w-full px-3 py-2 text-left text-sm text-danger hover:bg-danger-soft"
                            onClick={() => {
                              setConfirm({ action: "delete", rider: r });
                              setMenuOpenId(null);
                            }}
                          >
                            Delete
                          </button>
                      </FloatingMenu>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div className="border-t border-border px-4 py-3">
          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
        </div>
      </Card>

      <Modal
        open={addOpen}
        onClose={() => {
          if (!busy) {
            setAddOpen(false);
            setTempPassword(null);
            setInviteSentTo(null);
            setActivationToken(null);
          }
        }}
        title="Add rider"
        description="Sends an activation email with a copy-paste token. The rider sets a password in the browser or FleetOps app, then goes Online for GPS."
        footer={
          tempPassword || inviteSentTo ? (
            <Button
              onClick={() => {
                setAddOpen(false);
                setTempPassword(null);
                setInviteSentTo(null);
                setActivationToken(null);
              }}
            >
              Done
            </Button>
          ) : (
            <>
              <Button variant="secondary" disabled={busy} onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button form="add-rider-form" type="submit" disabled={busy}>
                {busy ? "Sending invite…" : "Send invite email"}
              </Button>
            </>
          )
        }
      >
        {inviteSentTo ? (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">
              Activation email sent to <strong>{inviteSentTo}</strong>. They enter the
              6-character code in FleetOps → Activate account (or open the email link).
            </p>
            {activationToken ? (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
                  Activation code
                </p>
                <p className="rounded-[8px] bg-surface-muted px-3 py-3 font-mono text-2xl font-semibold tracking-[0.35em] text-center text-text select-all">
                  {activationToken}
                </p>
              </div>
            ) : null}
          </div>
        ) : tempPassword ? (
          <div className="space-y-2">
            <p className="text-sm text-text-secondary">
              Rider created. Share this temporary password so they can sign in:
            </p>
            <p className="rounded-[8px] bg-surface-muted px-3 py-2 font-mono text-sm text-text break-all">
              {tempPassword}
            </p>
          </div>
        ) : (
          <form id="add-rider-form" className="space-y-3" onSubmit={onCreate}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name">
                <Input
                  required
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                />
              </Field>
              <Field label="Last name">
                <Input
                  required
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                />
              </Field>
            </div>
            <Field label="Phone" hint="Rwanda mobile · 0788… or +250788…">
              <Input
                required
                type="tel"
                placeholder="+250 788 000 000"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </Field>
            <Field
              label="Email"
              hint="Required — activation opens the FleetOps phone app"
            >
              <Input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </Field>
            <Field label="License number" hint="Optional">
              <Input
                value={form.licenseNumber}
                onChange={(e) => setForm((f) => ({ ...f, licenseNumber: e.target.value }))}
              />
            </Field>
          </form>
        )}
      </Modal>

      <Modal
        open={!!editRider}
        onClose={() => {
          if (!busy) setEditRider(null);
        }}
        title="Edit rider"
        description="Update contact details used for phone tracking and assignment."
        footer={
          <>
            <Button variant="secondary" disabled={busy} onClick={() => setEditRider(null)}>
              Cancel
            </Button>
            <Button form="edit-rider-form" type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save changes"}
            </Button>
          </>
        }
      >
        <form id="edit-rider-form" className="space-y-3" onSubmit={onUpdate}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name">
              <Input
                required
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              />
            </Field>
            <Field label="Last name">
              <Input
                required
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              />
            </Field>
          </div>
          <Field label="Phone" hint="Rwanda mobile · 0788… or +250788…">
            <Input
              required
              type="tel"
              placeholder="+250 788 000 000"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </Field>
          <Field label="License number">
            <Input
              value={form.licenseNumber}
              onChange={(e) => setForm((f) => ({ ...f, licenseNumber: e.target.value }))}
            />
          </Field>
        </form>
      </Modal>

      <Modal
        open={!!confirm}
        onClose={() => {
          if (!busy) setConfirm(null);
        }}
        title={confirm ? CONFIRM_COPY[confirm.action].title : ""}
        description={
          confirm
            ? CONFIRM_COPY[confirm.action].description(riderDisplayName(confirm.rider))
            : undefined
        }
        footer={
          <>
            <Button variant="secondary" disabled={busy} onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant={confirm?.action === "delete" ? "danger" : "primary"}
              disabled={busy}
              onClick={() => void runConfirm()}
            >
              {busy
                ? "Working…"
                : confirm
                  ? CONFIRM_COPY[confirm.action].confirmLabel
                  : "Confirm"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          This action requires confirmation before it is applied.
        </p>
      </Modal>
    </div>
  );
}
