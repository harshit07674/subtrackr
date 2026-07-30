import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const catalogPath = path.join(__dirname, '../data/servicesCatalog.json');

let cachedCatalog = null;

async function loadCatalog() {
    if (!cachedCatalog) {
        const raw = await fs.readFile(catalogPath, 'utf-8');
        cachedCatalog = JSON.parse(raw);
    }
    return cachedCatalog;
}

export async function getCatalog(req, res) {
    try {
        const catalog = await loadCatalog();
        const { search, category, supportsUsageTracking } = req.query;

        let filtered = [...catalog];

        if (search) {
            const query = search.trim().toLowerCase();
            filtered = filtered.filter(item =>
                item.serviceName.toLowerCase().includes(query) ||
                item.category.toLowerCase().includes(query)
            );
        }

        if (category) {
            filtered = filtered.filter(item =>
                item.category.toLowerCase() === category.trim().toLowerCase()
            );
        }

        if (supportsUsageTracking !== undefined) {
            const isTrackingSupported = String(supportsUsageTracking) === 'true';
            filtered = filtered.filter(item => item.supportsUsageTracking === isTrackingSupported);
        }

        return res.status(200).json({
            success: true,
            count: filtered.length,
            catalog: filtered
        });
    } catch (e) {
        return res.status(500).json({
            success: false,
            message: `Internal server error loading catalog: ${e.message || e}`
        });
    }
}
