// Clear the console for a fresh start
console.clear();

// Function to create a new variable collection
function createCollection(name) {
  const collection = figma.variables.createVariableCollection(name);
  const modeId = collection.modes[0].modeId;
  return { collection, modeId };
}

// Function to create a new token (variable)
function createToken(collection, modeId, type, name, value, description = "") {
  const token = figma.variables.createVariable(name, collection, type);
  token.setValueForMode(modeId, value);
  token.description = description;
  return token;
}

// Function to create an alias variable
function createVariable(collection, modeId, key, valueKey, tokens, description = "") {
  const token = tokens[valueKey];
  return createToken(
    collection,
    modeId,
    token.resolvedType,
    key,
    {
      type: "VARIABLE_ALIAS",
      id: `${token.id}`,
    },
    description
  );
}

// Function to import tokens from a JSON file
function importJSONFile({ fileName, body }) {
  const json = JSON.parse(body);
  const { collection, modeId } = createCollection(fileName);
  const aliases = {};
  const tokens = {};
  Object.entries(json).forEach(([key, object]) => {
    traverseToken({
      collection,
      modeId,
      key,
      object,
      tokens,
      aliases,
    });
  });
  processAliases({ collection, modeId, aliases, tokens });
}

// Function to process and resolve aliases
function processAliases({ collection, modeId, aliases, tokens }) {
  aliases = Object.values(aliases);
  let generations = aliases.length;
  while (aliases.length && generations > 0) {
    for (let i = aliases.length - 1; i >= 0; i--) {
      const { key, valueKey, description } = aliases[i];
      const token = tokens[valueKey];
      if (token) {
        aliases.splice(i, 1);
        tokens[key] = createVariable(
          collection,
          modeId,
          key,
          valueKey,
          tokens,
          description
        );
      }
    }
    generations--;
  }

  if (aliases.length > 0) {
    console.warn("Some aliases could not be resolved due to missing tokens:", aliases);
  }
}

// Function to check if a value is an alias
function isAlias(value) {
  return value.toString().trim().charAt(0) === "{";
}

// Recursive function to traverse and process each token
function traverseToken({
  collection,
  modeId,
  key,
  object,
  tokens,
  aliases,
  parentType,
}) {
  if (key.charAt(0) === "$") {
    return;
  }

  const type = object.$type || parentType;

  if (object.$value !== undefined) {
    const description = object.$description || "";
    if (!type) {
      console.warn(`Type is missing for token: ${key}. Skipping this token.`);
      return;
    }

    if (isAlias(object.$value)) {
      const valueKey = object.$value
        .trim()
        .replace(/\./g, "/")
        .replace(/[\{\}]/g, "");
      if (tokens[valueKey]) {
        tokens[key] = createVariable(
          collection,
          modeId,
          key,
          valueKey,
          tokens,
          description
        );
      } else {
        aliases[key] = {
          key,
          valueKey,
          description,
        };
      }
    } else {
      switch (type) {
        case "color":
          tokens[key] = createToken(
            collection,
            modeId,
            "COLOR",
            key,
            parseColor(object.$value),
            description
          );
          break;
        case "number":
          tokens[key] = createToken(
            collection,
            modeId,
            "FLOAT",
            key,
            parseFloat(object.$value),
            description
          );
          break;
        case "string":
          tokens[key] = createToken(
            collection,
            modeId,
            "STRING",
            key,
            object.$value,
            description
          );
          break;
        default:
          console.warn(`Unsupported type "${type}" for token "${key}". Skipping this token.`);
      }
    }
  } else {
    const newParentType = object.$type || parentType;
    Object.entries(object).forEach(([key2, object2]) => {
      if (key2.charAt(0) !== "$") {
        traverseToken({
          collection,
          modeId,
          key: `${key}/${key2}`,
          object: object2,
          tokens,
          aliases,
          parentType: newParentType,
        });
      }
    });
  }
}

// Function to export tokens to JSON files
async function exportToJSON() {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const files = [];
  for (const collection of collections) {
    files.push(...(await processCollection(collection)));
  }
  figma.ui.postMessage({ type: "EXPORT_RESULT", files });
}

