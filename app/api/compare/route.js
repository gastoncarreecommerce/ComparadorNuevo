import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ean = searchParams.get('ean');

  if (!ean) return NextResponse.json({ error: 'Falta EAN' }, { status: 400 });

  try {
    const VTEX_KEY = process.env.VTEX_APP_KEY;
    const VTEX_TOKEN = process.env.VTEX_APP_TOKEN;
    
    // Usamos un timeout para que si una API tarda mucho, no trabe todo
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const [meliRes, vtexRes] = await Promise.allSettled([
      fetch(`https://api.mercadolibre.com/sites/MLA/search?q=${ean}&limit=1`, { signal: controller.signal }),
      fetch(`https://carrefourar.vtexcommercestable.com.br/api/catalog_system/pub/products/search?fq=Gtin:${ean}`, {
        headers: { 
            'X-VTEX-API-AppKey': VTEX_KEY || '', 
            'X-VTEX-API-AppToken': VTEX_TOKEN || '',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        signal: controller.signal
      })
    ]);
    clearTimeout(timeout);

    // Procesar MeLi con seguridad
    let meli = { found: false };
    if (meliRes.status === 'fulfilled' && meliRes.value.ok) {
        const data = await meliRes.value.json();
        if (data.results && data.results.length > 0) {
            const item = data.results[0];
            meli = { 
                found: true, 
                title: item.title || 'Sin título', 
                price: item.price || 0, 
                thumbnail: item.thumbnail || '',
                permalink: item.permalink || '#' 
            };
        }
    }

    // Procesar Carrefour con seguridad extrema
    let carrefour = { found: false };
    if (vtexRes.status === 'fulfilled' && vtexRes.value.ok) {
        const data = await vtexRes.value.json();
        if (Array.isArray(data) && data.length > 0) {
            const item = data[0];
            const price = item.items?.[0]?.sellers?.[0]?.commertialOffer?.Price || 0;
            const img = item.items?.[0]?.images?.[0]?.imageUrl || '';
            carrefour = { 
                found: true, 
                title: item.productName || 'Producto VTEX', 
                price: price, 
                thumbnail: img,
                permalink: item.linkText || '#' 
            };
        }
    }

    return NextResponse.json({ meli, carrefour });

  } catch (e) {
    console.error("Error en el servidor:", e);
    // Devolvemos una estructura válida aunque haya error para que el Front no explote
    return NextResponse.json({ 
        meli: { found: false }, 
        carrefour: { found: false },
        error: e.message 
    });
  }
}
