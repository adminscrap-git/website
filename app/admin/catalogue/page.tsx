import { requireAdmin } from "@/lib/admin-auth";
import { getAllCategories, getFullCatalogue } from "@/lib/admin-queries";
import { priceLabel } from "@/lib/format";
import { Panel } from "@/components/admin/ui";
import {
  CategoryForm,
  DeleteCategoryButton,
  DeleteItemButton,
  ItemForm,
} from "@/components/admin/catalogue-forms";
import { cn } from "@/lib/cn";

export default async function CataloguePage() {
  await requireAdmin("super_admin");

  const [catalogue, categories] = await Promise.all([
    getFullCatalogue(),
    getAllCategories(),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <header>
        <h1 className="display text-4xl">Catalogue</h1>
        <p className="mt-1.5 max-w-2xl text-base font-semibold text-ink-2">
          Everything here shows up on the shelf and the rate card immediately.
          Changing a price never rewrites what a past customer was quoted —
          bookings keep their own snapshot.
        </p>
      </header>

      <div className="mt-8 space-y-4">
        {catalogue.map((cat) => (
          <section
            key={cat.id}
            className={cn(
              "rounded-toy border-2 bg-paper p-6",
              cat.is_active ? "border-paper-3" : "border-dashed border-ink-3 opacity-70",
            )}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="display text-2xl">
                {cat.name}
                {!cat.is_active && (
                  <span className="readout ml-2 align-middle text-[10px] uppercase tracking-wider text-ink-3">
                    Hidden
                  </span>
                )}
              </h2>
              <p className="readout text-[10px] uppercase tracking-wider text-ink-3">
                {cat.items.length} items · order {cat.sort_order}
              </p>
            </div>

            <ul className="mt-4 divide-y divide-paper-3">
              {cat.items.map((item) => (
                <li key={item.id}>
                  <details className="group py-2.5">
                    <summary className="flex cursor-pointer list-none items-center gap-4 [&::-webkit-details-marker]:hidden">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-extrabold">
                          {item.name}
                          {!item.is_active && (
                            <span className="readout ml-2 text-[10px] uppercase tracking-wider text-ink-3">
                              Hidden
                            </span>
                          )}
                        </span>
                        <span className="readout block text-xs text-ink-3">
                          {priceLabel(item)}
                        </span>
                      </span>
                      <span
                        aria-hidden
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-paper-2 text-base font-bold transition-transform group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>

                    <div className="mt-4 rounded-[16px] bg-paper-2 p-5">
                      <ItemForm item={item} categories={categories} />
                      <div className="mt-4 border-t border-paper-3 pt-4">
                        <DeleteItemButton id={item.id} name={item.name} />
                      </div>
                    </div>
                  </details>
                </li>
              ))}

              {cat.items.length === 0 && (
                <li className="py-3 text-sm font-semibold text-ink-3">
                  No items in this category yet.
                </li>
              )}
            </ul>

            <div className="mt-5 flex flex-wrap gap-3 border-t border-paper-3 pt-5">
              <details className="w-full">
                <summary className="cursor-pointer text-sm font-extrabold text-cobalt">
                  + Add an item to {cat.name}
                </summary>
                <div className="mt-4 rounded-[16px] bg-paper-2 p-5">
                  <ItemForm categories={categories} defaultCategoryId={cat.id} />
                </div>
              </details>

              <details className="w-full">
                <summary className="cursor-pointer text-sm font-bold text-ink-2">
                  Edit the {cat.name} category itself
                </summary>
                <div className="mt-4 rounded-[16px] bg-paper-2 p-5">
                  <CategoryForm category={cat} />
                  <div className="mt-4 border-t border-paper-3 pt-4">
                    <DeleteCategoryButton id={cat.id} name={cat.name} />
                  </div>
                </div>
              </details>
            </div>
          </section>
        ))}
      </div>

      <div className="mt-6">
        <Panel
          title="New category"
          description="Groups items on the shelf and the rate card."
        >
          <CategoryForm />
        </Panel>
      </div>
    </div>
  );
}
