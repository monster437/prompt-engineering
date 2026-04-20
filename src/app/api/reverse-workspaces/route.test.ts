import { Prisma } from "@prisma/client";
import { afterEach, describe, expect, it, vi } from "vitest";

const {
  listReverseWorkspacesMock,
  createReverseWorkspaceMock,
  toReverseWorkspaceDtoMock,
  toReverseWorkspaceUpdateDataMock,
  updateReverseWorkspaceMock,
  deleteReverseWorkspaceMock
} = vi.hoisted(() => ({
  listReverseWorkspacesMock: vi.fn().mockResolvedValue([]),
  createReverseWorkspaceMock: vi.fn().mockResolvedValue({ id: "rws_1", title: "逆推工作台 1" }),
  toReverseWorkspaceDtoMock: vi.fn((workspace) => workspace),
  toReverseWorkspaceUpdateDataMock: vi.fn((payload) => payload),
  updateReverseWorkspaceMock: vi.fn().mockResolvedValue({ id: "rws_1", title: "已更新" }),
  deleteReverseWorkspaceMock: vi.fn()
}));

vi.mock("@/lib/reverse-workspaces", () => ({
  listReverseWorkspaces: listReverseWorkspacesMock,
  createReverseWorkspace: createReverseWorkspaceMock,
  toReverseWorkspaceDto: toReverseWorkspaceDtoMock,
  toReverseWorkspaceUpdateData: toReverseWorkspaceUpdateDataMock
}));

vi.mock("@/lib/db", () => ({
  db: {
    reverseWorkspace: {
      update: updateReverseWorkspaceMock,
      delete: deleteReverseWorkspaceMock
    }
  }
}));

import { GET, POST } from "@/app/api/reverse-workspaces/route";
import { DELETE, PATCH } from "@/app/api/reverse-workspaces/[id]/route";

const originalJson = Request.prototype.json;

afterEach(() => {
  Request.prototype.json = originalJson;
  listReverseWorkspacesMock.mockClear();
  createReverseWorkspaceMock.mockClear();
  toReverseWorkspaceDtoMock.mockClear();
  toReverseWorkspaceUpdateDataMock.mockClear();
  updateReverseWorkspaceMock.mockClear();
  deleteReverseWorkspaceMock.mockClear();
});

describe("/api/reverse-workspaces", () => {
  it("returns reverse workspace list", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(listReverseWorkspacesMock).toHaveBeenCalledTimes(1);
  });

  it("creates a reverse workspace", async () => {
    const request = new Request("http://localhost/api/reverse-workspaces", {
      method: "POST",
      body: JSON.stringify({ title: "  逆推工作台 A  " })
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(createReverseWorkspaceMock).toHaveBeenCalledWith("逆推工作台 A");
  });

  it("returns 400 for malformed json", async () => {
    const request = new Request("http://localhost/api/reverse-workspaces", { method: "POST" });
    Request.prototype.json = vi.fn().mockRejectedValue(new Error("Invalid JSON"));

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid reverse workspace payload" });
  });
});

describe("PATCH /api/reverse-workspaces/[id]", () => {
  it("updates a reverse workspace", async () => {
    updateReverseWorkspaceMock.mockResolvedValue({ id: "rws_1", title: "已更新" });

    const response = await PATCH(
      new Request("http://localhost/api/reverse-workspaces/rws_1", {
        method: "PATCH",
        body: JSON.stringify({
          userInstruction: "偏电影感",
          status: "completed"
        })
      }),
      {
        params: Promise.resolve({ id: "rws_1" })
      }
    );

    expect(response.status).toBe(200);
    expect(toReverseWorkspaceUpdateDataMock).toHaveBeenCalledWith({
      userInstruction: "偏电影感",
      status: "completed"
    });
    expect(updateReverseWorkspaceMock).toHaveBeenCalledWith({
      where: { id: "rws_1" },
      data: {
        userInstruction: "偏电影感",
        status: "completed"
      }
    });
    expect(toReverseWorkspaceDtoMock).toHaveBeenCalledWith({ id: "rws_1", title: "已更新" });
  });

  it("returns 400 for malformed patch json", async () => {
    const request = new Request("http://localhost/api/reverse-workspaces/rws_1", {
      method: "PATCH"
    });
    Request.prototype.json = vi.fn().mockRejectedValue(new Error("Invalid JSON"));

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "rws_1" })
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid reverse workspace payload" });
  });

  it("returns 404 when the reverse workspace does not exist", async () => {
    updateReverseWorkspaceMock.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Not found", {
        code: "P2025",
        clientVersion: "test"
      })
    );

    const response = await PATCH(
      new Request("http://localhost/api/reverse-workspaces/rws_missing", {
        method: "PATCH",
        body: JSON.stringify({ title: "Nope" })
      }),
      {
        params: Promise.resolve({ id: "rws_missing" })
      }
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Reverse workspace not found" });
  });
});

describe("DELETE /api/reverse-workspaces/[id]", () => {
  it("deletes a reverse workspace", async () => {
    deleteReverseWorkspaceMock.mockResolvedValue(undefined);

    const response = await DELETE(
      new Request("http://localhost/api/reverse-workspaces/rws_1", { method: "DELETE" }),
      {
        params: Promise.resolve({ id: "rws_1" })
      }
    );

    expect(response.status).toBe(204);
    expect(deleteReverseWorkspaceMock).toHaveBeenCalledWith({ where: { id: "rws_1" } });
  });

  it("returns 404 when deleting a missing reverse workspace", async () => {
    deleteReverseWorkspaceMock.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Not found", {
        code: "P2025",
        clientVersion: "test"
      })
    );

    const response = await DELETE(
      new Request("http://localhost/api/reverse-workspaces/rws_missing", { method: "DELETE" }),
      {
        params: Promise.resolve({ id: "rws_missing" })
      }
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Reverse workspace not found" });
  });
});
