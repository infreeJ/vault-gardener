export interface ViewRecord {
  count: number;
  lastViewed: number; // Unix timestamp
  firstViewed: number; // Unix timestamp
}

export interface PluginData {
  records: Record<string, ViewRecord>; // key: file path
}

export const DEFAULT_DATA: PluginData = {
  records: {},
};
