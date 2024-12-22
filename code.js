"use strict";

// Clear the console for a fresh start
console.clear();

// Global variables to hold new and updated variables
let newVariablesList = [];
let updatedVariablesList = [];

/**
 * Replaces or removes invalid characters and returns a sanitized, lowercase string.
 */
function sanitizeVariableName(variableName) {
  return variableName
    .trim() // Remove leading/trailing spaces
    .replace(/\/\/+/g, "_undefined_") // Replace empty paths with 'undefined'
    .replace(/[/$,.:]/g, "_") // Replace invalid symbols with '_'
    .replace(/[,]/g, "") // Remove commas
    .replace(/[(\[\])]/g, "") // Remove unsupported characters
    .replace(/\s+/g, "_") // Replace spaces with '_'
    .replace(/__+/g, "_") // Replace multiple underscores
    .toLowerCase(); // Convert to lowercase
}

/**
 * Convert RGBA to Hex or RGBA string.
 * Declared before usage to avoid reference errors.
 */
function rgbToHex({ r, g, b, a }) {
  if (a !== undefined && a !== 1) {
    return `rgba(${[r, g, b]
      .map((n) => Math.round(n * 255))
      .join(", ")}, ${a.toFixed(4)})`;
  }

  function toHex(value) {
    const hex = Math.round(value * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }

  const hex = [toHex(r), toHex(g), toHex(b)].join("");
  return `#${hex}`;
}

/**
 * Create a new variable collection with a default mode.
 */
function createCollection(name) {
  const collection = figma.variables.createVariableCollection(name);
  const modeId = collection.modes[0].modeId;
  return { collection, modeId };
}

/**
 * Create a new token (variable) in the specified collection and mode.
 */
function createToken(collection, modeId, type, name, value, description) {
  const sanitizedName = sanitizeVariableName(name);
  const token = figma.variables.createVariable(sanitizedName, collection, type);
  token.setValueForMode(modeId, value);
  token.description = description || "";
  return token;
}

/**
 * Create an alias variable that points to an existing variable (token).
 */
function createVariable(collection, modeId, key, valueKey, tokens, description) {
  const sanitizedKey = sanitizeVariableName(key);
  const sanitizedValueKey = sanitizeVariableName(valueKey);
  const token = tokens[sanitizedValueKey];
  return createToken(
    collection,
    modeId,
    token.resolvedType,
    sanitizedKey,
    {
      type: "VARIABLE_ALIAS",
      id: token.id,
    },
    description
  );
}

/**
 * Safely parse color formats into Figma-compatible RGBA objects.
 * Throws an error if the color format is invalid.
 */
function parseColor(color) {
  color = color.trim();
  const rgbRegex = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;
  const rgbaRegex = /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([\d.]+)\s*\)$/;
  const hslRegex = /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/;
  const hslaRegex = /^hsla\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*([\d.]+)\s*\)$/;
  const hexRegex = /^#([A-Fa-f0-9]{3}){1,2}$/;
  const floatRgbRegex = /^\{\s*r:\s*[\d\.]+,\s*g:\s*[\d\.]+,\s*b:\s*[\d\.]+(,\s*a:\s*[\d\.]+)?\s*\}$/;

  if (rgbRegex.test(color)) {
    const match = color.match(rgbRegex);
    return {
      r: parseInt(match[1], 10) / 255,
      g: parseInt(match[2], 10) / 255,
      b: parseInt(match[3], 10) / 255
    };
  } else if (rgbaRegex.test(color)) {
    const match = color.match(rgbaRegex);
    return {
      r: parseInt(match[1], 10) / 255,
      g: parseInt(match[2], 10) / 255,
      b: parseInt(match[3], 10) / 255,
      a: parseFloat(match[4])
    };
  } else if (hslRegex.test(color)) {
    const match = color.match(hslRegex);
    return hslToRgbFloat(parseInt(match[1], 10), parseInt(match[2], 10) / 100, parseInt(match[3], 10) / 100);
  } else if (hslaRegex.test(color)) {
    const match = color.match(hslaRegex);
    const rgba = hslToRgbFloat(parseInt(match[1], 10), parseInt(match[2], 10) / 100, parseInt(match[3], 10) / 100);
    rgba.a = parseFloat(match[4]);
    return rgba;
  } else if (hexRegex.test(color)) {
    const hexValue = color.substring(1);
    const expandedHex = hexValue.length === 3
      ? hexValue.split("").map((char) => char + char).join("")
      : hexValue;
    return {
      r: parseInt(expandedHex.slice(0, 2), 16) / 255,
      g: parseInt(expandedHex.slice(2, 4), 16) / 255,
      b: parseInt(expandedHex.slice(4, 6), 16) / 255
    };
  } else if (floatRgbRegex.test(color)) {
    // e.g. "{ r: 0.1, g: 0.2, b: 0.3, a: 0.5 }"
    return JSON.parse(color);
  } else {
    throw new Error("Invalid color format: " + color);
  }
}

