import { TFile } from "obsidian";
import type VaultGardenerPlugin from "../../main";

export class Tracker {
  private plugin: VaultGardenerPlugin;

  constructor(plugin: VaultGardenerPlugin) {
    this.plugin = plugin;
  }

  record(file: TFile): void {
    const now = Date.now();
    const existing = this.plugin.data.records[file.path];

    if (existing) {
      existing.count += 1;
      existing.lastViewed = now;
    } else {
      this.plugin.data.records[file.path] = {
        count: 1,
        lastViewed: now,
        firstViewed: now,
      };
    }

    this.plugin.saveData();
  }
}
