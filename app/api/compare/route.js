import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ean = searchParams.get('ean');

  if (!ean) return NextResponse.json({ found: false });

  try {
    const VTEX_KEY = process.env.VTEX_APP_KEY;
    const VTEX_TOKEN = process.env.VTEX_APP_TOKEN;

    // USAMOS LA LLAVE MAESTRA CONFIRMADA: alternateIds_Ean
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
      // Buscamos el precio dentro de la estructura de vendedores
      const offer = item.items?.[0]?.sellers?.[0]?.commertialOffer;
      
      if (offer && offer.Price > 0) {
        return NextResponse.json({
          found: true,
          title: item.productName,
          price: offer.Price,
          thumbnail: item.items[0].images[0].imageUrl,
          link: item.link
        });
      }
    }

    return NextResponse.json({ found: false });

  } catch (e) {
    console.error(e);
    return NextResponse.json({ found: false, error: e.message });
  }
}
