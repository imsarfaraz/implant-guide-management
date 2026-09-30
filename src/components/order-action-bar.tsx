"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, CheckCircle2, RotateCcw, Loader2, AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button, Modal, Field, Select, Textarea, Input, Checkbox } from "@/components/ui";
import { HelpTip } from "@/components/help-tip";
import { markOrderDelivered, updateHardwareOrder, deleteHardwareOrder, setItemFailure } from "@/lib/actions";

type Tier = { id: number; name: string };
type CaseOption = { id: number; displayId: string; doctor: string; patient: string };

type Order = {
  id: number;
  displayId?: string;
  packageTierId: number | null;
  orderDate: string | null;
  deliveryDate: string | null;
  delivered: boolean;
  remarks: string | null;
  linkedCaseId: number | null;
};

export function OrderActionBar({
  order,
  tiers,
  caseOptions,
}: {
  order: Order;
  tiers: Tier[];
  caseOptions: CaseOption[];
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function toggleDelivered() {
    setPending(true);
    try {
      const nextDelivered = !order.delivered;
      const res = await markOrderDelivered({
        orderId: order.id,
        delivered: nextDelivered,
      });
      if (!res.ok) {
        toast.error(res.error || "Could not update delivery");
      } else {
        toast.success(nextDelivered ? "Order marked as delivered" : "Order delivery reopened");
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update delivery — try again");
    } finally {
      setPending(false);
    }
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      orderId: order.id,
      tierId: fd.get("tierId") ? Number(fd.get("tierId")) : null,
      orderDate: fd.get("orderDate") || undefined,
      deliveryDate: fd.get("deliveryDate") || null,
      delivered: fd.get("delivered") === "on",
      remarks: (fd.get("remarks") as string)?.trim() || null,
      linkedCaseId: fd.get("linkedCaseId") ? Number(fd.get("linkedCaseId")) : null,
    };

    try {
      const res = await updateHardwareOrder(payload as any);
      if (!res.ok) {
        toast.error(res.error || "Could not save order");
      } else {
        toast.success("Order updated successfully");
        setEditOpen(false);
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save — try again");
    } finally {
      setPending(false);
    }
  }

  async function handleDeleteOrder() {
    setPending(true);
    try {
      const res = await deleteHardwareOrder({ orderId: order.id });
      if (!res.ok) {
        toast.error(res.error || "Could not delete order");
      } else {
        toast.success("Order deleted successfully");
        setDeleteOpen(false);
        router.push("/cases?type=order");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete order");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {order.delivered ? (
        <Button variant="outline" onClick={toggleDelivered} disabled={pending}>
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
          Reopen delivery
        </Button>
      ) : (
        <Button variant="accent" onClick={toggleDelivered} disabled={pending}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />}
          Mark delivered
        </Button>
      )}
      <Button variant="primary" onClick={() => setEditOpen(true)}>
        <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
        Edit order
      </Button>
      <Button
        variant="ghost"
        className="text-danger hover:bg-danger-soft hover:text-danger"
        onClick={() => {
          setDeleteOpen(true);
        }}
        title="Delete hardware order"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>

      {/* Edit modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit order details" subtitle="Dates, tier, remarks and the linked guide case.">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <input type="hidden" name="orderId" value={order.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Order date">
              <Input type="date" name="orderDate" defaultValue={order.orderDate ?? ""} />
            </Field>
            <Field label="Delivery date" hint="leave blank if unconfirmed">
              <Input type="date" name="deliveryDate" defaultValue={order.deliveryDate ?? ""} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Package tier">
              <Select name="tierId" defaultValue={order.packageTierId ? String(order.packageTierId) : ""}>
                <option value="">—</option>
                {tiers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Linked guide case" hint="same patient timeline">
              <Select name="linkedCaseId" defaultValue={order.linkedCaseId ? String(order.linkedCaseId) : ""}>
                <option value="">Not linked</option>
                {caseOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayId} — {c.doctor} / {c.patient}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Remarks">
            <Textarea name="remarks" defaultValue={order.remarks ?? ""} placeholder="e.g. Delivery date TBC — confirm with clinic" />
          </Field>
          <Checkbox label="Delivered / dispatched" name="delivered" defaultChecked={order.delivered} />
          <div className="flex justify-end gap-2.5 pt-1">
            <Button variant="ghost" type="button" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" type="submit" disabled={pending}>
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Save changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete modal */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Hardware Order"
        subtitle="Are you sure you want to delete this order?"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger-soft/40 p-4">
            <AlertTriangle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
            <div className="text-xs text-ink leading-relaxed">
              <p className="font-semibold text-danger mb-1">Permanent deletion warning</p>
              <p>
                Deleting order <strong className="font-mono">{order.displayId}</strong> will remove all implant fixture lines, cover screws, accessories, and failure logs.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteOrder} disabled={pending}>
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Delete permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function ItemFailureButton({
  item,
}: {
  item: { id: number; failed: boolean; failNote: string | null };
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [note, setNote] = React.useState(item.failNote ?? "");
  const [pending, setPending] = React.useState(false);

  async function save(failed: boolean) {
    setPending(true);
    try {
      const res = await setItemFailure({
        itemId: item.id,
        failed,
        note: note.trim() || undefined,
      });
      if (res.ok) {
        setOpen(false);
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  if (item.failed) {
    return (
      <button
        onClick={() => save(false)}
        className="inline-flex items-center gap-1 rounded-lg bg-danger-soft px-2.5 py-1 text-[11px] font-semibold text-danger transition hover:bg-danger hover:text-white"
      >
        <AlertTriangle className="h-3 w-3" />
        Failed — clear
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => {
          setNote("");
          setOpen(true);
        }}
        className="rounded-lg border border-line px-2.5 py-1 text-[11px] font-semibold text-ink-soft transition hover:border-danger/50 hover:text-danger"
      >
        Mark failed
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Mark implant as failed" subtitle="Failure notes roll up into the failure report.">
        <div className="space-y-4">
          <Field label="Failure note" required>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. failed at placement site 46 — replacement fixture owed to doctor"
              autoFocus
            />
          </Field>
          <div className="flex justify-end gap-2.5">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => save(true)} disabled={pending || !note.trim()}>
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <AlertTriangle className="h-3.5 w-3.5" />}
              Record failure
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
