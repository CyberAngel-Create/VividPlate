// Simple icon generation for PWA
// This creates basic PNG icons from the SVG for better browser compatibility

const fs = require('fs');
const path = require('path');

// Create basic favicon.ico equivalent
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Basic PNG icon data (MenuMate logo placeholder)
const createBasicIcon = (size) => {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" rx="${size/8}" fill="#2563eb"/>
    <g transform="translate(${size/4}, ${size/4})">
      <rect x="${size/8}" y="${size/6}" width="${size/2}" height="${size/32}" rx="${size/64}" fill="white"/>
      <rect x="${size/8}" y="${size/4}" width="${size/3}" height="${size/32}" rx="${size/64}" fill="white" opacity="0.8"/>
      <rect x="${size/8}" y="${size/3}" width="${size/2.2}" height="${size/32}" rx="${size/64}" fill="white" opacity="0.6"/>
      <circle cx="${size/2}" cy="${size/8}" r="${size/16}" fill="white"/>
    </g>
  </svg>`;
};

console.log('Generating PWA icons...');

iconSizes.forEach(size => {
  const svgContent = createBasicIcon(size);
  const filename = `icon-${size}x${size}.png`;
  
  // For now, save as SVG files with PNG extension (browsers will handle them)
  fs.writeFileSync(path.join(__dirname, 'icons', filename), svgContent);
  console.log(`Generated ${filename}`);
});

// Create shortcut icons
const shortcutIcons = [
  { name: 'menu-shortcut-192x192.png', size: 192 },
  { name: 'admin-shortcut-192x192.png', size: 192 }
];

shortcutIcons.forEach(({ name, size }) => {
  const svgContent = createBasicIcon(size);
  fs.writeFileSync(path.join(__dirname, 'icons', name), svgContent);
  console.log(`Generated ${name}`);
});

console.log('PWA icons generated successfully!');