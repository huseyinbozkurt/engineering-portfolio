import { Settings } from "lucide-react";

export interface MetaSidebarItem {
  id: string;
  label: string;
}

export interface MetaSidebarGroup {
  title: string;
  items: MetaSidebarItem[];
}

interface MetaSidebarProps {
  groups: MetaSidebarGroup[];
  /** Shown when the record has no relationships at all. */
  emptyHint?: string;
}

/**
 * Read-only relationship chips for a detail page, mirroring the public
 * `MetaGroup` sidebar. Relationships are configured in the gear/settings modal,
 * so this surface only displays them (with a pointer to where to edit).
 */
export function MetaSidebar({ groups, emptyHint }: MetaSidebarProps) {
  const populated = groups.filter((group) => group.items.length > 0);

  return (
    <aside className="ui-card grid h-fit content-start gap-5 p-5 shadow-card lg:sticky lg:top-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-amber-200/90">
        Relationships
      </p>

      {populated.length === 0 ? (
        <p className="text-sm text-muted">
          {emptyHint ?? "No relationships yet — add them from Settings."}
        </p>
      ) : (
        populated.map((group) => (
          <div key={group.title}>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted/70">
              {group.title}
            </p>
            <div className="flex flex-wrap gap-2">
              {group.items.map((item) => (
                <span key={item.id} className="ui-chip">
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        ))
      )}

      <p className="flex items-center gap-1.5 border-t border-line pt-3 text-xs text-muted/70">
        <Settings className="size-3.5" aria-hidden /> Manage in Settings (top-right)
      </p>
    </aside>
  );
}
