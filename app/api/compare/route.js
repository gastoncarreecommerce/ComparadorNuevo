import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ean = searchParams.get('ean');

  if (!ean) return NextResponse.json({ found: false });

  try {
    const VTEX_KEY = process.env.VTEX_APP_KEY;
    const VTEX_TOKEN = process.env.VTEX_APP_TOKEN;

    // Buscamos por alternateIds_Ean que es la clave que confirmamos que funciona
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
      
      // --- LOGICA DE EXTRACCIÓN DE ESPECIFICACIONES ---
      let specs = {};
      
      // 1. Intentamos sacar especificaciones técnicas listadas en 'allSpecifications'
      if (item.allSpecifications && Array.isArray(item.allSpecifications)) {
        item.allSpecifications.forEach(specName => {
            // En VTEX, el valor de la spec viene en un array (ej: item['Envase Tipo'] = ['PET'])
            if (item[specName] && item[specName].length > 0) {
                specs[specName] = item[specName][0];
            }
        });
      }

      // 2. Construimos una descripción si la oficial viene vacía
      const description = item.description || item.metaTagDescription || item.productName;

      // 3. Precio
      const offer = item.items?.[0]?.sellers?.[0]?.commertialOffer;
      
      if (offer) {
        return NextResponse.json({
          found: true,
          title: item.productName,
          price: offer.Price,
          thumbnail: item.items[0].images[0].imageUrl,
          link: item.link,
          // Agregamos los nuevos datos al JSON de respuesta
          description: description,
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
