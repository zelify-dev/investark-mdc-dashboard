import { BranchesPayload, BranchFormData } from "../types/branch.types";

export const branchesService = {
  async getHierarchy(): Promise<BranchesPayload> {
    const response = await fetch("/api/branches", { cache: "no-store" });
    if (!response.ok) {
      let message = `HTTP ${response.status}`;
      try {
        const errorJson = (await response.json()) as { error?: string };
        if (errorJson?.error) message = errorJson.error;
      } catch {
        // ignore json parse error
      }
      throw new Error(message);
    }
    return (await response.json()) as BranchesPayload;
  },

  async createBranch(input: { id: string } & BranchFormData): Promise<void> {
    const response = await fetch("/api/branches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  },

  async updateBranch(id: string, data: Partial<BranchFormData>): Promise<void> {
    const response = await fetch(`/api/branches/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  },

  async deleteBranch(id: string): Promise<void> {
    const response = await fetch(`/api/branches/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  },

  async createCentre(input: {
    id: string;
    branchId: string;
    name: string;
    meetingDay: string;
    meetingPlace: string;
    status: "ACTIVE" | "INACTIVE";
  }): Promise<void> {
    const response = await fetch("/api/centres", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  },
};