/**
 * Convert HSL to an RGB float object (0–1 range).
 */
function hslToRgbFloat(h, s, l) {
  h = h / 360; // Convert degrees to fraction
  function hue2rgb(p, q, t) {
    if (t < 0) {
      t += 1;
    }
    if (t > 1) {
      t -= 1;
    }
    if (t < 1 / 6) {
      return p + (q - p) * 6 * t;
    }
    if (t < 1 / 2) {
      return q;
    }
    if (t < 2 / 3) {
      return p + (q - p) * (2 / 3 - t) * 6;
    }
    return p;
  }

  let r, g, b;
  if (s === 0) {
    r = g = b = l; // Achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r, g, b };
}

/**
 * Check if a value is recognized as an alias (wrapped in curly braces).
 */
function isAlias(value) {
  return value.toString().trim().charAt(0) === "{";
}

/**
 * Recursive function to traverse and process each token from a JSON structure.
 */
function traverseToken({
  collection,
  modeId,
  key,
  object,
  tokens,
  aliases,
  errors,
  parentType
}) {
  const sanitizedKey = sanitizeVariableName(key);
  if (sanitizedKey.charAt(0) === "$") {
    // Skip meta properties
    return;
  }

  const type = object.$type || parentType;
  const description = object.$description || "";

  // If $value is defined, this is a leaf token
  if (object.hasOwnProperty("$value")) {
    if (!type) {
      const msg = `Type is missing for token: ${sanitizedKey}. Skipping this token.`;
      console.warn(msg);
      errors.push({ key: sanitizedKey, message: msg });
      return;
    }

    if (isAlias(object.$value)) {
      // It's an alias
      const valueKey = sanitizeVariableName(
        object.$value.trim().replace(/\./g, "/").replace(/[\{\}]/g, "")
      );
      if (tokens[valueKey]) {
        tokens[sanitizedKey] = createVariable(
          collection,
          modeId,
          sanitizedKey,
          valueKey,
          tokens,
          description
        );
      } else {
        // Store as an alias to be resolved later
        aliases[sanitizedKey] = { key: sanitizedKey, valueKey, description };
      }
    } else {
      // It's a direct value (color, number, string, etc.)
      try {
        switch (type) {
          case "color":
            try {
              tokens[sanitizedKey] = createToken(
                collection,
                modeId,
                "COLOR",
                sanitizedKey,
                parseColor(object.$value),
                description
              );
            } catch (err) {
              console.warn(`Failed to parse color for token "${sanitizedKey}": ${err.message}`);
              errors.push({ key: sanitizedKey, message: err.message });
            }
            break;
          case "number":
            const numValue = parseFloat(object.$value);
            if (isNaN(numValue)) {
              const errMsg = `Invalid number value for token "${sanitizedKey}".`;
              console.warn(errMsg);
              errors.push({ key: sanitizedKey, message: errMsg });
            } else {
              tokens[sanitizedKey] = createToken(
                collection,
                modeId,
                "FLOAT",
                sanitizedKey,
                numValue,
                description
              );
            }
            break;
          case "string":
            if (typeof object.$value !== "string") {
              const warnMsg = `Invalid string value for token "${sanitizedKey}". Expected a string.`;
              console.warn(warnMsg);
              errors.push({ key: sanitizedKey, message: warnMsg });
            } else {
              tokens[sanitizedKey] = createToken(
                collection,
                modeId,
                "STRING",
                sanitizedKey,
                object.$value,
                description
              );
            }
            break;
          default:
            const unsupportedMsg = `Unsupported type "${type}" for token "${sanitizedKey}". Skipping.`;
            console.warn(unsupportedMsg);
            errors.push({ key: sanitizedKey, message: unsupportedMsg });
        }
      } catch (err) {
        console.error(`Error creating token "${sanitizedKey}":`, err.message);
        errors.push({ key: sanitizedKey, message: err.message });
      }
    }
  } else {
    // If $value is not defined, we have nested objects
    const newParentType = object.$type || parentType;
    for (const [key2, object2] of Object.entries(object)) {
      if (key2.charAt(0) !== "$") {
        traverseToken({
          collection,
          modeId,
          key: sanitizedKey + "/" + key2,
          object: object2,
          tokens,
          aliases,
          errors,
          parentType: newParentType
        });
      }
    }
  }
}

/**
 * Attempt to resolve aliases in multiple passes.
 * Includes a safeguard to prevent infinite loops (circular references).
 */
function processAliases({ collection, modeId, aliases, tokens, errors }) {
  const aliasList = Object.values(aliases);
  let generations = aliasList.length; // max resolution passes

  while (aliasList.length && generations > 0) {
    for (let i = aliasList.length - 1; i >= 0; i--) {
      const { key, valueKey, description } = aliasList[i];
      const token = tokens[valueKey];
      if (token) {
        aliasList.splice(i, 1);
        tokens[key] = createVariable(collection, modeId, key, valueKey, tokens, description);
      }
    }
    generations--;
  }

  // If after all attempts, some aliases remain unresolved, log them as errors
  if (aliasList.length > 0) {
    aliasList.forEach((alias) => {
      const msg = `Alias could not be resolved due to missing token: ${alias.valueKey}`;
      errors.push({ key: alias.key, message: msg });
      console.warn(`Error for token "${alias.key}": ${msg}`);
    });
  }

  if (generations <= 0 && aliasList.length > 0) {
    console.error("Alias resolution failed due to circular dependency or depth limit.");
  }
}

/**
 * Summarize the import results and notify the user.
 */
function summarizeImportResults(errors) {
  if (errors.length > 0) {
    console.group("Import Errors");
    errors.forEach(({ key, message }) => {
      console.error(`Token: "${key}", Error: ${message}`);
    });
    console.groupEnd();
    figma.notify(`Import completed with ${errors.length} errors. Check the console for details.`);
  } else {
    figma.notify("Import completed successfully.");
  }
}

/**
 * Import tokens from a JSON file.
 */
function importJSONFile({ fileName, body }) {
  const errors = []; // Local error collection for this import

  try {
    const json = JSON.parse(body);
    const { collection, modeId } = createCollection(fileName);
    const aliases = {};
    const tokens = {};

    // Traverse and process each token
    for (const [key, object] of Object.entries(json)) {
      try {
        traverseToken({ collection, modeId, key, object, tokens, aliases, errors });
      } catch (error) {
        console.error(`Unexpected error processing token "${key}":`, error.message);
        errors.push({ key, message: error.message });
      }
    }

    // Process aliases after all tokens are processed
    processAliases({ collection, modeId, aliases, tokens, errors });

    // Summarize results
    summarizeImportResults(errors);

  } catch (error) {
    console.error("Critical error during JSON parsing or import:", error.message);
    figma.notify(`Import failed: ${error.message}`);
  }
}

/**
 * Export tokens to JSON by processing each local collection
 * into a single JSON file, then posting results to the UI.
 */
async function exportToJSON() {
  try {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const files = [];

    // Process each collection asynchronously
    const processedCollections = await Promise.all(
      collections.map(async (collection) => {
        return processCollection(collection);
      })
    );

    // Flatten the resulting arrays of files
    processedCollections.forEach((arr) => files.push(...arr));

    // Post the result back to the plugin UI
    figma.ui.postMessage({ type: "EXPORT_RESULT", files });
  } catch (error) {
    console.error("Export failed:", error);
    figma.notify("Export failed. Check console for details.");
  }
}


/**
 * Process a single variable collection, returning JSON data
 * for all modes in one file.
 */
async function processCollection({ name, modes = [], variableIds = [] }) {
  if (!modes.length || !variableIds.length) {
    console.warn(`No modes or variable IDs found for collection "${name}".`);
    return [];
  }

  // We'll export a single file named `collectionName.tokens.json`
  const file = {
    // If your collection name is "smartpath_ds", this results in "smartpath_ds.tokens.json"
    fileName: `${sanitizeVariableName(name)}.tokens.json`,
    body: {}
  };

  // Iterate over every variable in this collection
  for (const variableId of variableIds) {
    const variable = await figma.variables.getVariableByIdAsync(variableId);
    const { name: varName, resolvedType, valuesByMode, description, id } = variable;

    // Build the nested object path based on varName
    let obj = file.body;
    const path = sanitizeVariableName(varName).split("/");
    const finalKey = path.pop();

    // Traverse or create any needed sub-objects
    for (const groupName of path) {
      if (!obj[groupName]) {
        obj[groupName] = {};
      }
      obj = obj[groupName];
    }

    // Create the final token object if not already created
    if (!obj[finalKey]) {
      obj[finalKey] = {};
    }

    const tokenObj = obj[finalKey];

    // Basic metadata (shared across all modes)
    tokenObj.$id = id;
    tokenObj.$type = resolvedType === "FLOAT" ? "number" : resolvedType.toLowerCase();
    tokenObj.$description = description || "";

    /**
     * For each mode, we store its value in a subkey named after the mode,
     * e.g. "mode_1", "mode_dark", etc.
     */
    for (const mode of modes) {
      const modeValue = valuesByMode[mode.modeId];
      if (modeValue === undefined) continue;

      // Convert the mode name to a safe key, e.g. "mode_1"
      const modeKey = sanitizeVariableName(mode.name);

      // If not present, create a sub-object
      if (!tokenObj[modeKey]) {
        tokenObj[modeKey] = {};
      }

      if (modeValue.type === "VARIABLE_ALIAS") {
        // If the value is an alias
        const aliasVar = await figma.variables.getVariableByIdAsync(modeValue.id);
        tokenObj[modeKey].$value = `{${sanitizeVariableName(aliasVar.name).replace(/\//g, ".")}}`;
      } else {
        // Direct (non-alias) values
        switch (resolvedType) {
          case "COLOR":
            try {
              tokenObj[modeKey].$value = rgbToHex(modeValue);
            } catch (e) {
              console.warn(`Failed to convert color value to hex for "${varName}":`, e);
              tokenObj[modeKey].$value = "#000000";
            }
            break;
          case "FLOAT":
            tokenObj[modeKey].$value = modeValue;
            break;
          case "STRING":
            tokenObj[modeKey].$value = modeValue;
            break;
          default:
            console.warn(`Unsupported type "${resolvedType}" for variable "${varName}".`);
        }
      }
    }
  }

  // Return an array with just one file object
  return [file];
}


/**
 * Flatten JSON objects to identify variables by path for easy comparison.
 */
function flattenJSON(obj, prefix, result) {
  prefix = prefix || "";
  result = result || {};

  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith("$")) {
      continue; // Skip meta properties
    }
    const path = prefix ? prefix + "/" + key : key;
    if (value.hasOwnProperty("$value")) {
      result[path] = {
        $value: value.$value,
        $type: value.$type,
        $description: value.$description || "",
        $id: value.$id
      };
    } else {
      flattenJSON(value, path, result);
    }
  }
  return result;
}