// Function to process a single variable collection
async function processCollection({ name, modes, variableIds }) {
  const files = [];
  for (const mode of modes) {
    const file = { fileName: `${name}.${mode.name}.tokens.json`, body: {} };
    for (const variableId of variableIds) {
      const variable = await figma.variables.getVariableByIdAsync(variableId);
      const { name: varName, resolvedType, valuesByMode, description } = variable;
      const value = valuesByMode[mode.modeId];

      if (value !== undefined) {
        let obj = file.body;
        const path = varName.split("/");
        const key = path.pop();
        for (const groupName of path) {
          if (groupName.charAt(0) === "$") continue;
          if (!obj[groupName]) {
            obj[groupName] = {};
          }
          obj = obj[groupName];
        }

        if (!obj[key]) {
          obj[key] = {};
        }

        obj = obj[key];
        obj.$type = resolvedType === "FLOAT" ? "number" : resolvedType.toLowerCase();
        obj.$description = description || "";

        if (value.type === "VARIABLE_ALIAS") {
          const aliasVar = await figma.variables.getVariableByIdAsync(value.id);
          obj.$value = `{${aliasVar.name.replace(/\//g, ".")}}`;
        } else {
          switch (resolvedType) {
            case "COLOR":
              obj.$value = rgbToHex(value);
              break;
            case "FLOAT":
              obj.$value = value;
              break;
            case "STRING":
              obj.$value = value;
              break;
            default:
              console.warn(`Unsupported type "${resolvedType}" for variable "${varName}".`);
          }
        }
      }
    }
    files.push(file);
  }
  return files;
}

// Handler for messages from the plugin UI
figma.ui.onmessage = async (e) => {
  console.log("Code received message:", e);
  if (e.type === "IMPORT") {
    const { fileName, body } = e;
    importJSONFile({ fileName, body });
  } else if (e.type === "EXPORT") {
    await exportToJSON();
  }
};

// Show the appropriate UI based on the command
if (figma.command === "import") {
  figma.showUI(__uiFiles__["import"], {
    width: 500,
    height: 500,
    themeColors: true,
  });
} else if (figma.command === "export") {
  figma.showUI(__uiFiles__["export"], {
    width: 500,
    height: 500,
    themeColors: true,
  });
}

// Function to convert RGB color values to hex string
function rgbToHex({ r, g, b, a }) {
  if (a !== undefined && a !== 1) {
    return `rgba(${[r, g, b]
      .map((n) => Math.round(n * 255))
      .join(", ")}, ${a.toFixed(4)})`;
  }
  const toHex = (value) => {
    const hex = Math.round(value * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  const hex = [toHex(r), toHex(g), toHex(b)].join("");
  return `#${hex}`;
}

// Function to parse various color formats into RGB object
function parseColor(color) {
  color = color.trim();
  const rgbRegex = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;
  const rgbaRegex =
    /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([\d.]+)\s*\)$/;
  const hslRegex = /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/;
  const hslaRegex =
    /^hsla\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*([\d.]+)\s*\)$/;
  const hexRegex = /^#([A-Fa-f0-9]{3}){1,2}$/;
  const floatRgbRegex =
    /^\{\s*r:\s*[\d\.]+,\s*g:\s*[\d\.]+,\s*b:\s*[\d\.]+(,\s*a:\s*[\d\.]+)?\s*\}$/;

  if (rgbRegex.test(color)) {
    const [, r, g, b] = color.match(rgbRegex);
    return { r: parseInt(r) / 255, g: parseInt(g) / 255, b: parseInt(b) / 255 };
  } else if (rgbaRegex.test(color)) {
    const [, r, g, b, a] = color.match(rgbaRegex);
    return {
      r: parseInt(r) / 255,
      g: parseInt(g) / 255,
      b: parseInt(b) / 255,
      a: parseFloat(a),
    };
  } else if (hslRegex.test(color)) {
    const [, h, s, l] = color.match(hslRegex);
    return hslToRgbFloat(parseInt(h), parseInt(s) / 100, parseInt(l) / 100);
  } else if (hslaRegex.test(color)) {
    const [, h, s, l, a] = color.match(hslaRegex);
    return Object.assign(
      hslToRgbFloat(parseInt(h), parseInt(s) / 100, parseInt(l) / 100),
      { a: parseFloat(a) }
    );
  } else if (hexRegex.test(color)) {
    const hexValue = color.substring(1);
    const expandedHex =
      hexValue.length === 3
        ? hexValue
            .split("")
            .map((char) => char + char)
            .join("")
        : hexValue;
    return {
      r: parseInt(expandedHex.slice(0, 2), 16) / 255,
      g: parseInt(expandedHex.slice(2, 4), 16) / 255,
      b: parseInt(expandedHex.slice(4, 6), 16) / 255,
    };
  } else if (floatRgbRegex.test(color)) {
    return JSON.parse(color);
  } else {
    throw new Error("Invalid color format: " + color);
  }
}

// Function to convert HSL values to RGB object
function hslToRgbFloat(h, s, l) {
  h = h / 360; // Convert degrees to fraction
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

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
