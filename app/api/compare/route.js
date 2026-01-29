import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DOMAIN_MAP = {
  'carrefourar': 'https://www.carrefour.com.ar',
  'fravega': 'https://www.fravega.com',
  'aremsaprod': 'https://www.oncity.com',
  'jumboargentinaio': 'https://www.jumbo.com.ar'
};

async function fetchVtexProduct(accountName, ean) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    // 1. HEADER BASE (OBLIGATORIO PARA TODOS):
    // Si no enviamos esto, VTEX bloquea con Error 403
    let headers = { 
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    // 2. HEADER ESPECIAL SOLO PARA JUMBO:
    // Jumbo necesita este extra para creer que es una navegación AJAX legítima.
    // NO se lo mandamos a Carrefour porque a veces oculta la descripción.
    if (accountName.includes('jumbo')) {
        headers['X-Requested-With'] = 'XMLHttpRequest';
    }

    // URL sin '&sc=1' para evitar errores de canal
    let url = `https://${accountName}.vtexcommercestable.com.br/api/catalog_system/pub/products/search?fq=alternateIds_Ean:${ean}`;
    
    let res = await fetch(url, { headers, signal: controller.signal });
    
    // Si falla la búsqueda exacta, probamos texto (Plan B)
    let data = [];
    if (res.ok) {
        data = await res.json();
    } else {
        // Si falló (403/404), intentamos el Plan B inmediatamente
        url = `https://${accountName}.vtexcommercestable.com.br/api/catalog_system/pub/products/search?ft=${ean}`;
        res = await fetch(url, { headers, signal: controller.signal });
        if (res.ok) data = await res.json();
    }
    
    clearTimeout(timeoutId);

    if (Array.isArray(data) && data.length > 0) {
      const item = data[0];
      
      let specs = {};
      if (item.allSpecifications) {
        item.allSpecifications.forEach(specName => {
            if (item[specName]?.[0]) specs[specName] = item[specName][0];
        });
      }

      // --- RESCATE DE DESCRIPCIÓN ---
      let description = item.description || item.metaTagDescription || "";
      
      // Si está vacía, buscamos en lugares comunes donde esconden el texto
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

      // Link público corregido
      let publicLink = item.link;
      const domain = DOMAIN_MAP[accountName];
      if (domain && item.link) {
          try { publicLink = `${domain}${new URL(item.link).pathname}`; } catch(e){}
      }

      const offer = item.items?.[0]?.sellers?.[0]?.commertialOffer;
      
      if (offer) {
        return {
          found: true,
          store: accountName,
          title: item.productName,
          price: offer.Price,
          thumbnail: item.items[0].images[0].imageUrl,
          link: publicLink,
          description: description,
          specs: specs
        };
      }
    }
    return { found: false, store: accountName };

  } catch (e) {
    console.error(`Error en ${accountName}:`, e.message);
    return { found: false, store: accountName };
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ean = searchParams.get('ean');

  if (!ean) return NextResponse.json({ error: 'Falta EAN' }, { status: 400 });

  const results = await Promise.all([
    fetchVtexProduct('carrefourar', ean),
    fetchVtexProduct('fravega', ean),
    fetchVtexProduct('aremsaprod', ean),
    fetchVtexProduct('jumboargentinaio', ean)
  ]);

  return NextResponse.json({
      carrefour: results[0],
      fravega: results[1],
      oncity: results[2],
      jumbo: results[3]
  });
}
