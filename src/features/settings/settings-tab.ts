import { App, PluginSettingTab, Setting } from "obsidian";
import type VaultGardenerPlugin from "../../main";

export class GardenSettingTab extends PluginSettingTab {
  private plugin: VaultGardenerPlugin;

  constructor(app: App, plugin: VaultGardenerPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Archive folder")
      .setDesc("Files moved via the Archive action will be placed in this folder.")
      .addText((text) =>
        text
          .setPlaceholder("_archive")
          .setValue(this.plugin.settings.archiveFolder)
          .onChange(async (value) => {
            this.plugin.settings.archiveFolder = value.trim() || "_archive";
            await this.plugin.saveSettings();
          })
      );
  }
}
