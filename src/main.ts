import { Plugin, TFile, WorkspaceLeaf } from "obsidian";
import { DEFAULT_DATA, PluginData } from "./types";
import { GardenView, VIEW_TYPE_GARDEN } from "./features/garden-view/garden-view";
import { Tracker } from "./features/tracker/tracker";

export default class VaultGardenerPlugin extends Plugin {
  data: PluginData = DEFAULT_DATA;
  private tracker: Tracker;

  async onload(): Promise<void> {
    await this.loadData();

    this.tracker = new Tracker(this);

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
        if (file) this.tracker.record(file);
      })
    );
  }

  onunload(): void {}

  async loadData(): Promise<void> {
    this.data = Object.assign({}, DEFAULT_DATA, await super.loadData());
  }

  async saveData(): Promise<void> {
    await super.saveData(this.data);
  }

  private async activateView(): Promise<void> {
    const { workspace } = this.app;

    const leaves = workspace.getLeavesOfType(VIEW_TYPE_GARDEN);
    if (leaves.length > 0) {
      workspace.revealLeaf(leaves[0]);
      return;
    }

    const leaf: WorkspaceLeaf | null = workspace.getRightLeaf(false);
    await leaf?.setViewState({ type: VIEW_TYPE_GARDEN, active: true });
    if (leaf) workspace.revealLeaf(leaf);
  }
}
