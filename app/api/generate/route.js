import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Falta API Key en Vercel' }, { status: 500 });
    }

    const body = await request.json();
    const { title, descriptions, specs } = body;

    const prompt = `
      Actúa como experto en E-commerce.
      Crea una descripción HTML (solo el contenido div, sin markdown) para: "${title || 'Producto'}".
      
      Info base:
      ${descriptions?.filter(d => d).join('\n') || ''}
      
      Specs:
      ${JSON.stringify(specs)}

      Estructura requerida:
      <h2>[Título Persuasivo]</h2>
      <p>[Intro]</p>
      <h3>Características</h3>
      <ul><li>...</li></ul>
    `;

    // CAMBIO DEFINITIVO: Usamos el modelo que SI tienes en tu lista: 'gemini-2.5-flash'
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        })
    });

    const data = await response.json();

    if (!response.ok) {
        console.error("Error Google API:", data);
        return NextResponse.json({ 
            error: 'Error de Google', 
            details: data.error?.message || JSON.stringify(data)
        }, { status: response.status });
    }

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
        return NextResponse.json({ error: 'La IA no devolvió texto.' }, { status: 500 });
    }

    return NextResponse.json({ result: generatedText });

  } catch (error) {
    console.error("Error Servidor:", error);
    return NextResponse.json({ 
        error: 'Error interno', 
        details: error.message 
    }, { status: 500 });
  }
}
