import importHTML from "../ui/import.html";
import exportHTML from "../ui/export.html";
import updateHTML from "../ui/update.html";
import { importVariables } from "./import";

console.log("[Plugin] ImportExportVariables plugin started.");

figma.on("run", () => {
  const command = figma.command;
  console.log("[Plugin] figma.command =", command);

  if (command === "import") {
    figma.showUI(importHTML, { width: 400, height: 400 });
  } else if (command === "export") {
    figma.showUI(exportHTML, { width: 400, height: 400 });
  } else if (command === "update") {
    figma.showUI(updateHTML, { width: 400, height: 400 });
  } else {
    figma.notify("No valid command selected.");
    figma.closePlugin();
  }
});

// Listen for messages from the UI
figma.ui.onmessage = async (msg) => {
  console.log("[Plugin] Received message:", msg);

  const msgType = msg.type.toLowerCase(); // Ensure lowercase message handling

  if (msgType === "import") {
    console.log("[Plugin] Calling importVariables...");
    importVariables(msg.variables, msg.collectionName);
  } else if (msgType === "close") {
    console.log("[Plugin] Closing plugin.");
    figma.closePlugin();
  } else {
    console.warn("[Plugin] Unknown message type:", msgType);
  }
};
