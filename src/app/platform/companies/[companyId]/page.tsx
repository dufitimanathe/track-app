"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/overlay";
import {
  addPlatformCompanyDocument,
  approvePlatformCompany,
  createPlatformCompanyAdmin,
  fetchPlatformCompany,
  reactivatePlatformCompany,
  rejectPlatformCompany,
  reviewPlatformCompanyDocument,
  suspendPlatformCompany,
  updatePlatformCompanyAdmin,
  type CompanyDocumentType,
  type CompanyStatus,
  type PlatformCompanyDetail,
} from "@/lib/api/platform";
import { uploadCompanyDocumentFile } from "@/lib/api/uploads";
import { DocumentPreview } from "@/components/platform/document-preview";
import {
  isValidEmail,
  isValidRwandaPhone,
  normalizeRwandaPhone,
} from "@/lib/validation/rwanda";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";

function statusTone(status: CompanyStatus) {
  if (status === "ACTIVE") return "approved" as const;
  if (status === "PENDING_REVIEW") return "pending" as const;
  if (status === "REJECTED") return "rejected" as const;
  if (status === "SUSPENDED") return "suspended" as const;
  return "draft" as const;
}

export default function PlatformCompanyDetailPage() {
  const params = useParams<{ companyId: string }>();
  const companyId = params.companyId;
  const [detail, setDetail] = useState<PlatformCompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [adminOpen, setAdminOpen] = useState(false);
  const [docOpen, setDocOpen] = useState(false);
  const [inviteHint, setInviteHint] = useState<string | null>(null);
  const [adminForm, setAdminForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [docForm, setDocForm] = useState({
    type: "BUSINESS_REGISTRATION" as CompanyDocumentType,
    title: "",
    fileUrl: "",
    notes: "",
  });
  const [docFile, setDocFile] = useState<File | null>(null);
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      setDetail(await fetchPlatformCompany(companyId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load company");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  async function onReject(e: FormEvent) {
    e.preventDefault();
    if (!rejectReason.trim()) return;
    await runAction(() => rejectPlatformCompany(companyId, rejectReason.trim()));
    setRejectOpen(false);
    setRejectReason("");
  }

  async function onAddAdmin(e: FormEvent) {
    e.preventDefault();
    if (!isValidEmail(adminForm.email)) {
      setError("Enter a valid admin email.");
      return;
    }
    if (adminForm.phone.trim() && !isValidRwandaPhone(adminForm.phone)) {
      setError("Phone must be a valid Rwanda number.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const member = await createPlatformCompanyAdmin(companyId, {
        firstName: adminForm.firstName.trim(),
        lastName: adminForm.lastName.trim(),
        email: adminForm.email.trim().toLowerCase(),
        phone: adminForm.phone.trim()
          ? normalizeRwandaPhone(adminForm.phone) ?? undefined
          : undefined,
      });
      setInviteHint(
        member.temporaryPassword
          ? `Invite created. Temporary password: ${member.temporaryPassword}`
          : "Admin invite sent.",
      );
      setAdminOpen(false);
      setAdminForm({ firstName: "", lastName: "", email: "", phone: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add admin");
    } finally {
      setBusy(false);
    }
  }

  async function onAddDoc(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      let fileUrl = docForm.fileUrl.trim();
      if (docFile) {
        const uploaded = await uploadCompanyDocumentFile(docFile);
        fileUrl = uploaded.url;
      }
      if (!fileUrl) {
        setError("Upload a file or paste a document URL.");
        setBusy(false);
        return;
      }
      await addPlatformCompanyDocument(companyId, {
        type: docForm.type,
        title: docForm.title.trim() || docFile?.name || "Document",
        fileUrl,
        notes: docForm.notes.trim() || undefined,
      });
      setDocOpen(false);
      setDocFile(null);
      setDocForm({
        type: "BUSINESS_REGISTRATION",
        title: "",
        fileUrl: "",
        notes: "",
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add document");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <div className="p-2 text-sm text-text-secondary">Loading company…</div>;
  }
  if (!detail) {
    return (
      <Card padding="lg" className="text-sm text-danger">
        {error || "Company not found."}
      </Card>
    );
  }

  const { company, documents, admins } = detail;

  return (
    <div className="space-y-6">
      <PageHeader
        title={company.name}
        description="Validate documents, approve registration, and manage company admins."
        actions={
          <Link
            href="/platform/companies"
            className="inline-flex h-10 items-center rounded-[8px] border border-border bg-surface px-4 text-sm font-medium text-text hover:bg-surface-muted"
          >
            Back to list
          </Link>
        }
      />

      {error && (
        <Card padding="md" className="border-danger/30 bg-danger-soft text-danger text-sm">
          {error}
        </Card>
      )}
      {inviteHint && (
        <Card padding="md" className="border-warning/30 bg-warning-soft text-sm text-warning">
          {inviteHint}
        </Card>
      )}

      <Card padding="lg" className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={statusTone(company.status)} label={company.status.replaceAll("_", " ")} />
          {company.registrationNumber && (
            <span className="text-sm text-text-secondary">
              Reg. {company.registrationNumber}
            </span>
          )}
        </div>
        <div className="grid gap-2 text-sm text-text-secondary sm:grid-cols-2">
          <p>Email: {company.email || "—"}</p>
          <p>Phone: {company.phone || "—"}</p>
          <p className="sm:col-span-2">Address: {company.address || "—"}</p>
          {company.rejectionReason && (
            <p className="sm:col-span-2 text-danger">Rejected: {company.rejectionReason}</p>
          )}
          {company.reviewNotes && (
            <p className="sm:col-span-2">Notes: {company.reviewNotes}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {company.status === "PENDING_REVIEW" && (
            <>
              <Button
                disabled={busy}
                onClick={() => void runAction(() => approvePlatformCompany(companyId))}
              >
                Approve company
              </Button>
              <Button
                variant="danger-outline"
                disabled={busy}
                onClick={() => setRejectOpen(true)}
              >
                Reject
              </Button>
            </>
          )}
          {company.status === "ACTIVE" && (
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => void runAction(() => suspendPlatformCompany(companyId))}
            >
              Suspend
            </Button>
          )}
          {(company.status === "SUSPENDED" || company.status === "REJECTED") && (
            <Button
              disabled={busy}
              onClick={() => void runAction(() => reactivatePlatformCompany(companyId))}
            >
              Reactivate
            </Button>
          )}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card padding="lg" className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-text">Documents</h2>
            <Button size="sm" variant="secondary" onClick={() => setDocOpen(true)}>
              Add document
            </Button>
          </div>
          {documents.length === 0 ? (
            <p className="text-sm text-text-secondary">No documents submitted yet.</p>
          ) : (
            <ul className="space-y-3">
              {documents.map((doc) => (
                <li key={doc.id} className="rounded-lg border border-border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-text">{doc.title}</p>
                    <StatusBadge
                      status={
                        doc.status === "APPROVED"
                          ? "approved"
                          : doc.status === "REJECTED"
                            ? "rejected"
                            : "pending"
                      }
                      label={doc.status}
                    />
                  </div>
                  <p className="mt-1 text-xs text-text-muted">{doc.type.replaceAll("_", " ")}</p>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-2"
                    onClick={() =>
                      setPreviewDocId((id) => (id === doc.id ? null : doc.id))
                    }
                  >
                    {previewDocId === doc.id ? "Hide preview" : "Preview file"}
                  </Button>
                  {previewDocId === doc.id ? (
                    <DocumentPreview fileUrl={doc.fileUrl} title={doc.title} />
                  ) : null}
                  {doc.status === "SUBMITTED" && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() =>
                          void runAction(() =>
                            reviewPlatformCompanyDocument(companyId, doc.id, {
                              status: "APPROVED",
                            }),
                          )
                        }
                      >
                        Validate
                      </Button>
                      <Button
                        size="sm"
                        variant="danger-outline"
                        disabled={busy}
                        onClick={() =>
                          void runAction(() =>
                            reviewPlatformCompanyDocument(companyId, doc.id, {
                              status: "REJECTED",
                              notes: "Document rejected by super admin",
                            }),
                          )
                        }
                      >
                        Reject doc
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card padding="lg" className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-text">Company admins</h2>
            <Button size="sm" variant="secondary" onClick={() => setAdminOpen(true)}>
              Add admin
            </Button>
          </div>
          {admins.length === 0 ? (
            <p className="text-sm text-text-secondary">No company admins yet.</p>
          ) : (
            <ul className="space-y-3">
              {admins.map((admin) => (
                <li
                  key={admin.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="font-medium text-text">
                      {admin.user.firstName} {admin.user.lastName}
                    </p>
                    <p className="text-sm text-text-secondary">
                      {admin.user.email || "—"} · {admin.user.phone || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      status={admin.status === "ACTIVE" ? "approved" : "pending"}
                      label={admin.status}
                    />
                    {admin.status === "ACTIVE" ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() =>
                          void runAction(() =>
                            updatePlatformCompanyAdmin(companyId, admin.id, {
                              status: "SUSPENDED",
                            }),
                          )
                        }
                      >
                        Suspend
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() =>
                          void runAction(() =>
                            updatePlatformCompanyAdmin(companyId, admin.id, {
                              status: "ACTIVE",
                            }),
                          )
                        }
                      >
                        Activate
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject company">
        <form onSubmit={onReject} className="space-y-4">
          <Field label="Reason">
            <Input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              required
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={busy}>
              Reject
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={adminOpen} onClose={() => setAdminOpen(false)} title="Add company admin">
        <form onSubmit={onAddAdmin} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name">
              <Input
                value={adminForm.firstName}
                onChange={(e) => setAdminForm((p) => ({ ...p, firstName: e.target.value }))}
                required
              />
            </Field>
            <Field label="Last name">
              <Input
                value={adminForm.lastName}
                onChange={(e) => setAdminForm((p) => ({ ...p, lastName: e.target.value }))}
                required
              />
            </Field>
          </div>
          <Field label="Email">
            <Input
              type="email"
              value={adminForm.email}
              onChange={(e) => setAdminForm((p) => ({ ...p, email: e.target.value }))}
              required
            />
          </Field>
          <Field label="Phone">
            <Input
              value={adminForm.phone}
              onChange={(e) => setAdminForm((p) => ({ ...p, phone: e.target.value }))}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setAdminOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              Invite admin
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={docOpen} onClose={() => setDocOpen(false)} title="Add document">
        <form onSubmit={onAddDoc} className="space-y-4">
          <Field label="Type">
            <Select
              value={docForm.type}
              onChange={(e) =>
                setDocForm((p) => ({
                  ...p,
                  type: e.target.value as CompanyDocumentType,
                }))
              }
            >
              <option value="BUSINESS_REGISTRATION">Business registration</option>
              <option value="TAX_CLEARANCE">Tax clearance</option>
              <option value="DIRECTOR_ID">Director ID</option>
              <option value="OTHER">Other</option>
            </Select>
          </Field>
          <Field label="Title">
            <Input
              value={docForm.title}
              onChange={(e) => setDocForm((p) => ({ ...p, title: e.target.value }))}
              required
            />
          </Field>
          <Field label="Upload file" hint="PDF, image, DOC, or DOCX · max 10 MB">
            <Input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setDocFile(file);
                if (file && !docForm.title.trim()) {
                  setDocForm((p) => ({ ...p, title: file.name }));
                }
              }}
            />
            {docFile ? (
              <p className="mt-1 text-xs text-text-muted">{docFile.name}</p>
            ) : null}
          </Field>
          <Field label="Or paste URL (optional)">
            <Input
              value={docForm.fileUrl}
              onChange={(e) => setDocForm((p) => ({ ...p, fileUrl: e.target.value }))}
              placeholder="/uploads/… or https://…"
            />
          </Field>
          <Field label="Notes">
            <Input
              value={docForm.notes}
              onChange={(e) => setDocForm((p) => ({ ...p, notes: e.target.value }))}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setDocOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              Save document
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
