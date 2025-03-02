import importHTML from "../ui/import.html";
import exportHTML from "../ui/export.html";
import updateHTML from "../ui/update.html";
import { importVariables } from "./import";
import { fetchCollections, exportVariables } from "./export"; // Ensure both are imported

console.log("[Plugin] ImportExportVariables plugin started.");

figma.on("run", async () => {
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

  const msgType = msg.type.toLowerCase().trim(); // Ensure consistent message handling

  try {
    if (msgType === "import") {
      console.log("[Plugin] Calling importVariables...");
      importVariables(msg.variables, msg.collectionName);
    } 
    else if (msgType === "export") {
      console.log("[Plugin] Calling exportVariables...");
      const exportedData = await exportVariables(msg.collectionId);
      console.log("[Plugin] Exported data:", exportedData);
      figma.ui.postMessage({ type: "exportedData", data: exportedData });
    } 
    else if (msgType === "fetchcollections") { // Make sure it's checked in lowercase
      console.log("[Plugin] Fetching collections...");
      const collections = await fetchCollections();
      figma.ui.postMessage({ type: "collectionsFetched", collections });
    }
    else if (msgType === "close") {
      console.log("[Plugin] Closing plugin.");
      figma.closePlugin();
    } else {
      console.warn("[Plugin] Unknown message type:", msgType);
    }
  } catch (error: any) {
    console.error("[Plugin] Error:", error);
    figma.ui.postMessage({ type: "error", message: error.message || "An unknown error occurred." });
  }
};
