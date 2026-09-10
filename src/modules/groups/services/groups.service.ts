import { Group } from '../types/group.types';

export const groupsService = {
  getGroups: async (): Promise<Group[]> => {
    const response = await fetch("/api/groups", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = (await response.json()) as { data: Group[] };
    return json.data ?? [];
  },
  saveGroup: async (group: Group): Promise<Group> => {
    const response = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(group),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = (await response.json()) as { data: Group };
    return json.data;
  },
  deleteGroup: async (groupId: string): Promise<void> => {
    const response = await fetch(`/api/groups?id=${encodeURIComponent(groupId)}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  },
};
