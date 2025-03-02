// src/ui.ts
import { importVariables } from "./import";

export function setupUI(): void {
  figma.ui.onmessage = (msg) => {
    const pluginMsg = msg.pluginMessage;
    if (!pluginMsg) return;

    console.log("[ui.ts] onmessage received:", pluginMsg);

    if (pluginMsg.type === "import") {
      console.log("[ui.ts] Handling 'import' message:", pluginMsg);
      const { json, collection } = pluginMsg;

      try {
        const variables = JSON.parse(json);
        importVariables(variables, collection);
      } catch (err) {
        console.error("[ui.ts] Import error:", err);
        figma.notify("Import failed: Invalid JSON?");
      }
    }

    // else if (pluginMsg.type === "export") { ... }
    // else if (pluginMsg.type === "update") { ... }
  };
}
