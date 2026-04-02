import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import type { IconManifest } from '~/types';

export class IconManager {
  private iconsDir: string;
  private manifestPath: string;
  private manifest: IconManifest = {};
  private iconFileCache: Map<string, string | null> = new Map();
  private readonly MAX_CACHE_SIZE = 1000;

  constructor(dataDir: string) {
    this.iconsDir = path.join(dataDir, 'icons');
    this.manifestPath = path.join(this.iconsDir, 'manifest.json');
    this.ensureDirectories();
    this.loadManifest();
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(this.iconsDir)) {
      fs.mkdirSync(this.iconsDir, { recursive: true });
    }
  }

  private loadManifest(): void {
    if (fs.existsSync(this.manifestPath)) {
      const content = fs.readFileSync(this.manifestPath, 'utf-8');
      this.manifest = JSON.parse(content);
    }
  }

  private saveManifest(): void {
    fs.writeFileSync(this.manifestPath, JSON.stringify(this.manifest, null, 2));
  }

  private pruneCache(): void {
    if (this.iconFileCache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.iconFileCache.entries());
      const toDelete = entries.slice(0, entries.length - this.MAX_CACHE_SIZE);
      for (const [key] of toDelete) {
        this.iconFileCache.delete(key);
      }
    }
  }

  getUrlHash(url: string): string {
    return createHash('sha256').update(url).digest('hex').slice(0, 12);
  }

  getIconPath(url: string): string | null {
    if (!url) return null;

    const hash = this.manifest[url];
    if (!hash) return null;

    // Check cache first
    const cached = this.iconFileCache.get(hash);
    if (cached !== undefined) {
      return cached;
    }

    const files = fs.readdirSync(this.iconsDir);
    const iconFile = files.find(f => f.startsWith(hash));

    if (iconFile) {
      const iconPath = `/icons/${iconFile}`;
      this.iconFileCache.set(hash, iconPath);
      this.pruneCache();
      return iconPath;
    }

    this.iconFileCache.set(hash, null);
    this.pruneCache();
    return null;
  }

  async downloadIcon(url: string): Promise<string | null> {
    if (!url) return null;

    const hash = this.getUrlHash(url);
    const currentHash = this.manifest[url];

    // Check if icon is already cached with same hash
    if (currentHash === hash) {
      const cachedPath = this.getIconPath(url);
      if (cachedPath) {
        return cachedPath;
      }
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`Failed to download icon: ${url} - ${response.status}`);
        return null;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image/')) {
        console.error(`Invalid content type for icon: ${contentType}`);
        return null;
      }

      // Determine file extension from content type or URL
      let ext = 'png';
      if (contentType.includes('svg')) {
        ext = 'svg';
      } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
        ext = 'jpg';
      } else if (contentType.includes('ico')) {
        ext = 'ico';
      } else if (url.endsWith('.svg')) {
        ext = 'svg';
      } else if (url.endsWith('.jpg') || url.endsWith('.jpeg')) {
        ext = 'jpg';
      } else if (url.endsWith('.ico')) {
        ext = 'ico';
      }

      const buffer = await response.arrayBuffer();

      // Limit file size to 1MB
      if (buffer.byteLength > 1024 * 1024) {
        console.error(`Icon file too large: ${url}`);
        return null;
      }

      const iconPath = path.join(this.iconsDir, `${hash}.${ext}`);
      fs.writeFileSync(iconPath, Buffer.from(buffer));

      // Update manifest
      this.manifest[url] = hash;
      this.saveManifest();

      return `/icons/${hash}.${ext}`;
    } catch (error) {
      console.error(`Error downloading icon ${url}:`, error);
      return null;
    }
  }

  async updateServiceIcons(services: Array<{ icon?: string }>): Promise<void> {
    const downloadPromises = services
      .filter(s => s.icon)
      .map(s => this.downloadIcon(s.icon!));

    await Promise.all(downloadPromises);
  }
}
