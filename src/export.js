var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export function fetchCollections() {
    return __awaiter(this, void 0, void 0, function* () {
        const collections = yield figma.variables.getLocalVariableCollectionsAsync();
        // Cast each collection as needed.
        return collections.map((collection) => ({
            id: collection.id,
            name: collection.name
        }));
    });
}
export function exportVariables(collectionId) {
    return __awaiter(this, void 0, void 0, function* () {
        const collection = yield figma.variables.getVariableCollectionByIdAsync(collectionId);
        if (!collection)
            return {};
        const variables = yield figma.variables.getLocalVariablesAsync();
        const variablesByCollection = variables
            .filter(variable => variable.collectionId === collectionId)
            .map(variable => ({
            id: variable.id,
            name: variable.name,
            type: variable.type,
            value: variable.value
        }));
        const mode1 = variablesByCollection.reduce((acc, variable) => {
            acc[variable.name] = {
                "$scopes": ["ALL_SCOPES"],
                "$type": variable.type,
                "$value": variable.value
            };
            return acc;
        }, {});
        return {
            [collection.name]: {
                modes: {
                    "Mode 1": mode1
                }
            }
        };
    });
}
