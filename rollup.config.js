// rollup.config.js
import typescript from 'rollup-plugin-typescript2';
import { string } from 'rollup-plugin-string';

export default {
  input: 'src/index.ts', // Your main entry point
  output: {
    file: 'dist/index.js', // Output file for bundled code
    format: 'iife',        // Immediately Invoked Function Expression, required for Figma plugins
    name: "ImportExportVariables", // Add this line
    sourcemap: true,
  },
  plugins: [
    // Import all HTML files as strings
    string({
      // Process all .html files in any folder
      include: '**/*.html'
    }),
    typescript({
      tsconfig: "tsconfig.json"
    })
  ]
};
