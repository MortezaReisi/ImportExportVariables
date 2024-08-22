async function fetchCollections() {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  return collections.map(collection => ({
    id: collection.id,
    name: collection.name
  }));
}

async function exportVariables(collectionId: string) {
  const collection = await figma.variables.getVariableCollectionByIdAsync(collectionId);
  if (!collection) return {};

  const variables = await figma.variables.getLocalVariablesAsync();
  const variablesByCollection = variables
    .filter(variable => variable.collectionId === collectionId)
    .map(variable => ({
      id: variable.id,
      name: variable.name,
      type: variable.type,
      value: variable.value
    }));

  return {
    [collection.name]: {
      modes: {
        "Mode 1": variablesByCollection.reduce((acc, variable) => {
          acc[variable.name] = {
            "$scopes": ["ALL_SCOPES"],
            "$type": variable.type,
            "$value": variable.value
          };
          return acc;
        }, {})
      }
    }
  };
}

figma.showUI(__html__);

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'fetchCollections') {
    const collections = await fetchCollections();
    figma.ui.postMessage({ type: 'collections', collections });
  }

  if (msg.type === 'export') {
    const { collection } = msg.pluginMessage;
    const jsonData = await exportVariables(collection);
    const jsonString = JSON.stringify(jsonData, null, 2);
    figma.ui.postMessage({ type: 'file', json: jsonString });
  }
};
