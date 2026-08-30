"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import Image from "next/image";
import {
  deleteCategory,
  deleteItem,
  saveCategory,
  saveItem,
  uploadPhoto,
  type FormState,
} from "@/app/actions/admin";
import type { Category, Item, Unit } from "@/lib/db-types";
import { UNIT_LABEL } from "@/lib/db-types";
import { AdminField, FormMessage, SubmitButton, adminInput } from "./ui";
import { cn } from "@/lib/cn";

const UNITS: Unit[] = ["kg", "piece", "unit", "set"];

/**
 * Upload straight to Supabase Storage and stash the resulting URL in a hidden
 * field, so the surrounding form stays a plain FormData submit. The client is
 * non-technical — asking them to paste a URL would not have survived contact
 * with reality.
 */
function PhotoField({
  name = "photo_url",
  initial,
  prefix,
}: {
  name?: string;
  initial: string | null;
  prefix: "category" | "item";
}) {
  const [url, setUrl] = useState(initial ?? "");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  return (
    <AdminField label="Photo" hint="JPEG, PNG, WebP or AVIF. Up to 3MB.">
      <input type="hidden" name={name} value={url} />

      <div className="flex items-center gap-3">
        {url ? (
          <Image
            src={url}
            alt=""
            width={56}
            height={56}
            unoptimized
            className="h-14 w-14 shrink-0 rounded-[12px] border-2 border-paper-3 object-cover"
          />
        ) : (
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[12px] bg-paper-2 text-xs font-bold text-ink-3">
            None
          </div>
        )}

        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="block w-full text-xs font-semibold file:mr-3 file:rounded-full file:border-0 file:bg-paper-2 file:px-4 file:py-2 file:text-xs file:font-extrabold hover:file:bg-paper-3"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setError("");
            const fd = new FormData();
            fd.set("file", file);
            fd.set("prefix", prefix);
            start(async () => {
              const res = await uploadPhoto(fd);
              if (res.ok) setUrl(res.url);
              else {
                setError(res.error);
                if (input.current) input.current.value = "";
              }
            });
          }}
        />

        {url && (
          <button
            type="button"
            onClick={() => {
              setUrl("");
              if (input.current) input.current.value = "";
            }}
            className="shrink-0 text-xs font-bold text-coral-deep underline underline-offset-4"
          >
            Clear
          </button>
        )}
      </div>

      {pending && <p className="mt-1.5 text-xs font-bold text-cobalt">Uploading…</p>}
      {error && <p className="mt-1.5 text-xs font-bold text-coral-deep">{error}</p>}
    </AdminField>
  );
}

export function CategoryForm({ category }: { category?: Category }) {
  const [state, action] = useActionState<FormState, FormData>(saveCategory, {});

  return (
    <form action={action} className="space-y-4">
      {category && <input type="hidden" name="id" value={category.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <AdminField label="Name">
          <input
            name="name"
            required
            defaultValue={category?.name}
            className={adminInput}
            placeholder="E-Waste"
          />
        </AdminField>
        <AdminField label="Slug" hint="Used in the URL. Leave blank to generate.">
          <input
            name="slug"
            defaultValue={category?.slug}
            className={adminInput}
            placeholder="e-waste"
          />
        </AdminField>
      </div>

      <AdminField label="Description" hint="One line, shown on the shelf.">
        <input
          name="description"
          defaultValue={category?.description ?? ""}
          className={adminInput}
          placeholder="Laptops, phones, monitors, cables and anything with a circuit board."
        />
      </AdminField>

      <PhotoField initial={category?.photo_url ?? null} prefix="category" />

      <div className="grid gap-4 sm:grid-cols-2">
        <AdminField label="Sort order" hint="Lower shows first.">
          <input
            name="sort_order"
            type="number"
            defaultValue={category?.sort_order ?? 0}
            className={adminInput}
          />
        </AdminField>
        <label className="flex items-end gap-2.5 pb-3">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={category?.is_active ?? true}
            className="h-5 w-5 accent-[#1b3bff]"
          />
          <span className="text-sm font-bold">Visible on the site</span>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton pendingLabel="Saving…">
          {category ? "Save category" : "Add category"}
        </SubmitButton>
      </div>

      <FormMessage state={state} />
    </form>
  );
}

export function ItemForm({
  item,
  categories,
  defaultCategoryId,
  onDone,
}: {
  item?: Item;
  categories: Category[];
  defaultCategoryId?: string;
  onDone?: () => void;
}) {
  const [state, action] = useActionState<FormState, FormData>(
    async (prev: FormState, fd: FormData) => {
      const res = await saveItem(prev, fd);
      if (res.ok) onDone?.();
      return res;
    },
    {},
  );

  return (
    <form action={action} className="space-y-4">
      {item && <input type="hidden" name="id" value={item.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <AdminField label="Name">
          <input
            name="name"
            required
            defaultValue={item?.name}
            className={adminInput}
            placeholder="Copper Bright Wire"
          />
        </AdminField>
        <AdminField label="Category">
          <select
            name="category_id"
            required
            defaultValue={item?.category_id ?? defaultCategoryId}
            className={cn(adminInput, "cursor-pointer")}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </AdminField>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <AdminField label="Unit">
          <select
            name="unit"
            defaultValue={item?.unit ?? "kg"}
            className={cn(adminInput, "cursor-pointer")}
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {UNIT_LABEL[u]}
              </option>
            ))}
          </select>
        </AdminField>
        <AdminField label="Price from (₹)">
          <input
            name="price_min"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={item?.price_min ?? 0}
            className={adminInput}
          />
        </AdminField>
        <AdminField
          label="Price to (₹)"
          hint="Same as 'from' for a fixed price."
        >
          <input
            name="price_max"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={item?.price_max ?? 0}
            className={adminInput}
          />
        </AdminField>
      </div>

      <AdminField label="Note" hint="Optional. Shown under the item name.">
        <input
          name="note"
          defaultValue={item?.note ?? ""}
          className={adminInput}
          placeholder="Stripped, clean wire."
        />
      </AdminField>

      <PhotoField initial={item?.photo_url ?? null} prefix="item" />

      <div className="grid gap-4 sm:grid-cols-2">
        <AdminField label="Sort order">
          <input
            name="sort_order"
            type="number"
            defaultValue={item?.sort_order ?? 0}
            className={adminInput}
          />
        </AdminField>
        <label className="flex items-end gap-2.5 pb-3">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={item?.is_active ?? true}
            className="h-5 w-5 accent-[#1b3bff]"
          />
          <span className="text-sm font-bold">Visible on the site</span>
        </label>
      </div>

      <SubmitButton pendingLabel="Saving…">
        {item ? "Save item" : "Add item"}
      </SubmitButton>

      <FormMessage state={state} />
    </form>
  );
}

export function DeleteCategoryButton({ id, name }: { id: string; name: string }) {
  return (
    <form action={deleteCategory}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton
        variant="danger"
        pendingLabel="Deleting…"
        confirm={`Delete "${name}" and every item in it? Existing bookings keep their records.`}
      >
        Delete category
      </SubmitButton>
    </form>
  );
}

export function DeleteItemButton({ id, name }: { id: string; name: string }) {
  return (
    <form action={deleteItem}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton
        variant="danger"
        pendingLabel="Deleting…"
        confirm={`Delete "${name}"? Past bookings keep the price they were quoted.`}
      >
        Delete
      </SubmitButton>
    </form>
  );
}
