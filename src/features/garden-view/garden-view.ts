import { ItemView, WorkspaceLeaf, TFile, Modal, App, Notice } from "obsidian";
import type VaultGardenerPlugin from "../../main";
import { PreviewModal } from "../preview-modal/preview-modal";

export const VIEW_TYPE_GARDEN = "vault-gardener-view";

type AgeFilter = 0 | 30 | 90 | 180 | 365;

export class GardenView extends ItemView {
  private plugin: VaultGardenerPlugin;
  private ageFilter: AgeFilter = 30;

  constructor(leaf: WorkspaceLeaf, plugin: VaultGardenerPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return VIEW_TYPE_GARDEN;
  }

  getDisplayText(): string {
    return "Vault Gardener";
  }

  getIcon(): string {
    return "sprout";
  }

  async onOpen(): Promise<void> {
    this.render();
  }

  async onClose(): Promise<void> {}

  render(): void {
    const container = this.containerEl.children[1];
    container.empty();

    const root = container.createDiv({ cls: "vg-root" });
    this.renderHeader(root);
    this.renderList(root);
  }

  private renderHeader(root: HTMLElement): void {
    const header = root.createDiv({ cls: "vg-header" });
    header.createEl("h4", { text: "Vault Gardener" });

    const controls = header.createDiv({ cls: "vg-controls" });

    const ageSelect = controls.createEl("select", { cls: "vg-sort-select" });
    const ageOptions: { value: AgeFilter; label: string }[] = [
      { value: 0, label: "All" },
      { value: 30, label: "30 days+" },
      { value: 90, label: "90 days+" },
      { value: 180, label: "180 days+" },
      { value: 365, label: "1 year+" },
    ];
    for (const opt of ageOptions) {
      const el = ageSelect.createEl("option", { value: String(opt.value), text: opt.label });
      if (opt.value === this.ageFilter) el.selected = true;
    }
    ageSelect.addEventListener("change", () => {
      this.ageFilter = Number(ageSelect.value) as AgeFilter;
      this.render();
    });
  }

  private renderList(root: HTMLElement): void {
    const orphans = this.getOrphanedFiles();

    const summary = root.createDiv({ cls: "vg-summary" });
    summary.createSpan({ text: `${orphans.length} orphaned file${orphans.length !== 1 ? "s" : ""}` });

    const list = root.createDiv({ cls: "vg-list" });

    if (orphans.length === 0) {
      list.createDiv({ cls: "vg-empty", text: "No orphaned files found." });
      return;
    }

    for (const file of orphans) {
      this.renderRow(list, file);
    }
  }

  private renderRow(container: HTMLElement, file: TFile): void {
    const row = container.createDiv({ cls: "vg-row" });

    const info = row.createDiv({ cls: "vg-row-info" });
    const name = info.createDiv({ cls: "vg-row-name", text: file.basename });
    name.title = file.path;
    info.createDiv({ cls: "vg-row-path", text: file.path });
    info.createDiv({
      cls: "vg-row-mtime",
      text: `Modified: ${new Date(file.stat.mtime).toLocaleDateString()}`,
    });

    const actions = row.createDiv({ cls: "vg-row-actions" });

    actions.createEl("button", { cls: "vg-btn", text: "Preview" }).addEventListener("click", (e) => {
      e.stopPropagation();
      new PreviewModal(this.app, file).open();
    });

    actions.createEl("button", { cls: "vg-btn", text: "Archive" }).addEventListener("click", async (e) => {
      e.stopPropagation();
      await this.archiveFile(file);
    });

    actions.createEl("button", { cls: "vg-btn vg-btn-danger", text: "Delete" }).addEventListener("click", (e) => {
      e.stopPropagation();
      new ConfirmModal(this.app, `Delete "${file.basename}"?`, async () => {
        await this.app.vault.delete(file);
        this.render();
      }).open();
    });
  }

  private getOrphanedFiles(): TFile[] {
    const cutoff = this.ageFilter > 0 ? Date.now() - this.ageFilter * 24 * 60 * 60 * 1000 : null;

    return this.app.vault
      .getMarkdownFiles()
      .filter((file) => {
        if (cutoff !== null && file.stat.mtime > cutoff) return false;
        return this.getBacklinkCount(file.path) === 0;
      })
      .sort((a, b) => a.stat.mtime - b.stat.mtime);
  }

  private getBacklinkCount(filePath: string): number {
    const resolvedLinks = this.app.metadataCache.resolvedLinks;
    let count = 0;
    for (const links of Object.values(resolvedLinks)) {
      if (links[filePath]) count++;
    }
    return count;
  }

  private async archiveFile(file: TFile): Promise<void> {
    const archiveFolder = this.plugin.settings.archiveFolder;
    const folderExists = this.app.vault.getAbstractFileByPath(archiveFolder);
    if (!folderExists) {
      await this.app.vault.createFolder(archiveFolder);
    }

    const dest = `${archiveFolder}/${file.name}`;
    try {
      await this.app.vault.rename(file, dest);
      this.render();
    } catch {
      new Notice(`"${file.name}" already exists in "${archiveFolder}". Change the archive folder in settings.`);
    }
  }
}

class ConfirmModal extends Modal {
  private message: string;
  private onConfirm: () => Promise<void>;

  constructor(app: App, message: string, onConfirm: () => Promise<void>) {
    super(app);
    this.message = message;
    this.onConfirm = onConfirm;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl("p", { text: this.message });

    const btnRow = contentEl.createDiv({ cls: "vg-confirm-btns" });

    btnRow.createEl("button", { text: "Cancel" }).addEventListener("click", () => {
      this.close();
    });

    btnRow
      .createEl("button", { cls: "vg-btn vg-btn-danger", text: "Delete" })
      .addEventListener("click", async () => {
        await this.onConfirm();
        this.close();
      });
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
