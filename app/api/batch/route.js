import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DOMAIN_MAP = {
  carrefourar: 'https://www.carrefour.com.ar',
  fravega: 'https://www.fravega.com',
  aremsaprod: 'https://www.oncity.com',
  jumboargentinaio: 'https://www.jumbo.com.ar',
};

function escapeCsv(value = '') {
  const text = String(value ?? '').replace(/\r?\n|\r/g, ' ').trim();
  return `"${text.replace(/"/g, '""')}"`;
}

function stripHtml(html = '') {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildMergedDescription({ title = '', descriptions = [] }) {
  const clean = descriptions
    .map(stripHtml)
    .filter(Boolean)
    .map((d) => d.replace(/\s+/g, ' ').trim());

  if (!clean.length) return '';

  const sentencePool = [];
  for (const text of clean) {
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20 && s.length < 280);
    sentencePool.push(...sentences);
  }

  const unique = [];
  const seen = new Set();
  for (const s of sentencePool) {
    const key = s.toLowerCase().replace(/[^a-z0-9áéíóúñü ]/gi, '').replace(/\s+/g, ' ').trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(s);
  }

  let merged = unique.slice(0, 4).join(' ');
  if (!merged) merged = clean.sort((a, b) => b.length - a.length)[0] || '';

  if (title && !merged.toLowerCase().includes(title.toLowerCase())) {
    merged = `${title}. ${merged}`.trim();
  }

  return merged.slice(0, 900);
}

function parseCsvLine(line, separator) {
  const out = [];
  let curr = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        curr += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === separator && !inQuotes) {
      out.push(curr);
      curr = '';
      continue;
    }

    curr += ch;
  }

  out.push(curr);
  return out.map((v) => v.trim());
}

function detectSeparator(firstLine = '') {
  const candidates = [',', ';', '\t'];
  let best = ',';
  let bestCount = -1;

  for (const sep of candidates) {
    const count = (firstLine.match(new RegExp(`\\${sep}`, 'g')) || []).length;
    if (count > bestCount) {
      bestCount = count;
      best = sep;
    }
  }

  return best;
}

function extractEansFromCsv(csvText = '') {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];

  const separator = detectSeparator(lines[0]);
  const header = parseCsvLine(lines[0], separator).map((h) => h.toLowerCase());
  const eanHeaderIndex = header.findIndex((h) => /^(ean|gtin|barcode|codigo|c[oó]digo)$/.test(h));

  const startAt = eanHeaderIndex >= 0 ? 1 : 0;
  const eans = [];

  for (let i = startAt; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i], separator);

    // 1) Si hay columna ean reconocida, priorizarla
    if (eanHeaderIndex >= 0) {
      const raw = (cols[eanHeaderIndex] || '').replace(/[^0-9]/g, '');
      if (raw.length >= 8 && raw.length <= 14) {
        eans.push(raw);
        continue;
      }
    }

    // 2) Fallback: buscar un EAN válido en cualquier columna
    for (const col of cols) {
      const raw = String(col || '').replace(/[^0-9]/g, '');
      if (raw.length >= 8 && raw.length <= 14) {
        eans.push(raw);
        break;
      }
    }
  }

  return [...new Set(eans)];
}

async function fetchVtexProduct(accountName, ean) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const headers = {
      Accept: 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };

    if (accountName.includes('jumbo')) {
      headers['X-Requested-With'] = 'XMLHttpRequest';
    }

    let url = `https://${accountName}.vtexcommercestable.com.br/api/catalog_system/pub/products/search?fq=alternateIds_Ean:${ean}`;
    let res = await fetch(url, { headers, signal: controller.signal });

    let data = [];
    if (res.ok) {
      data = await res.json();
    } else {
      url = `https://${accountName}.vtexcommercestable.com.br/api/catalog_system/pub/products/search?ft=${ean}`;
      res = await fetch(url, { headers, signal: controller.signal });
      if (res.ok) data = await res.json();
    }

    clearTimeout(timeoutId);

    if (Array.isArray(data) && data.length > 0) {
      const item = data[0];
      const offer = item.items?.[0]?.sellers?.[0]?.commertialOffer;

      let specs = {};
      if (item.allSpecifications) {
        item.allSpecifications.forEach((specName) => {
          if (item[specName]?.[0]) specs[specName] = item[specName][0];
        });
      }

      let description = item.description || item.metaTagDescription || '';
      if (!description || description.length < 20) {
        const hiddenFields = ['Descripción', 'Descripcion', 'Marketing', 'Presentación', 'Caracteristicas generales', 'General'];
        for (const field of hiddenFields) {
          if (specs[field]) {
            description = specs[field];
            break;
          }
          if (item[field] && item[field][0]) {
            description = item[field][0];
            break;
          }
        }
      }

      let publicLink = item.link;
      const domain = DOMAIN_MAP[accountName];
      if (domain && item.link) {
        try {
          publicLink = `${domain}${new URL(item.link).pathname}`;
        } catch {}
      }

      return {
        found: true,
        title: item.productName || '',
        price: offer?.Price || 0,
        description: description || '',
        link: publicLink || '',
      };
    }

    return { found: false, title: '', price: 0, description: '', link: '' };
  } catch {
    return { found: false, title: '', price: 0, description: '', link: '' };
  }
}

export async function POST(request) {
  try {
    const form = await request.formData();
    const file = form.get('file');

    if (!file || typeof file.text !== 'function') {
      return NextResponse.json({ error: 'Tenés que subir un CSV en el campo file.' }, { status: 400 });
    }

    const csvText = await file.text();
    const eans = extractEansFromCsv(csvText);

    if (!eans.length) {
      return NextResponse.json({
        error: 'No encontré EANs válidos en el CSV.',
        hint: 'Usá el template en /api/batch-template (columna ean) o incluí un EAN de 8 a 14 dígitos en alguna columna.'
      }, { status: 400 });
    }

    const rows = [];
    for (const ean of eans) {
      const [carrefour, fravega, oncity, jumbo] = await Promise.all([
        fetchVtexProduct('carrefourar', ean),
        fetchVtexProduct('fravega', ean),
        fetchVtexProduct('aremsaprod', ean),
        fetchVtexProduct('jumboargentinaio', ean),
      ]);

      const mergedDescription = buildMergedDescription({
        title: carrefour.title || fravega.title || oncity.title || jumbo.title || '',
        descriptions: [carrefour.description, fravega.description, oncity.description, jumbo.description],
      });

      rows.push({ ean, carrefour, fravega, oncity, jumbo, mergedDescription });
    }

    const header = [
      'ean',
      'carrefour_title', 'carrefour_description',
      'fravega_title', 'fravega_description',
      'oncity_title', 'oncity_description',
      'jumbo_title', 'jumbo_description',
      'descripcion_unificada',
    ];

    const lines = [header.map(escapeCsv).join(',')];

    for (const row of rows) {
      lines.push([
        row.ean,
        row.carrefour.title,
        row.carrefour.description,
        row.fravega.title,
        row.fravega.description,
        row.oncity.title,
        row.oncity.description,
        row.jumbo.title,
        row.jumbo.description,
        row.mergedDescription,
      ].map(escapeCsv).join(','));
    }

    const outCsv = lines.join('\n');

    return new NextResponse(outCsv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="descripciones-vtex.csv"',
      },
    });
  } catch (e) {
    return NextResponse.json({ error: 'Error procesando CSV', details: e.message }, { status: 500 });
  }
}
