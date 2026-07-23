import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini AI
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Routes
  app.post("/api/parse-rss", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      const Parser = (await import('rss-parser')).default;
      const parser = new Parser({
        customFields: {
          item: [
            ['media:content', 'mediaContent', {keepArray: true}],
            ['media:thumbnail', 'mediaThumbnail'],
            ['enclosure', 'enclosure']
          ]
        }
      });
      const fetchResponse = await fetch(url);
      let xml = await fetchResponse.text();
      xml = xml.replace(/&(?!([a-zA-Z0-9]+|#[0-9]+|#x[0-9a-fA-F]+);)/g, '&amp;');
      
      // Fix boolean attributes (e.g. <img async> to <img async="async">) which cause xml2js to crash
      xml = xml.replace(/<(?!\/?!)([^>]+)>/g, (match, tagContent) => {
        let tagParts = tagContent.match(/^(\/?[a-zA-Z0-9_:-]+)\s*(.*)$/);
        if (!tagParts) return match;
        
        let tagName = tagParts[1];
        let attrs = tagParts[2];
        if (!attrs.trim()) return match;
        
        let isSelfClosing = attrs.endsWith('/');
        if (isSelfClosing) {
          attrs = attrs.slice(0, -1);
        }
        
        let newAttrs = attrs.replace(/([a-zA-Z0-9_:-]+)(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?/g, (attrMatch, attrName) => {
          if (!attrMatch.includes('=')) {
            return `${attrName}="${attrName}"`;
          }
          return attrMatch;
        });
        
        return `<${tagName}${newAttrs ? ' ' + newAttrs : ''}${isSelfClosing ? '/' : ''}>`;
      });

      // Fix unescaped HTML by wrapping in CDATA, but only if not already containing CDATA
      xml = xml.replace(/<(title|description|content:encoded|content|summary|media:description|subtitle)([^>]*)>([\s\S]*?)<\/\1>/gi, (match, tag, attrs, content) => {
        if (content.includes('<![CDATA[')) {
          return match;
        }
        return `<${tag}${attrs}><![CDATA[${content}]]></${tag}>`;
      });
      
      const feed = await parser.parseString(xml);
      
      if (feed && feed.items) {
        feed.items = await Promise.all(feed.items.map(async (item: any) => {
          let imageUrl = '';
          if (item.enclosure && item.enclosure.url && item.enclosure.type && item.enclosure.type.startsWith('image/')) {
            imageUrl = item.enclosure.url;
          } else if (item.mediaContent && Array.isArray(item.mediaContent) && item.mediaContent.length > 0 && item.mediaContent[0]['$'] && item.mediaContent[0]['$'].url) {
            imageUrl = item.mediaContent[0]['$'].url;
          } else if (item.mediaContent && item.mediaContent['$'] && item.mediaContent['$'].url) {
            imageUrl = item.mediaContent['$'].url;
          } else if (item.mediaThumbnail && item.mediaThumbnail['$'] && item.mediaThumbnail['$'].url) {
            imageUrl = item.mediaThumbnail['$'].url;
          } else {
            const content = item.content || item.contentSnippet || item.description || '';
            const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
            if (imgMatch) {
              imageUrl = imgMatch[1];
            }
          }
          
          // Fallback: try to fetch og:image from the article URL
          if (!imageUrl && item.link) {
            try {
              const res = await fetch(item.link, { signal: AbortSignal.timeout(3000) });
              const html = await res.text();
              const match = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) || 
                            html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
              if (match) {
                imageUrl = match[1];
              }
            } catch (e) {
              console.log("Error fetching og:image for", item.link);
            }
          }
          
          return { ...item, extractedImageUrl: imageUrl };
        }));
      }

      res.json({ feed });
    } catch (error) {
      console.error("RSS Parsing Error:", error);
      res.status(500).json({ error: "Failed to parse RSS feed" });
    }
  });

  app.post("/api/summarize", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY is missing." });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: "Riassumi questo articolo in un singolo paragrafo conciso:\n\n" + text,
      });

      res.json({ summary: response.text });
    } catch (error) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: "Failed to summarize text" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