/**
 * Parse imported value based on declared $type.
 * Wraps color parsing in a try/catch to avoid plugin crashes.
 */
function parseImportedValue(value, type) {
  if (isAlias(value)) {
    return value;
  } else {
    switch (type) {
      case "color":
        try {
          return parseColor(value);
        } catch (err) {
          console.warn(`Failed to parse imported color "${value}":`, err.message);
          // Return a fallback black color
          return { r: 0, g: 0, b: 0 };
        }
      case "number":
        return parseFloat(value);
      case "string":
        return value;
      case "boolean":
        // If boolean $value is missing, default to true for now
        if (typeof value === "boolean") {
          return value;
        }
        return true;
      default:
        // Return as-is if we don't recognize the type
        return value;
    }
  }
}

/**
 * Compare two values for equality based on variable type.
 */
function areValuesEqual(value1, value2, type) {
  if (type === "COLOR") {
    // Check RGBA floats
    if (!value1 || !value2) {
      return false;
    }
    return (
      value1.r === value2.r &&
      value1.g === value2.g &&
      value1.b === value2.b &&
      value1.a === value2.a
    );
  } else {
    // Fallback to JSON string comparison
    return JSON.stringify(value1) === JSON.stringify(value2);
  }
}

/**
 * Format a value for display in the UI (aliases, colors, strings, etc.).
 */
