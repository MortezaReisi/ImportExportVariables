export async function fetchCollections(): Promise<{ id: string; name: string }[]> {
  console.log("[export.ts] Fetching collections...");
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  
  if (!collections || collections.length === 0) {
      console.warn("[export.ts] No collections found.");
      return [];
  }

  return collections.map((collection) => ({
      id: collection.id,
      name: collection.name,
  }));
}

export async function exportVariables(collectionId: string): Promise<any> {
  console.log(`[export.ts] Exporting Collection ID: ${collectionId}`);

  const collection = await figma.variables.getVariableCollectionByIdAsync(collectionId);
  if (!collection) {
      console.error("[export.ts] Collection not found. Check the provided ID:", collectionId);
      return {};
  }

  const variables = await figma.variables.getLocalVariablesAsync();
  const variablesByCollection = variables
      .filter(variable => variable.variableCollectionId === collectionId)
      .map(variable => ({
          id: variable.id,
          name: variable.name,
          type: variable.resolvedType,
          value: variable.valuesByMode,
      }));

  console.log("[export.ts] Exported Variables:", variablesByCollection);

  const mode1: Record<string, any> = variablesByCollection.reduce((acc: Record<string, any>, variable) => {
      acc[variable.name] = {
          "$scopes": ["ALL_SCOPES"],
          "$type": variable.type,
          "$value": variable.value,
      };
      return acc;
  }, {} as Record<string, any>);

  return {
      [collection.name]: {
          modes: {
              "Mode 1": mode1
          }
      }
  };
}
