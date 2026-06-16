"use client";

import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type {
  ProjectContribution,
  ProjectDecision,
  ProjectEngineeringSignals,
  ProjectEvidence,
  ProjectMetric,
  ProjectOutcome,
  ProjectSignals,
} from "@portfolio/validators";

import {
  contributionCategoryOptions,
  defaultEngineeringSignals,
  defaultProjectSignals,
  engineeringSignalLabels,
  evidenceSourceOptions,
  evidenceTypeOptions,
  evidenceVisibilityOptions,
  normalizeEngineeringSignals,
  normalizeProjectSignals,
  outcomeTypeOptions,
  projectSignalLabels,
  signalStrengthOptions,
} from "@/lib/project-model";

type Direction = -1 | 1;

interface BaseRow {
  id: number;
}

interface StringRow extends BaseRow {
  value: string;
}

interface ContributionRow extends BaseRow, ProjectContribution {}
interface DecisionRow extends BaseRow, ProjectDecision {}
interface OutcomeRow extends BaseRow, ProjectOutcome {}
interface MetricRow extends BaseRow, ProjectMetric {}
interface EvidenceRow
  extends BaseRow,
    Omit<
      ProjectEvidence,
      "description" | "externalUrl" | "assetUrl" | "assetKey" | "assetMimeType" | "assetSizeBytes"
    > {
  description: string;
  externalUrl: string;
  assetUrl: string;
  assetKey: string;
  assetMimeType: string;
  assetSizeBytes: string;
}

function useCounter() {
  const counter = useRef(0);
  return () => (counter.current += 1);
}

function useHiddenJson(name: string, value: unknown) {
  const hiddenRef = useRef<HTMLInputElement>(null);
  const serialized = JSON.stringify(value);

  useEffect(() => {
    hiddenRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
  }, [serialized]);

  return <input ref={hiddenRef} type="hidden" name={name} value={serialized} readOnly />;
}

function moveRow<T>(rows: T[], index: number, direction: Direction): T[] {
  const target = index + direction;
  if (target < 0 || target >= rows.length) {
    return rows;
  }

  const next = [...rows];
  [next[index], next[target]] = [next[target]!, next[index]!];
  return next;
}