function formatValue(value, type) {
  if (value && value.type === "VARIABLE_ALIAS") {
    return "{Alias}";
  } else if (type === "COLOR") {
    return rgbToHex(value);
  } else {
    return (value && value.toString()) || "Undefined";
  }
}

/**
 * Process update data to identify new, updated, and unchanged variables
 * by comparing IDs and values.
 */
async function processUpdateData(jsonData, fileName) {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const existingVariablesById = {};

  // Map existing variables by their ID and store collectionId
  for (const collection of collections) {
    for (const variableId of collection.variableIds) {
      const variable = await figma.variables.getVariableByIdAsync(variableId);
      existingVariablesById[variable.id] = {
        variable,
        currentValue: variable.valuesByMode[collection.defaultModeId],
        collectionId: collection.id
      };
    }
  }

  newVariablesList = [];
  updatedVariablesList = [];
  let unchangedCount = 0;

  // Flatten the imported JSON data
  const importedVariables = flattenJSON(jsonData);

  for (const [name, importedData] of Object.entries(importedVariables)) {
    const $id = importedData.$id;
    const $value = importedData.$value;
    const $type = importedData.$type;

    // If $id exists and is in our existing map, it's an update candidate
    if ($id && existingVariablesById[$id]) {
      const { variable, currentValue, collectionId } = existingVariablesById[$id];
      const parsedNewValue = parseImportedValue($value, $type);

      // Compare current and new values
      if (areValuesEqual(currentValue, parsedNewValue, variable.resolvedType)) {
        unchangedCount++;
      } else {
        const newType = $type ? $type.toUpperCase() : "";
        updatedVariablesList.push({
          name: name,
          current: formatValue(currentValue, variable.resolvedType),
          updated: formatValue(parsedNewValue, newType),
          variable,
          newValue: parsedNewValue,
          type: variable.resolvedType,
          collectionId
        });
      }
    } else {
      // Otherwise, it's a new variable
      newVariablesList.push({
        name: name,
        value: $value,
        type: $type,
        description: importedData.$description || ""
      });
    }
  }

  // Inform the UI about new/updated/unchanged variables
  figma.ui.postMessage({
    type: "UPDATE_DATA_PROCESSED",
    newVariables: newVariablesList,
    updatedVariables: updatedVariablesList,
    unchangedCount: unchangedCount
  });
}

