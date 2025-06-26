const fs = require('fs');
const path = require('path');

// Create simple SVG icons and convert to base64 data URLs for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

const generateSVGIcon = (size) => {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size/8}" fill="#ff6b6b"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size/3}" fill="white"/>
  <rect x="${size/3}" y="${size/3}" width="${size/3}" height="${size/6}" fill="#ff6b6b"/>
  <rect x="${size/3}" y="${size*7/12}" width="${size/3}" height="${size/6}" fill="#ff6b6b"/>
</svg>`;
};

// Ensure icons directory exists
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate icons for each size
sizes.forEach(size => {
  const svgContent = generateSVGIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, svgContent);
  console.log(`Generated ${filename}`);
});

console.log('PWA icons generated successfully!');