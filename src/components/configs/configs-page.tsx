"use client";

import React from "react";
import { ConfigsManager } from "./configs-manager";
import { ConfigsShell } from "./configs-shell";

export function ConfigsPage() {
  return (
    <ConfigsShell>
      <ConfigsManager />
    </ConfigsShell>
  );
}