function RowControls({
  index,
  total,
  onMove,
  onRemove,
}: {
  index: number;
  total: number;
  onMove: (direction: Direction) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <div className="flex flex-col">
        <button
          type="button"
          onClick={() => onMove(-1)}
          disabled={index === 0}
          aria-label="Move up"
          className="flex size-5 items-center justify-center rounded text-muted transition hover:text-ink disabled:opacity-30"
        >
          <ChevronUp className="size-3.5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => onMove(1)}
          disabled={index === total - 1}
          aria-label="Move down"
          className="flex size-5 items-center justify-center rounded text-muted transition hover:text-ink disabled:opacity-30"
        >
          <ChevronDown className="size-3.5" aria-hidden />
        </button>
      </div>
      <button type="button" onClick={onRemove} aria-label="Remove row" className="ui-btn-icon size-9">
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}

function EmptyRows({ label }: { label: string }) {
  return (
    <p className="rounded-xl border border-dashed border-line bg-white/[0.015] px-4 py-6 text-center text-sm text-muted">
      {label}
    </p>
  );
}

function isImageMimeType(value: string): boolean {
  return value.toLowerCase().startsWith("image/");
}

function isVideoMimeType(value: string): boolean {
  return value.toLowerCase().startsWith("video/");
}

function formatBytes(value: string): string | null {
  const bytes = Number(value);

  if (!Number.isFinite(bytes) || bytes <= 0) {
    return null;
  }

  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${bytes} B`;
}

function canUploadEvidenceType(type: ProjectEvidence["type"]): boolean {
  return (
    type === "architecture-diagram" ||
    type === "screenshot" ||
    type === "demo-video" ||
    type === "other"
  );
}

function evidenceUploadAccept(type: ProjectEvidence["type"]): string {
  if (type === "demo-video") {
    return "video/*";
  }

  if (type === "architecture-diagram" || type === "screenshot") {
    return "image/*";
  }

  if (type === "other") {
    return "image/*,video/*";
  }

  return "";
}

function adminEvidenceAssetUrl(row: EvidenceRow): string {
  return row.assetKey ? `/api/project-evidence-assets/${row.assetKey}` : row.assetUrl;
}

export function ProjectStringListEditor({
  name,
  label,
  defaultItems,
  hint,
  placeholder,
  addLabel = "Add item",
}: {
  name: string;
  label: string;
  defaultItems: readonly string[];
  hint?: string;
  placeholder?: string;
  addLabel?: string;
}) {
  const nextId = useCounter();
  const [rows, setRows] = useState<StringRow[]>(() =>
    defaultItems.map((value) => ({ id: nextId(), value })),
  );
  const payload = rows.map((row) => row.value.trim()).filter(Boolean);
  const hidden = useHiddenJson(name, payload);

  const patch = (id: number, value: string) =>
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, value } : row)));

  return (
    <div className="grid gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="ui-label">{label}</p>
          {hint ? <p className="mt-1 text-xs leading-5 text-muted">{hint}</p> : null}
        </div>
        <span className="text-xs tabular-nums text-muted/70">{payload.length}</span>
      </div>

      {rows.length > 0 ? (
        <ul className="grid gap-2">
          {rows.map((row, index) => (
            <li key={row.id} className="flex items-center gap-2">
              <input
                className="ui-input"
                value={row.value}
                maxLength={1000}
                placeholder={placeholder}
                onChange={(event) => patch(row.id, event.target.value)}
              />
              <RowControls
                index={index}
                total={rows.length}
                onMove={(direction) => setRows((prev) => moveRow(prev, index, direction))}
                onRemove={() => setRows((prev) => prev.filter((item) => item.id !== row.id))}
              />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyRows label="No items yet." />
      )}

      <div>
        <button
          type="button"
          className="ui-btn-ghost"
          onClick={() => setRows((prev) => [...prev, { id: nextId(), value: "" }])}
        >
          <Plus className="size-3.5" aria-hidden /> {addLabel}
        </button>
      </div>
      {hidden}
    </div>
  );
}

export function ProjectContributionsEditor({
  name,
  defaultItems,
}: {
  name: string;
  defaultItems: readonly ProjectContribution[];
}) {
  const nextId = useCounter();
  const [rows, setRows] = useState<ContributionRow[]>(() =>
    defaultItems.map((item) => ({ id: nextId(), ...item })),
  );
  const payload = rows
    .filter((row) => row.description.trim())
    .map((row) => ({ category: row.category, description: row.description.trim() }));
  const hidden = useHiddenJson(name, payload);
  const patch = (id: number, value: Partial<ProjectContribution>) =>
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...value } : row)));

  return (
    <div className="grid gap-3">
      <p className="ui-hint">Capture concrete implementation work, not generic responsibilities.</p>
      {rows.length > 0 ? (
        <ul className="grid gap-3">
          {rows.map((row, index) => (
            <li key={row.id} className="rounded-xl border border-line bg-white/[0.02] p-3">
              <div className="flex items-start gap-3">
                <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-[12rem_1fr]">
                  <label className="ui-field">
                    <span className="ui-label">Category</span>
                    <select
                      className="ui-select"
                      value={row.category}
                      onChange={(event) =>
                        patch(row.id, { category: event.target.value as ProjectContribution["category"] })
                      }
                    >
                      {contributionCategoryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="ui-field">
                    <span className="ui-label">Description</span>
                    <textarea
                      className="ui-input leading-6"
                      rows={3}
                      value={row.description}
                      maxLength={2000}
                      placeholder="Built the deployment workflow, added rollback checks..."
                      onChange={(event) => patch(row.id, { description: event.target.value })}
                    />
                  </label>
                </div>
                <RowControls
                  index={index}
                  total={rows.length}
                  onMove={(direction) => setRows((prev) => moveRow(prev, index, direction))}
                  onRemove={() => setRows((prev) => prev.filter((item) => item.id !== row.id))}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyRows label="No contributions yet." />
      )}
      <div>
        <button
          type="button"
          className="ui-btn-ghost"
          onClick={() =>
            setRows((prev) => [
              ...prev,
              { id: nextId(), category: "architecture", description: "" },
            ])
          }
        >
          <Plus className="size-3.5" aria-hidden /> Add contribution
        </button>
      </div>
      {hidden}
    </div>
  );
}

export function ProjectDecisionsEditor({
  name,
  defaultItems,
}: {
  name: string;
  defaultItems: readonly ProjectDecision[];
}) {
  const nextId = useCounter();
  const [rows, setRows] = useState<DecisionRow[]>(() =>
    defaultItems.map((item) => ({ id: nextId(), ...item })),
  );
  const payload = rows
    .filter((row) => row.title.trim())
    .map((row) => ({
      title: row.title.trim(),
      context: row.context.trim(),
      alternativesConsidered: row.alternativesConsidered.map((item) => item.trim()).filter(Boolean),
      selectedApproach: row.selectedApproach.trim(),
      rationale: row.rationale.trim(),
    }));
  const hidden = useHiddenJson(name, payload);
  const patch = (id: number, value: Partial<ProjectDecision>) =>
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...value } : row)));
  const patchAlternative = (id: number, alternativeIndex: number, value: string) =>
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const alternativesConsidered = [...row.alternativesConsidered];
        alternativesConsidered[alternativeIndex] = value;
        return { ...row, alternativesConsidered };
      }),
    );

  return (
    <div className="grid gap-3">
      <p className="ui-hint">
        Use this to capture engineering judgment: what alternatives existed, what you selected, and why.
      </p>
      {rows.length > 0 ? (
        <ul className="grid gap-4">
          {rows.map((row, index) => (
            <li key={row.id} className="rounded-xl border border-line bg-white/[0.02] p-4">
              <div className="flex items-start gap-3">
                <div className="grid min-w-0 flex-1 gap-3">
                  <input
                    className="ui-input font-semibold"
                    value={row.title}
                    maxLength={220}
                    placeholder="Decision title"
                    onChange={(event) => patch(row.id, { title: event.target.value })}
                  />
                  <textarea
                    className="ui-input leading-6"
                    rows={3}
                    value={row.context}
                    maxLength={4000}
                    placeholder="Context: what was happening and why a decision was needed."
                    onChange={(event) => patch(row.id, { context: event.target.value })}
                  />
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="ui-label">Alternatives considered</p>
                      <button
                        type="button"
                        className="ui-btn-ghost"
                        onClick={() =>
                          patch(row.id, {
                            alternativesConsidered: [...row.alternativesConsidered, ""],
                          })
                        }
                      >
                        <Plus className="size-3.5" aria-hidden /> Add alternative
                      </button>
                    </div>
                    {row.alternativesConsidered.length > 0 ? (
                      <ul className="grid gap-2">
                        {row.alternativesConsidered.map((alternative, alternativeIndex) => (
                          <li key={alternativeIndex} className="flex items-center gap-2">
                            <input
                              className="ui-input"
                              value={alternative}
                              maxLength={1000}
                              placeholder="Alternative approach"
                              onChange={(event) =>
                                patchAlternative(row.id, alternativeIndex, event.target.value)
                              }
                            />
                            <button
                              type="button"
                              className="ui-btn-icon size-9"
                              aria-label="Remove alternative"
                              onClick={() =>
                                patch(row.id, {
                                  alternativesConsidered: row.alternativesConsidered.filter(
                                    (_item, itemIndex) => itemIndex !== alternativeIndex,
                                  ),
                                })
                              }
                            >
                              <X className="size-4" aria-hidden />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <textarea
                    className="ui-input leading-6"
                    rows={3}
                    value={row.selectedApproach}
                    maxLength={4000}
                    placeholder="Selected approach"
                    onChange={(event) => patch(row.id, { selectedApproach: event.target.value })}
                  />
                  <textarea
                    className="ui-input leading-6"
                    rows={3}
                    value={row.rationale}
                    maxLength={4000}
                    placeholder="Rationale: why this approach was chosen."
                    onChange={(event) => patch(row.id, { rationale: event.target.value })}
                  />
                </div>
                <RowControls
                  index={index}
                  total={rows.length}
                  onMove={(direction) => setRows((prev) => moveRow(prev, index, direction))}
                  onRemove={() => setRows((prev) => prev.filter((item) => item.id !== row.id))}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyRows label="No key decisions yet." />
      )}
      <div>
        <button
          type="button"
          className="ui-btn-ghost"
          onClick={() =>
            setRows((prev) => [
              ...prev,
              {
                id: nextId(),
                title: "",
                context: "",
                alternativesConsidered: [],
                selectedApproach: "",
                rationale: "",
              },
            ])
          }
        >
          <Plus className="size-3.5" aria-hidden /> Add decision
        </button>
      </div>
      {hidden}
    </div>
  );
}

export function ProjectOutcomesEditor({
  name,
  defaultItems,
}: {
  name: string;
  defaultItems: readonly ProjectOutcome[];
}) {
  const nextId = useCounter();
  const [rows, setRows] = useState<OutcomeRow[]>(() =>
    defaultItems.map((item) => ({ id: nextId(), ...item })),
  );
  const payload = rows
    .filter((row) => row.description.trim())
    .map((row) => ({ type: row.type, description: row.description.trim() }));
  const hidden = useHiddenJson(name, payload);
  const patch = (id: number, value: Partial<ProjectOutcome>) =>
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...value } : row)));

  return (
    <div className="grid gap-3">
      {rows.length > 0 ? (
        <ul className="grid gap-3">
          {rows.map((row, index) => (
            <li key={row.id} className="rounded-xl border border-line bg-white/[0.02] p-3">
              <div className="flex items-start gap-3">
                <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-[12rem_1fr]">
                  <label className="ui-field">
                    <span className="ui-label">Type</span>
                    <select
                      className="ui-select"
                      value={row.type}
                      onChange={(event) =>
                        patch(row.id, { type: event.target.value as ProjectOutcome["type"] })
                      }
                    >
                      {outcomeTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="ui-field">
                    <span className="ui-label">Description</span>
                    <textarea
                      className="ui-input leading-6"
                      rows={3}
                      value={row.description}
                      maxLength={2000}
                      placeholder="Reduced manual review time to 3-5 minutes."
                      onChange={(event) => patch(row.id, { description: event.target.value })}
                    />
                  </label>
                </div>
                <RowControls
                  index={index}
                  total={rows.length}
                  onMove={(direction) => setRows((prev) => moveRow(prev, index, direction))}
                  onRemove={() => setRows((prev) => prev.filter((item) => item.id !== row.id))}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyRows label="No outcomes yet." />
      )}
      <div>
        <button
          type="button"
          className="ui-btn-ghost"
          onClick={() =>
            setRows((prev) => [...prev, { id: nextId(), type: "engineering", description: "" }])
          }
        >
          <Plus className="size-3.5" aria-hidden /> Add outcome
        </button>
      </div>
      {hidden}
    </div>
  );
}

export function ProjectMetricsEditor({
  name,
  defaultItems,
}: {
  name: string;
  defaultItems: readonly ProjectMetric[];
}) {
  const nextId = useCounter();
  const [rows, setRows] = useState<MetricRow[]>(() =>
    defaultItems.map((item) => ({ id: nextId(), ...item })),
  );
  const payload = rows
    .filter((row) => row.label.trim() && row.value.trim())
    .map((row) => ({ label: row.label.trim(), value: row.value.trim() }));
  const hidden = useHiddenJson(name, payload);
  const patch = (id: number, value: Partial<ProjectMetric>) =>
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...value } : row)));

  return (
    <div className="grid gap-3">
      <p className="ui-hint">
        Examples: Release Success Rate from roughly 35% to roughly 90%, Applications Maintained:
        20+.
      </p>
      {rows.length > 0 ? (
        <ul className="grid gap-3">
          {rows.map((row, index) => (
            <li key={row.id} className="rounded-xl border border-line bg-white/[0.02] p-3">
              <div className="flex items-start gap-3">
                <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
                  <input
                    className="ui-input"
                    value={row.label}
                    maxLength={160}
                    placeholder="Manual Review Duration"
                    aria-label="Metric label"
                    onChange={(event) => patch(row.id, { label: event.target.value })}
                  />
                  <input
                    className="ui-input"
                    value={row.value}
                    maxLength={160}
                    placeholder="3-5 minutes"
                    aria-label="Metric value"
                    onChange={(event) => patch(row.id, { value: event.target.value })}
                  />
                </div>
                <RowControls
                  index={index}
                  total={rows.length}
                  onMove={(direction) => setRows((prev) => moveRow(prev, index, direction))}
                  onRemove={() => setRows((prev) => prev.filter((item) => item.id !== row.id))}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyRows label="No metrics yet." />
      )}
      <div>
        <button
          type="button"
          className="ui-btn-ghost"
          onClick={() => setRows((prev) => [...prev, { id: nextId(), label: "", value: "" }])}
        >
          <Plus className="size-3.5" aria-hidden /> Add metric
        </button>
      </div>
      {hidden}
    </div>
  );
}

export function ProjectEvidenceEditor({
  name,
  defaultItems,
}: {
  name: string;
  defaultItems: readonly ProjectEvidence[];
}) {
  const nextId = useCounter();
  const [rows, setRows] = useState<EvidenceRow[]>(() =>
    defaultItems.map((item) => {
      const source = item.source ?? (item.assetUrl || item.assetKey ? "upload" : "external-url");

      return {
        id: nextId(),
        type: item.type,
        title: item.title,
        source,
        visibility: item.visibility,
        description: item.description ?? "",
        externalUrl: item.externalUrl ?? "",
        assetUrl: item.assetUrl ?? "",
        assetKey: item.assetKey ?? "",
        assetMimeType: item.assetMimeType ?? "",
        assetSizeBytes:
          typeof item.assetSizeBytes === "number" ? String(item.assetSizeBytes) : "",
      };
    }),
  );
  const payload = rows
    .filter((row) => row.title.trim())
    .map((row) => {
      const assetSizeBytes = Number(row.assetSizeBytes);
      const base = {
        type: row.type,
        title: row.title.trim(),
        source: row.source,
        uploadToken: String(row.id),
        ...(row.description.trim() ? { description: row.description.trim() } : {}),
        visibility: row.visibility,
      };

      if (row.source === "external-url") {
        return {
          ...base,
          ...(row.externalUrl.trim() ? { externalUrl: row.externalUrl.trim() } : {}),
        };
      }

      return {
        ...base,
        ...(row.assetUrl.trim() ? { assetUrl: row.assetUrl.trim() } : {}),
        ...(row.assetKey.trim() ? { assetKey: row.assetKey.trim() } : {}),
        ...(row.assetMimeType.trim() ? { assetMimeType: row.assetMimeType.trim() } : {}),
        ...(Number.isFinite(assetSizeBytes) && assetSizeBytes > 0 ? { assetSizeBytes } : {}),
      };
    });
  const hidden = useHiddenJson(name, payload);
  const patch = (id: number, value: Partial<EvidenceRow>) =>
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...value } : row)));
  const clearAsset = (id: number) =>
    patch(id, { assetUrl: "", assetKey: "", assetMimeType: "", assetSizeBytes: "" });

  return (
    <div className="grid gap-3">
      {rows.length > 0 ? (
        <ul className="grid gap-3">
          {rows.map((row, index) => (
            <li key={row.id} className="rounded-xl border border-line bg-white/[0.02] p-3">
              <div className="flex items-start gap-3">
                <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
                  <label className="ui-field">
                    <span className="ui-label">Type</span>
                    <select
                      className="ui-select"
                      value={row.type}
                      onChange={(event) =>
                        patch(row.id, { type: event.target.value as ProjectEvidence["type"] })
                      }
                    >
                      {evidenceTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="ui-field">
                    <span className="ui-label">Source</span>
                    <select
                      className="ui-select"
                      value={row.source}
                      onChange={(event) =>
                        patch(row.id, {
                          source: event.target.value as ProjectEvidence["source"],
                        })
                      }
                    >
                      {evidenceSourceOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="ui-field">
                    <span className="ui-label">Visibility</span>
                    <select
                      className="ui-select"
                      value={row.visibility}
                      onChange={(event) =>
                        patch(row.id, {
                          visibility: event.target.value as ProjectEvidence["visibility"],
                        })
                      }
                    >
                      {evidenceVisibilityOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <input
                    className="ui-input"
                    value={row.title}
                    maxLength={220}
                    placeholder="Evidence title"
                    aria-label="Evidence title"
                    onChange={(event) => patch(row.id, { title: event.target.value })}
                  />
                  <textarea
                    className="ui-input leading-6 sm:col-span-2"
                    rows={3}
                    value={row.description}
                    maxLength={2000}
                    placeholder="Optional description"
                    aria-label="Evidence description"
                    onChange={(event) => patch(row.id, { description: event.target.value })}
                  />
                  {row.source === "external-url" ? (
                    <input
                      className="ui-input sm:col-span-2"
                      type="url"
                      value={row.externalUrl}
                      placeholder="https://..."
                      aria-label="Evidence URL"
                      onChange={(event) => patch(row.id, { externalUrl: event.target.value })}
                    />
                  ) : (
                    <div className="grid gap-3 sm:col-span-2">
                      <label className="ui-field">
                        <span className="ui-label">Upload asset</span>
                        <input
                          type="file"
                          name={`evidenceAsset:${row.id}`}
                          accept={evidenceUploadAccept(row.type)}
                          disabled={!canUploadEvidenceType(row.type)}
                          className="w-full cursor-pointer rounded-xl border border-line bg-white/[0.03] px-3.5 py-2.5 text-sm text-muted file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-accent-500 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-accent-400 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <span className="ui-hint">
                          {canUploadEvidenceType(row.type)
                            ? "Images up to 8 MB; videos up to 50 MB. Saving stores the file and replaces any existing asset on this row."
                            : "This evidence type uses external URLs."}
                        </span>
                      </label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          className="ui-input"
                          value={row.assetUrl}
                          placeholder="Asset URL"
                          aria-label="Evidence asset URL"
                          onChange={(event) => patch(row.id, { assetUrl: event.target.value })}
                        />
                        <input
                          className="ui-input"
                          value={row.assetKey}
                          maxLength={1024}
                          placeholder="Asset key"
                          aria-label="Evidence asset key"
                          onChange={(event) => patch(row.id, { assetKey: event.target.value })}
                        />
                        <input
                          className="ui-input"
                          value={row.assetMimeType}
                          maxLength={120}
                          placeholder={row.type === "demo-video" ? "video/mp4" : "image/png"}
                          aria-label="Evidence asset MIME type"
                          onChange={(event) =>
                            patch(row.id, { assetMimeType: event.target.value })
                          }
                        />
                        <input
                          className="ui-input"
                          type="number"
                          min={1}
                          value={row.assetSizeBytes}
                          placeholder="Size in bytes"
                          aria-label="Evidence asset size in bytes"
                          onChange={(event) =>
                            patch(row.id, { assetSizeBytes: event.target.value })
                          }
                        />
                      </div>
                      <EvidenceAssetPreview row={row} onRemove={() => clearAsset(row.id)} />
                    </div>
                  )}
                </div>
                <RowControls
                  index={index}
                  total={rows.length}
                  onMove={(direction) => setRows((prev) => moveRow(prev, index, direction))}
                  onRemove={() => setRows((prev) => prev.filter((item) => item.id !== row.id))}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyRows label="No evidence yet." />
      )}
      <div>
        <button
          type="button"
          className="ui-btn-ghost"
          onClick={() =>
            setRows((prev) => [
              ...prev,
              {
                id: nextId(),
                type: "documentation",
                title: "",
                source: "external-url",
                description: "",
                externalUrl: "",
                assetUrl: "",
                assetKey: "",
                assetMimeType: "",
                assetSizeBytes: "",
                visibility: "public",
              },
            ])
          }
        >
          <Plus className="size-3.5" aria-hidden /> Add evidence
        </button>
      </div>
      {hidden}
    </div>
  );
}

function EvidenceAssetPreview({
  row,
  onRemove,
}: {
  row: EvidenceRow;
  onRemove: () => void;
}) {
  const sizeLabel = formatBytes(row.assetSizeBytes);
  const hasAsset = row.assetUrl.trim() || row.assetKey.trim();
  const previewUrl = adminEvidenceAssetUrl(row);

  if (!hasAsset) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-white/[0.015] p-4 text-sm text-muted">
        No uploaded asset metadata set.
      </div>
    );
  }

  return (
    <div className="grid gap-3 rounded-xl border border-line bg-white/[0.02] p-3">
      {previewUrl && isImageMimeType(row.assetMimeType) ? (
        <img
          src={previewUrl}
          alt=""
          className="max-h-56 w-full rounded-lg border border-line object-contain"
        />
      ) : null}
      {previewUrl && isVideoMimeType(row.assetMimeType) ? (
        <video
          src={previewUrl}
          controls
          className="max-h-64 w-full rounded-lg border border-line"
        />
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 text-xs leading-5 text-muted">
          {row.assetKey ? <p className="truncate">Key: {row.assetKey}</p> : null}
          {row.assetMimeType ? <p>MIME: {row.assetMimeType}</p> : null}
          {sizeLabel ? <p>Size: {sizeLabel}</p> : null}
        </div>
        <button type="button" className="ui-btn-ghost" onClick={onRemove}>
          Remove asset
        </button>
      </div>
    </div>
  );
}

export function ProjectEngineeringSignalsEditor({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: Partial<ProjectEngineeringSignals> | null | undefined;
}) {
  const [value, setValue] = useState<ProjectEngineeringSignals>(() =>
    normalizeEngineeringSignals(defaultValue),
  );
  const hidden = useHiddenJson(name, value);
  const keys = Object.keys(defaultEngineeringSignals) as Array<keyof ProjectEngineeringSignals>;

  return (
    <div className="grid gap-4">
      <p className="ui-hint">
        none: not meaningfully represented. basic: present but limited. strong: meaningful
        implementation or operational relevance.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {keys.map((key) => (
          <label key={key} className="ui-field">
            <span className="ui-label">{engineeringSignalLabels[key]}</span>
            <select
              className="ui-select"
              value={value[key]}
              onChange={(event) =>
                setValue((prev) => ({
                  ...prev,
                  [key]: event.target.value as ProjectEngineeringSignals[typeof key],
                }))
              }
            >
              {signalStrengthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      {hidden}
    </div>
  );
}

export function ProjectSignalsEditor({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: Partial<ProjectSignals> | null | undefined;
}) {
  const [value, setValue] = useState<ProjectSignals>(() => normalizeProjectSignals(defaultValue));
  const hidden = useHiddenJson(name, value);
  const keys = Object.keys(defaultProjectSignals) as Array<keyof ProjectSignals>;

  return (
    <div className="grid gap-4">
      <p className="ui-hint">
        These are self-assessed supporting signals, not proof by themselves. Use 1 for low signal
        and 5 for very high signal.
      </p>
      <div className="grid gap-4">
        {keys.map((key) => (
          <label key={key} className="grid gap-2 rounded-xl border border-line bg-white/[0.02] p-3">
            <span className="flex items-center justify-between gap-3">
              <span className="ui-label">{projectSignalLabels[key]}</span>
              <span className="ui-chip tabular-nums">{value[key]}/5</span>
            </span>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={value[key]}
              onChange={(event) =>
                setValue((prev) => ({ ...prev, [key]: Number(event.target.value) }))
              }
              className="w-full accent-accent-400"
            />
          </label>
        ))}
      </div>
      {hidden}
    </div>
  );
}
