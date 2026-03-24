// Domain types

export interface Graph {
  id: string
  name: string
  created_at: string
}

export interface Group {
  id: string;
  name: string;
  color: string;          // Hex e.g. "#4F81BD"
  defaultTags: string[];
}

export interface AppNode {
  id: string;
  name: string;
  groupId: string | null;
  color: string;          // Hex, overrides group color when manually set
  tags: string[];
  description: string;
  connectedNodeIds: string[];
  position: { x: number; y: number };
  image?: string;         // base64 data URL
}

export interface AppState {
  nodes: AppNode[];
  groups: Group[];
}

export type EdgeDirection = 'directed' | 'undirected';

export interface GraphFilters {
  groupIds: string[];
  tags: string[];
}

export interface SidebarFilters {
  search: string;
  groupIds: string[];
  tags: string[];
}
