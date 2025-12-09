import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const source = path.join(__dirname, '../node_modules/tinymce');
const destination = path.join(__dirname, '../public/tinymce');

// Ensure the destination directory exists
fs.ensureDirSync(destination);

// Copy specific TinyMCE files and directories
const filesToCopy = [
  'tinymce.min.js',
  'tinymce.js',
  'tinymce.d.ts',
  'themes',
  'skins',
  'icons',
  'plugins',
  'models',
  'license.md',
  'CHANGELOG.md',
  'bower.json',
  'composer.json'
];

// First, clean the destination directory
fs.emptyDirSync(destination);

filesToCopy.forEach(file => {
  const sourcePath = path.join(source, file);
  const destPath = path.join(destination, file);
  
  if (fs.existsSync(sourcePath)) {
    if (fs.statSync(sourcePath).isDirectory()) {
      fs.copySync(sourcePath, destPath);
      console.log(`Copied directory: ${file}`);
    } else {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`Copied file: ${file}`);
    }
  } else {
    console.log(`Warning: File or directory not found: ${sourcePath}`);
  }
});

// Create a simple index.html file to ensure the directory is properly served
const indexHtml = `<!DOCTYPE html>
<html>
<head>
  <title>TinyMCE Local</title>
</head>
<body>
  <h1>TinyMCE Local Installation</h1>
  <p>This directory contains local TinyMCE files for the application.</p>
</body>
</html>`;

fs.writeFileSync(path.join(destination, 'index.html'), indexHtml);
console.log('Created index.html file');

// Verify critical files exist
const criticalFiles = [
  'tinymce.min.js', 
  'themes/silver/theme.min.js', 
  'skins/ui/oxide/skin.min.css',
  'plugins/image/plugin.min.js',
  'plugins/link/plugin.min.js',
  'plugins/lists/plugin.min.js',
  'plugins/table/plugin.min.js',
  'plugins/code/plugin.min.js',
  'plugins/media/plugin.min.js',
  'plugins/fullscreen/plugin.min.js',
  'plugins/autoresize/plugin.min.js'
];

criticalFiles.forEach(file => {
  const filePath = path.join(destination, file);
  if (!fs.existsSync(filePath)) {
    console.error(`Error: Critical file missing: ${file}`);
  } else {
    console.log(`Verified: ${file}`);
  }
});

// List all available plugins
const pluginsDir = path.join(destination, 'plugins');
if (fs.existsSync(pluginsDir)) {
  const plugins = fs.readdirSync(pluginsDir);
  console.log(`Available plugins (${plugins.length}): ${plugins.join(', ')}`);
}

console.log('TinyMCE files copied successfully!'); 
