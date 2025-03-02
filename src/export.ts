// src/export.ts
export async function fetchCollections(): Promise<{ id: string; name: string }[]> {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    return collections.map((collection: any) => ({
      id: collection.id,
      name: collection.name,
    }));
  }
  
  export async function exportVariables(collectionId: string): Promise<any> {
    const collection = await figma.variables.getVariableCollectionByIdAsync(collectionId);
    if (!collection) return {};
  
    const variables = await figma.variables.getLocalVariablesAsync();
    const variablesByCollection = (variables as any[])
      .filter(variable => variable.collectionId === collectionId)
      .map(variable => ({
        id: variable.id,
        name: variable.name,
        type: variable.type,
        value: variable.value,
      }));
  
    const mode1: Record<string, any> = variablesByCollection.reduce((acc: Record<string, any>, variable: any) => {
      acc[variable.name] = {
        "$scopes": ["ALL_SCOPES"],
        "$type": variable.type,
        "$value": variable.value,
      };
      return acc;
    }, {});
  
    return {
      [collection.name]: {
        modes: {
          "Mode 1": mode1,
        },
      },
    };
  }
  