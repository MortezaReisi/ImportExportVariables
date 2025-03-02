export async function importVariables(variables: any, collectionName: string): Promise<void> {
  console.log("[import.ts] importVariables called with:", variables, collectionName);

  if (!collectionName) {
    figma.notify("No collection name provided.");
    return;
  }

  try {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    let targetCollection = collections.find(c => c.name === collectionName);

    if (!targetCollection) {
      console.log(`[import.ts] Collection "${collectionName}" does not exist. Creating...`);
      targetCollection = figma.variables.createVariableCollection(collectionName);
      console.log(`[import.ts] Created new collection: ${collectionName}`);
    } else {
      console.log(`[import.ts] Using existing collection: ${collectionName}`);
    }

    if (targetCollection.modes.length === 0) {
      console.log("[import.ts] Adding default mode...");
      try {
        targetCollection.addMode("Default");
        console.log("[import.ts] Created default mode");
      } catch (error) {
        console.error("[import.ts] Error adding mode:", error);
        figma.notify("Failed to add default mode.");
        return;
      }
    }

    const defaultModeId = targetCollection.modes[0].modeId;
    console.log("[import.ts] Default mode ID:", defaultModeId);

    if (Array.isArray(variables)) {
      for (const v of variables) {
        if (!v.name || !v.type || v.value === undefined) {
          console.warn("[import.ts] Skipping invalid variable:", v);
          continue;
        }

        try {
          console.log(`[import.ts] Creating variable: ${v.name}, Type: ${v.type}, Value: ${v.value}`);
          let resolvedType: VariableResolvedDataType | undefined;
          
          switch (v.type) {
            case "NUMBER":
              resolvedType = "FLOAT";
              break;
            case "COLOR":
              resolvedType = "COLOR";
              break;
            case "STRING":
              resolvedType = "STRING";
              break;
            case "BOOLEAN":
              resolvedType = "BOOLEAN";
              break;
            default:
              console.error(`[import.ts] Unsupported variable type '${v.type}'`);
              continue;
          }
          
          const newVar = figma.variables.createVariable(
            v.name,
            targetCollection,
            resolvedType
          );

          if (resolvedType === "FLOAT") {
            console.log(`[import.ts] Setting FLOAT value for '${v.name}':`, v.value);
            newVar.setValueForMode(defaultModeId, parseFloat(v.value.toString()));
          } else if (resolvedType === "COLOR") {
            newVar.setValueForMode(defaultModeId, {
              r: parseInt(v.value.substring(1, 3), 16) / 255,
              g: parseInt(v.value.substring(3, 5), 16) / 255,
              b: parseInt(v.value.substring(5, 7), 16) / 255
            });
          } else {
            newVar.setValueForMode(defaultModeId, v.value);
          }
          console.log(`[import.ts] Variable '${v.name}' created successfully.`);
        } catch (error) {
          console.error(`[import.ts] Error creating variable '${v.name}':`, error);
        }
      }
      figma.notify("Variables imported successfully.");
    } else {
      console.warn("[import.ts] Invalid JSON format: Expected an array of variables.");
      figma.notify("Invalid JSON format.");
    }
  } catch (error) {
    console.error("[import.ts] Unexpected error:", error);
    figma.notify("An error occurred during the import process.");
  }
}
