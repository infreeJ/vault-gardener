import { Plugin, WorkspaceLeaf } from "obsidian";
import { DEFAULT_SETTINGS, PluginSettings } from "./types";
import { GardenView, VIEW_TYPE_GARDEN } from "./features/garden-view/garden-view";
import { GardenSettingTab } from "./features/settings/settings-tab";

export default class VaultGardenerPlugin extends Plugin {
  settings: PluginSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.registerView(VIEW_TYPE_GARDEN, (leaf) => new GardenView(leaf, this));

    this.addRibbonIcon("sprout", "Vault Gardener", () => {
      this.activateView();
    });

    this.addCommand({
      id: "open-vault-gardener",
      name: "Open Vault Gardener",
      callback: () => this.activateView(),
    });

    this.addSettingTab(new GardenSettingTab(this.app, this));
  }

  onunload(): void {}

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await super.loadData());
  }

  async saveSettings(): Promise<void> {
    await super.saveData(this.settings);
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