/**
 * Update a single variable by ID from the updatedVariablesList.
 */
async function updateVariableById(id) {
  const updatedVar = updatedVariablesList.find((v) => v.variable.id === id);
  if (!updatedVar) {
    figma.notify(`Variable with ID "${id}" not found in updated list.`);
    return;
  }

  const { variable, newValue, collectionId } = updatedVar;
  try {
    const collection = await figma.variables.getVariableCollectionByIdAsync(collectionId);
    if (!collection || !collection.defaultModeId) {
      console.error(`Collection or defaultModeId is undefined for variable "${variable.name}".`);
      figma.notify(`Failed to update variable "${variable.name}".`);
      return;
    }

    variable.setValueForMode(collection.defaultModeId, newValue);
    figma.notify(`Variable "${variable.name}" updated successfully.`);
  } catch (error) {
    console.error(`Failed to update variable "${variable.name}":`, error);
    figma.notify(`Failed to update variable "${variable.name}".`);
  }
}

/**
 * Update all variables in the updatedVariablesList.
 */
async function updateAllVariables() {
  try {
    for (const updatedVar of updatedVariablesList) {
      const { variable, newValue, collectionId } = updatedVar;
      const collection = await figma.variables.getVariableCollectionByIdAsync(collectionId);

      if (!collection || !collection.defaultModeId) {
        console.error(`Collection or defaultModeId is undefined for variable "${variable.name}".`);
        continue;
      }
      variable.setValueForMode(collection.defaultModeId, newValue);
    }
    figma.notify("All variables updated successfully.");
  } catch (error) {
    console.error("Failed to update all variables:", error);
    figma.notify("Failed to update all variables.");
  }
}

