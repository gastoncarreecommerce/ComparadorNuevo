import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request) {
  try {
    const { title, descriptions, specs } = await request.json();
    
    // Leemos la clave desde Vercel
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: 'Falta configurar GOOGLE_API_KEY en Vercel' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Prompt optimizado para E-commerce
    const prompt = `
      Eres un experto Copywriter de E-commerce.
      Crea una descripción de producto HTML optimizada para vender el siguiente artículo: "${title}".
      
      Usa esta información recopilada de varias tiendas:
      ${descriptions.filter(d => d && d.length > 10).map(d => `- ${d.substring(0, 500)}...`).join('\n')}
      
      Y estas especificaciones técnicas:
      ${JSON.stringify(specs)}
      
      Estructura de respuesta requerida (solo HTML, sin markdown, sin <html>):
      <h2>[Título Persuasivo]</h2>
      <p>[Párrafo de introducción enfocado en beneficios y dolor del cliente]</p>
      <h3>Características Principales</h3>
      <ul>
        <li>[Beneficio 1]</li>
        <li>[Beneficio 2]</li>
        <li>[Beneficio 3]</li>
      </ul>
      <h3>Especificaciones</h3>
      [Tabla HTML simple con las 5 specs más importantes]
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({ result: text });

  } catch (error) {
    console.error("Error IA:", error);
    return NextResponse.json({ error: 'Error generando descripción' }, { status: 500 });
  }
}
