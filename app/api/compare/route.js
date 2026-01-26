import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ean = searchParams.get('ean');

  if (!ean) return NextResponse.json({ found: false });

  try {
    const VTEX_KEY = process.env.VTEX_APP_KEY;
    const VTEX_TOKEN = process.env.VTEX_APP_TOKEN;

    // 1. Buscamos por EAN (Alternate ID)
    const response = await fetch(`https://carrefourar.vtexcommercestable.com.br/api/catalog_system/pub/products/search?fq=alternateIds_Ean:${ean}&sc=1`, {
      headers: { 
        'X-VTEX-API-AppKey': VTEX_KEY, 
        'X-VTEX-API-AppToken': VTEX_TOKEN,
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) return NextResponse.json({ found: false });

    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      const item = data[0];
      
      // --- LOGICA DE ESPECIFICACIONES ---
      let specs = {};
      if (item.allSpecifications && Array.isArray(item.allSpecifications)) {
        item.allSpecifications.forEach(specName => {
            if (item[specName] && item[specName].length > 0) {
                specs[specName] = item[specName][0];
            }
        });
      }

      // --- LOGICA DE DESCRIPCIÓN ---
      // Priorizamos la descripción HTML rica. Si está vacía, usamos la metaTagDescription (SEO).
      const rawDescription = item.description && item.description !== "" 
                             ? item.description 
                             : item.metaTagDescription;

      const offer = item.items?.[0]?.sellers?.[0]?.commertialOffer;
      
      if (offer) {
        return NextResponse.json({
          found: true,
          title: item.productName,
          price: offer.Price,
          thumbnail: item.items[0].images[0].imageUrl,
          link: item.link,
          description: rawDescription, // <--- Aquí enviamos el texto SEO/HTML
          specs: specs 
        });
      }
    }

    return NextResponse.json({ found: false });

  } catch (e) {
    console.error(e);
    return NextResponse.json({ found: false, error: e.message });
  }
}