/**
 * Add all newly identified variables to the default collection and mode.
 */
async function addAllNewVariables() {
  const { collection, modeId } = getDefaultCollectionAndMode();

  for (const newVar of newVariablesList) {
    const rawType = newVar.type ? newVar.type.toUpperCase() : "STRING";
    const value = parseImportedValue(newVar.value, newVar.type);
    createToken(collection, modeId, rawType, newVar.name, value, newVar.description);
  }

  figma.notify("All new variables added successfully.");
}

/**
 * Get or create a "Default Collection" and its default mode.
 */
function getDefaultCollectionAndMode() {
  const collections = figma.variables.getLocalVariableCollections();
  if (collections.length > 0) {
    const collection = collections[0];
    const modeId = collection.modes[0].modeId;
    return { collection, modeId };
  } else {
    return createCollection("Default Collection");
  }
}

/**
 * Listen for messages from your plugin UI.
 * Depending on `msg.type`, import, export, or update variables.
 */
figma.ui.onmessage = async (msg) => {
  console.log("Received message:", msg);

  if (msg.type === "IMPORT") {
    const fileName = msg.fileName;
    const body = msg.body;
    importJSONFile({ fileName, body });
  } else if (msg.type === "EXPORT") {
    await exportToJSON();
  } else if (msg.type === "LOAD_UPDATE_DATA") {
    const jsonData = msg.data;
    const fileName = msg.fileName || "Unknown Collection";
    await processUpdateData(jsonData, fileName);
  } else if (msg.type === "UPDATE_VARIABLE") {
    const id = msg.id;
    await updateVariableById(id);
  } else if (msg.type === "UPDATE_ALL") {
    await updateAllVariables();
  } else if (msg.type === "ADD_ALL_NEW") {
    await addAllNewVariables();
  }
};

/**
 * Show the appropriate UI based on the Figma command.
 */
if (figma.command === "import") {
  figma.showUI(__uiFiles__["import"], {
    width: 500,
    height: 500,
    themeColors: true
  });
} else if (figma.command === "export") {
  figma.showUI(__uiFiles__["export"], {
    width: 500,
    height: 500,
    themeColors: true
  });
} else if (figma.command === "update") {
  figma.showUI(__uiFiles__["update"], {
    width: 800,
    height: 600,
    themeColors: true
  });
}
