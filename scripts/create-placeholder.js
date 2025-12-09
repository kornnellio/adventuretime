import fs from 'fs';
import { createCanvas } from 'canvas';

// Create a canvas for the placeholder image
const width = 800;
const height = 600;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Fill the background
ctx.fillStyle = '#f0f0f0';
ctx.fillRect(0, 0, width, height);

// Draw a placeholder icon
ctx.fillStyle = '#cccccc';
ctx.beginPath();
ctx.moveTo(width/2, height/2 - 50);
ctx.lineTo(width/2 + 50, height/2 + 30);
ctx.lineTo(width/2 - 50, height/2 + 30);
ctx.closePath();
ctx.fill();

// Draw a circle for the "sun"
ctx.beginPath();
ctx.arc(width/2 + 50, height/2 - 50, 30, 0, Math.PI * 2);
ctx.fill();

// Add text
ctx.fillStyle = '#888888';
ctx.font = '24px Arial';
ctx.textAlign = 'center';
ctx.fillText('Image not available', width/2, height/2 + 80);

// Draw a line
ctx.fillRect(width/2 - 150, height/2 + 100, 300, 5);

// Save the image
const buffer = canvas.toBuffer('image/jpeg');
fs.writeFileSync('./public/images/placeholder.jpg', buffer);

console.log('Placeholder image created at ./public/images/placeholder.jpg'); 
