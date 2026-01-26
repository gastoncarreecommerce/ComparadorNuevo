import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ean = searchParams.get('ean');

  if (!ean) return NextResponse.json({ error: 'Falta EAN' }, { status: 400 });

  try {
    const VTEX_KEY = process.env.VTEX_APP_KEY;
    const VTEX_TOKEN = process.env.VTEX_APP_TOKEN;
    
    // Ejecutamos las dos peticiones a la vez
    const [meliRes, vtexRes] = await Promise.allSettled([
      fetch(`https://api.mercadolibre.com/sites/MLA/search?q=${ean}&limit=1`),
      fetch(`https://carrefourar.vtexcommercestable.com.br/api/catalog_system/pub/products/search?fq=Gtin:${ean}`, {
        headers: { 
            'X-VTEX-API-AppKey': VTEX_KEY, 
            'X-VTEX-API-AppToken': VTEX_TOKEN 
        }
      })
    ]);

    // Procesar MeLi
    let meli = { found: false };
    if (meliRes.status === 'fulfilled') {
        const data = await meliRes.value.json();
        if (data.results?.[0]) {
            meli = { found: true, ...data.results[0] };
        }
    }

    // Procesar Carrefour
    let carrefour = { found: false };
    if (vtexRes.status === 'fulfilled') {
        const data = await vtexRes.value.json();
        if (data?.[0]) {
            const item = data[0];
            const price = item.items[0]?.sellers?.[0]?.commertialOffer?.Price;
            carrefour = { 
                found: true, 
                title: item.productName, 
                price: price, 
                permalink: item.linkText 
            };
        }
    }

    return NextResponse.json({ meli, carrefour });

  } catch (e) {
    return NextResponse.json({ error: 'Error server' }, { status: 500 });
  }
}
