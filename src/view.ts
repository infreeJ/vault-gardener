import { ItemView, WorkspaceLeaf, TFile } from "obsidian";
import type VaultGardenerPlugin from "./main";
import { ViewRecord } from "./types";

export const VIEW_TYPE_GARDEN = "vault-gardener-view";

interface FileEntry {
  path: string;
  name: string;
  record: ViewRecord;
}

type SortKey = "count-desc" | "count-asc" | "last-viewed";

export class GardenView extends ItemView {
  private plugin: VaultGardenerPlugin;
  private sortKey: SortKey = "count-desc";

  constructor(leaf: WorkspaceLeaf, plugin: VaultGardenerPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType() {
    return VIEW_TYPE_GARDEN;
  }

  getDisplayText() {
    return "Vault Gardener";
  }

  getIcon() {
    return "sprout";
  }

  async onOpen() {
    this.render();
  }

  async onClose() {}

  render() {
    const container = this.containerEl.children[1];
    container.empty();

    const root = container.createDiv({ cls: "vg-root" });

    // Header
    const header = root.createDiv({ cls: "vg-header" });
    header.createEl("h4", { text: "Vault Gardener" });

    // Sort controls
    const controls = header.createDiv({ cls: "vg-controls" });
    const sortSelect = controls.createEl("select", { cls: "vg-sort-select" });
    const options: { value: SortKey; label: string }[] = [
      { value: "count-desc", label: "Most viewed" },
      { value: "count-asc", label: "Least viewed" },
      { value: "last-viewed", label: "Recently viewed" },
    ];
    for (const opt of options) {
      const el = sortSelect.createEl("option", { value: opt.value, text: opt.label });
      if (opt.value === this.sortKey) el.selected = true;
    }
    sortSelect.addEventListener("change", () => {
      this.sortKey = sortSelect.value as SortKey;
      this.render();
    });

    // Stats summary
    const entries = this.getEntries();
    const total = entries.length;
    const unviewed = this.getUnviewedCount();

    const summary = root.createDiv({ cls: "vg-summary" });
    summary.createSpan({ text: `${total} tracked` });
    if (unviewed > 0) {
      summary.createSpan({ text: ` · ${unviewed} never opened`, cls: "vg-unviewed-badge" });
    }

    // List
    const list = root.createDiv({ cls: "vg-list" });
    const sorted = this.getSortedEntries(entries);

    for (const entry of sorted) {
      this.renderEntry(list, entry);
    }

    if (sorted.length === 0) {
      list.createDiv({ cls: "vg-empty", text: "No documents tracked yet. Open some files!" });
    }
  }

  private renderEntry(container: HTMLElement, entry: FileEntry) {
    const row = container.createDiv({ cls: "vg-row" });

    const info = row.createDiv({ cls: "vg-row-info" });
    const name = info.createDiv({ cls: "vg-row-name", text: entry.name });
    name.title = entry.path;
    info.createDiv({
      cls: "vg-row-path",
      text: entry.path,
    });

    const meta = row.createDiv({ cls: "vg-row-meta" });
    meta.createDiv({
      cls: "vg-count-badge",
      text: `${entry.record.count}x`,
    });
    meta.createDiv({
      cls: "vg-last-viewed",
      text: this.formatDate(entry.record.lastViewed),
    });

    row.addEventListener("click", () => {
      const file = this.app.vault.getAbstractFileByPath(entry.path);
      if (file instanceof TFile) {
        this.app.workspace.getLeaf(false).openFile(file);
      }
    });
  }

  private getEntries(): FileEntry[] {
    const records = this.plugin.data.records;
    return Object.entries(records).map(([path, record]) => ({
      path,
      name: path.split("/").pop()?.replace(/\.md$/, "") ?? path,
      record,
    }));
  }

  private getSortedEntries(entries: FileEntry[]): FileEntry[] {
    return [...entries].sort((a, b) => {
      if (this.sortKey === "count-desc") return b.record.count - a.record.count;
      if (this.sortKey === "count-asc") return a.record.count - b.record.count;
      return b.record.lastViewed - a.record.lastViewed;
    });
  }

  private getUnviewedCount(): number {
    const allFiles = this.app.vault.getMarkdownFiles();
    const tracked = new Set(Object.keys(this.plugin.data.records));
    return allFiles.filter((f) => !tracked.has(f.path)).length;
  }

  private formatDate(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleDateString();
  }
}
