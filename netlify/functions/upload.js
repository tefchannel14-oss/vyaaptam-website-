// netlify/functions/upload.js - Media Upload and Image Gallery Handler
const fs = require('fs');
const path = require('path');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

const DEFAULT_BRAND_IMAGES = [
  { url: '/img/blog-agency.webp', name: 'Digital Agency Strategy', category: 'Marketing' },
  { url: '/img/blog-seo.webp', name: 'Local SEO Checklist', category: 'SEO' },
  { url: '/img/blog-legal.webp', name: 'GST & Legal Compliance', category: 'Legal' },
  { url: '/img/about.webp', name: 'Vyaaptam Office & Team', category: 'General' },
  { url: '/img/hero.webp', name: 'Hero Workspace Strategy', category: 'General' },
  { url: '/img/vyaaptam-logo.png', name: 'Vyaaptam Brand Logo', category: 'Branding' }
];

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  // 1. GET: Return list of all available images
  if (event.httpMethod === 'GET') {
    try {
      const uploadDir = path.join(__dirname, '../../site/img/uploads');
      let uploadedList = [];

      if (fs.existsSync(uploadDir)) {
        const files = fs.readdirSync(uploadDir);
        uploadedList = files
          .filter(f => /\.(png|jpe?g|webp|svg|gif)$/i.test(f))
          .map(f => ({
            url: `/img/uploads/${f}`,
            name: f.replace(/^\d+-/, '').replace(/[-_]/g, ' '),
            category: 'Uploads'
          }));
      }

      const allImages = [...uploadedList, ...DEFAULT_BRAND_IMAGES];
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ images: allImages })
      };
    } catch (err) {
      console.error('List images error:', err);
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ images: DEFAULT_BRAND_IMAGES })
      };
    }
  }

  // 2. POST: Handle image upload
  if (event.httpMethod === 'POST') {
    try {
      const { filename, dataUrl } = JSON.parse(event.body || '{}');

      if (!dataUrl || !filename) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'Image data and filename are required.' })
        };
      }

      // Parse dataUrl: data:image/png;base64,....
      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'Invalid base64 image data URL.' })
        };
      }

      const mimeType = matches[1];
      const buffer = Buffer.from(matches[2], 'base64');

      // Max 10MB limit
      if (buffer.length > 10 * 1024 * 1024) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'File size exceeds 10MB limit.' })
        };
      }

      // Determine extension
      let ext = path.extname(filename).toLowerCase();
      if (!ext || !/\.(png|jpe?g|webp|svg|gif)$/i.test(ext)) {
        ext = mimeType === 'image/png' ? '.png' :
              mimeType === 'image/webp' ? '.webp' :
              mimeType === 'image/svg+xml' ? '.svg' : '.jpg';
      }

      const safeBase = path.basename(filename, ext).replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
      const finalName = `upload-${Date.now()}-${safeBase}${ext}`;

      const uploadDir = path.join(__dirname, '../../site/img/uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const destPath = path.join(uploadDir, finalName);
      fs.writeFileSync(destPath, buffer);

      const publicUrl = `/img/uploads/${finalName}`;

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: true,
          url: publicUrl,
          filename: finalName,
          size: buffer.length
        })
      };
    } catch (err) {
      console.error('Upload error:', err);
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Failed to upload image: ' + err.message })
      };
    }
  }

  return { statusCode: 405, headers: CORS_HEADERS, body: 'Method Not Allowed' };
};
