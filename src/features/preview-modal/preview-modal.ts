import { App, Modal, TFile, MarkdownRenderer, Component } from "obsidian";

export class PreviewModal extends Modal {
  private file: TFile;
  private component: Component;

  constructor(app: App, file: TFile) {
    super(app);
    this.file = file;
    this.component = new Component();
  }

  async onOpen(): Promise<void> {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("h3", { text: this.file.basename });
    contentEl.createDiv({ cls: "vg-preview-path", text: this.file.path });

    const body = contentEl.createDiv({ cls: "vg-preview-body" });

    try {
      const content = await this.app.vault.read(this.file);
      await MarkdownRenderer.render(this.app, content, body, this.file.path, this.component);
    } catch {
      body.createDiv({ cls: "vg-preview-error", text: "Failed to read file." });
    }
  }

  onClose(): void {
    this.component.unload();
    this.contentEl.empty();
  }
}
