import { Plugin, TFile, WorkspaceLeaf } from "obsidian";
import { DEFAULT_DATA, PluginData } from "./types";
import { GardenView, VIEW_TYPE_GARDEN } from "./view";

export default class VaultGardenerPlugin extends Plugin {
  data: PluginData = DEFAULT_DATA;

  async onload() {
    await this.loadData();

    this.registerView(VIEW_TYPE_GARDEN, (leaf) => new GardenView(leaf, this));

    this.addRibbonIcon("sprout", "Vault Gardener", () => {
      this.activateView();
    });

    this.addCommand({
      id: "open-vault-gardener",
      name: "Open Vault Gardener",
      callback: () => this.activateView(),
    });

    this.registerEvent(
      this.app.workspace.on("file-open", (file: TFile | null) => {
        if (file) this.recordView(file);
      })
    );
  }

  onunload() {}

  recordView(file: TFile) {
    const now = Date.now();
    const existing = this.data.records[file.path];

    if (existing) {
      existing.count += 1;
      existing.lastViewed = now;
    } else {
      this.data.records[file.path] = {
        count: 1,
        lastViewed: now,
        firstViewed: now,
      };
    }

    this.saveData();
  }

  async loadData() {
    this.data = Object.assign({}, DEFAULT_DATA, await super.loadData());
  }

  async saveData() {
    await super.saveData(this.data);
  }

  async activateView() {
    const { workspace } = this.app;

    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE_GARDEN);

    if (leaves.length > 0) {
      leaf = leaves[0];
    } else {
      leaf = workspace.getRightLeaf(false);
      await leaf?.setViewState({ type: VIEW_TYPE_GARDEN, active: true });
    }

    if (leaf) workspace.revealLeaf(leaf);
  }
}
