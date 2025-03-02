(function () {
    'use strict';

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise, SuppressedError, Symbol, Iterator */


    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };

    var importHTML = "<style>\n  :root {\n    --spacing: 0.8rem;\n  }\n  * {\n    box-sizing: border-box;\n  }\n  body {\n    background-color: var(--figma-color-bg);\n    color: var(--figma-color-text);\n    margin: 0;\n    padding: var(--spacing);\n  }\n  html, body {\n    height: 100%;\n  }\n  form {\n    display: flex;\n    flex-direction: column;\n    gap: var(--spacing);\n    height: 100%;\n  }\n  button {\n    appearance: none;\n    border-radius: 4px;\n    padding: var(--spacing);\n    background-color: var(--figma-color-bg-brand);\n    border: none;\n    color: var(--figma-color-text-onbrand);\n    font-family: system-ui, sans-serif;\n    font-weight: bold;\n  }\n  input, textarea {\n    font-family: Andale Mono, monospace;\n    font-size: 0.9rem;\n    padding: var(--spacing);\n    background-color: var(--figma-color-bg-secondary);\n    color: var(--figma-color-text-secondary);\n    border: 2px solid var(--figma-color-border);\n  }\n  input:focus, textarea:focus {\n    border-color: var(--figma-color-border-selected);\n    outline: none;\n  }\n  textarea {\n    flex: 1;\n    white-space: pre;\n  }\n  form > * {\n    display: block;\n    width: 100%;\n  }\n</style>\n\n<form>\n  <input id=\"collection-name\" placeholder=\"Collection Name\" required type=\"text\" value=\"Wild Examples\" />\n  <textarea id=\"json-input\" required placeholder=\"Tokens JSON\"></textarea>\n  <button type=\"submit\">Import Variables</button>\n</form>\n\n<script>\n  document.querySelector(\"form\").addEventListener(\"submit\", (e) => {\n    e.preventDefault();\n    const collectionName = document.getElementById(\"collection-name\").value.trim();\n    const jsonInput = document.getElementById(\"json-input\").value.trim();\n    \n    if (!collectionName || !isValidJSON(jsonInput)) {\n      alert(\"Invalid collection name or JSON format.\");\n      return;\n    }\n\n    const variables = JSON.parse(jsonInput);\n    console.log(\"[UI] Sending import message:\", variables);\n    parent.postMessage({ pluginMessage: { type: \"import\", variables, collectionName } }, \"*\");\n  });\n\n  function isValidJSON(body) {\n    try {\n      JSON.parse(body);\n      return true;\n    } catch (e) {\n      return false;\n    }\n  }\n</script>";

    var exportHTML = "<style>\n    :root {\n      --spacing: 0.8rem;\n    }\n  \n    * {\n      box-sizing: border-box;\n    }\n  \n    body {\n      background-color: var(--figma-color-bg);\n      color: var(--figma-color-text);\n      margin: 0;\n      padding: var(--spacing);\n    }\n  \n    html,\n    body,\n    main {\n      height: 100%;\n    }\n  \n    main {\n      display: flex;\n      flex-direction: column;\n      gap: var(--spacing);\n    }\n  \n    button {\n      appearance: none;\n      border-radius: 4px;\n      padding: var(--spacing);\n    }\n  \n    textarea {\n      background-color: var(--figma-color-bg-secondary);\n      border: 2px solid var(--figma-color-border);\n      color: var(--figma-color-text-secondary);\n      flex: 1;\n      font-family: Andale Mono, monospace;\n      font-size: 0.9rem;\n      overflow: auto;\n      padding: var(--spacing);\n      white-space: pre;\n    }\n  \n    textarea:focus {\n      border-color: var(--figma-color-border-selected);\n      outline: none;\n    }\n  \n    button,\n    textarea {\n      display: block;\n      width: 100%;\n    }\n  \n    button {\n      background-color: var(--figma-color-bg-brand);\n      border: none;\n      color: var(--figma-color-text-onbrand);\n      font-family: system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\",\n        Roboto, Oxygen, Ubuntu, Cantarell, \"Open Sans\", \"Helvetica Neue\",\n        sans-serif;\n      font-weight: bold;\n    }\n  \n    #export {\n      background-color: var(--figma-color-bg-component);\n    }\n  \n    #download {\n      background-color: var(--figma-color-bg-accent);\n    }\n  </style>\n  <main>\n    <button id=\"export\" type=\"button\">Export Variables</button>\n    <button id=\"download\" type=\"button\">Download JSON</button>\n    <textarea\n      placeholder=\"Exported variables will render here...\"\n      readonly\n    ></textarea>\n  </main>\n  <script>\n    window.onmessage = ({ data: { pluginMessage } }) => {\n      if (pluginMessage.type === \"EXPORT_RESULT\") {\n        const exportData = pluginMessage.files\n          .map(\n            ({ fileName, body }) =>\n              `/* ${fileName} */\\n\\n${JSON.stringify(body, null, 2)}`\n          )\n          .join(\"\\n\\n\\n\");\n        const textarea = document.querySelector(\"textarea\");\n        textarea.innerHTML = exportData;\n  \n        // Prepare the data for download\n        const blob = new Blob([exportData], { type: 'application/json' });\n        const url = URL.createObjectURL(blob);\n        document.getElementById(\"download\").onclick = () => {\n          const a = document.createElement(\"a\");\n          a.href = url;\n          a.download = \"variables.json\";\n          a.click();\n          URL.revokeObjectURL(url);\n        };\n      }\n    };\n  \n    document.getElementById(\"export\").addEventListener(\"click\", () => {\n      parent.postMessage({ pluginMessage: { type: \"EXPORT\" } }, \"*\");\n    });\n  </script>\n  ";

    var updateHTML = "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Update Variables</title>\n  <style>\n    :root {\n      --spacing: 0.8rem;\n    }\n\n    * {\n      box-sizing: border-box;\n    }\n\n    body {\n      background-color: var(--figma-color-bg);\n      color: var(--figma-color-text);\n      margin: 0;\n      padding: var(--spacing);\n      font-family: system-ui, sans-serif;\n    }\n\n    html,\n    body,\n    main {\n      height: 100%;\n    }\n\n    main {\n      display: flex;\n      flex-direction: column;\n      gap: var(--spacing);\n    }\n\n    textarea {\n      width: 100%;\n      height: 150px;\n      padding: var(--spacing);\n      border: 1px solid var(--figma-color-border);\n      border-radius: 4px;\n      font-family: inherit;\n      font-size: 1rem;\n    }\n\n    button {\n      appearance: none;\n      border-radius: 4px;\n      padding: var(--spacing);\n      background-color: var(--figma-color-primary);\n      color: var(--figma-color-text-on-primary);\n      border: none;\n      cursor: pointer;\n      margin-top: var(--spacing);\n    }\n\n    button:hover {\n      background-color: var(--figma-color-primary-hover);\n    }\n\n    table {\n      width: 100%;\n      border-collapse: collapse;\n      margin-top: var(--spacing);\n    }\n\n    th,\n    td {\n      padding: var(--spacing);\n      border: 1px solid var(--figma-color-border);\n      text-align: left;\n    }\n\n    th {\n      background-color: var(--figma-color-bg-hover);\n    }\n\n    ul {\n      list-style: none;\n      padding: 0;\n    }\n\n    li {\n      padding: var(--spacing) 0;\n      border-bottom: 1px solid var(--figma-color-border);\n    }\n\n    #statistics {\n      display: flex;\n      gap: var(--spacing);\n    }\n\n    #statistics span {\n      font-weight: bold;\n    }\n  </style>\n</head>\n<body>\n  <main>\n    <h1>Update Variables</h1>\n\n    <!-- Textarea to paste JSON -->\n    <section>\n      <h2>Paste JSON Data</h2>\n      <textarea id=\"json-input\" placeholder=\"Paste your JSON here...\"></textarea>\n      <button id=\"load-json\">Load JSON</button>\n    </section>\n\n    <!-- Statistics Section -->\n    <section id=\"statistics\">\n      <p>New Variables: <span id=\"new-count\">0</span></p>\n      <p>Updated Variables: <span id=\"updated-count\">0</span></p>\n      <p>Unchanged Variables: <span id=\"unchanged-count\">0</span></p>\n    </section>\n\n    <!-- New Variables Section -->\n    <section>\n      <h2>New Variables</h2>\n      <ul id=\"new-variables\"></ul>\n      <button id=\"add-all-new\">Add All New Variables</button>\n    </section>\n\n    <!-- Updated Variables Section -->\n    <section>\n      <h2>Updated Variables</h2>\n      <table>\n        <thead>\n          <tr>\n            <th>Variable Name</th>\n            <th>Current Version</th>\n            <th>Updated Version</th>\n            <th>Action</th>\n          </tr>\n        </thead>\n        <tbody id=\"updated-variables\"></tbody>\n      </table>\n      <button id=\"update-all\">Update All Variables</button>\n    </section>\n  </main>\n\n  <script>\n    document.addEventListener('DOMContentLoaded', () => {\n      // Handle JSON loading\n      document.getElementById('load-json').addEventListener('click', () => {\n        const jsonInput = document.getElementById('json-input').value;\n        try {\n          const jsonData = JSON.parse(jsonInput);\n          parent.postMessage(\n            { pluginMessage: { type: 'LOAD_UPDATE_DATA', data: jsonData } },\n            '*'\n          );\n        } catch (error) {\n          alert('Invalid JSON. Please check your input.');\n        }\n      });\n\n      // Load update data from the Figma plugin\n      window.onmessage = (event) => {\n        const message = event.data.pluginMessage;\n        if (message.type === 'UPDATE_DATA_PROCESSED') {\n          const { newVariables, updatedVariables, unchangedCount } = message;\n\n          // Update counts\n          document.getElementById('new-count').textContent = newVariables.length;\n          document.getElementById('updated-count').textContent = updatedVariables.length;\n          document.getElementById('unchanged-count').textContent = unchangedCount;\n\n          // Populate New Variables\n          const newVariablesList = document.getElementById('new-variables');\n          newVariablesList.innerHTML = '';\n          newVariables.forEach((variable) => {\n            const li = document.createElement('li');\n            li.textContent = variable.name;\n            newVariablesList.appendChild(li);\n          });\n\n          // Populate Updated Variables Table\n          const updatedVariablesTable = document.getElementById('updated-variables');\n          updatedVariablesTable.innerHTML = '';\n          updatedVariables.forEach(({ name, current, updated, variable }) => {\n            const row = document.createElement('tr');\n            row.innerHTML = `\n              <td>${name}</td>\n              <td>${current}</td>\n              <td>${updated}</td>\n              <td><button data-id=\"${variable.id}\">Update</button></td>\n            `;\n            updatedVariablesTable.appendChild(row);\n          });\n\n          // Attach update button listeners\n          document.querySelectorAll('#updated-variables button').forEach((button) => {\n            button.addEventListener('click', () => {\n              const id = button.dataset.id;\n              if (id) {\n                parent.postMessage(\n                  { pluginMessage: { type: 'UPDATE_VARIABLE', id } },\n                  '*'\n                );\n              } else {\n                console.error('No ID found for the update action.');\n              }\n            });\n          });\n        }\n      };\n\n      // Add event listener for Update All button\n      document.getElementById('update-all').addEventListener('click', () => {\n        parent.postMessage({ pluginMessage: { type: 'UPDATE_ALL' } }, '*');\n      });\n\n      // Add event listener for Add All New button\n      document.getElementById('add-all-new').addEventListener('click', () => {\n        parent.postMessage({ pluginMessage: { type: 'ADD_ALL_NEW' } }, '*');\n      });\n    });\n  </script>\n</body>\n</html>\n";

    function importVariables(variables, collectionName) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("[import.ts] importVariables called with:", variables, collectionName);
            if (!collectionName) {
                figma.notify("No collection name provided.");
                return;
            }
            try {
                const collections = yield figma.variables.getLocalVariableCollectionsAsync();
                let targetCollection = collections.find(c => c.name === collectionName);
                if (!targetCollection) {
                    console.log(`[import.ts] Collection "${collectionName}" does not exist. Creating...`);
                    targetCollection = figma.variables.createVariableCollection(collectionName);
                    console.log(`[import.ts] Created new collection: ${collectionName}`);
                }
                else {
                    console.log(`[import.ts] Using existing collection: ${collectionName}`);
                }
                if (targetCollection.modes.length === 0) {
                    console.log("[import.ts] Adding default mode...");
                    try {
                        targetCollection.addMode("Default");
                        console.log("[import.ts] Created default mode");
                    }
                    catch (error) {
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
                            let resolvedType;
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
                            const newVar = figma.variables.createVariable(v.name, targetCollection, resolvedType);
                            if (resolvedType === "FLOAT") {
                                console.log(`[import.ts] Setting FLOAT value for '${v.name}':`, v.value);
                                newVar.setValueForMode(defaultModeId, parseFloat(v.value.toString()));
                            }
                            else if (resolvedType === "COLOR") {
                                newVar.setValueForMode(defaultModeId, {
                                    r: parseInt(v.value.substring(1, 3), 16) / 255,
                                    g: parseInt(v.value.substring(3, 5), 16) / 255,
                                    b: parseInt(v.value.substring(5, 7), 16) / 255
                                });
                            }
                            else {
                                newVar.setValueForMode(defaultModeId, v.value);
                            }
                            console.log(`[import.ts] Variable '${v.name}' created successfully.`);
                        }
                        catch (error) {
                            console.error(`[import.ts] Error creating variable '${v.name}':`, error);
                        }
                    }
                    figma.notify("Variables imported successfully.");
                }
                else {
                    console.warn("[import.ts] Invalid JSON format: Expected an array of variables.");
                    figma.notify("Invalid JSON format.");
                }
            }
            catch (error) {
                console.error("[import.ts] Unexpected error:", error);
                figma.notify("An error occurred during the import process.");
            }
        });
    }

    console.log("[Plugin] ImportExportVariables plugin started.");
    figma.on("run", () => {
        const command = figma.command;
        console.log("[Plugin] figma.command =", command);
        if (command === "import") {
            figma.showUI(importHTML, { width: 400, height: 400 });
        }
        else if (command === "export") {
            figma.showUI(exportHTML, { width: 400, height: 400 });
        }
        else if (command === "update") {
            figma.showUI(updateHTML, { width: 400, height: 400 });
        }
        else {
            figma.notify("No valid command selected.");
            figma.closePlugin();
        }
    });
    // Listen for messages from the UI
    figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
        console.log("[Plugin] Received message:", msg);
        const msgType = msg.type.toLowerCase(); // Ensure lowercase message handling
        if (msgType === "import") {
            console.log("[Plugin] Calling importVariables...");
            importVariables(msg.variables, msg.collectionName);
        }
        else if (msgType === "close") {
            console.log("[Plugin] Closing plugin.");
            figma.closePlugin();
        }
        else {
            console.warn("[Plugin] Unknown message type:", msgType);
        }
    });

})();
//# sourceMappingURL=index.js.map
