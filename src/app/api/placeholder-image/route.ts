import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text') || 'Mock';
    
    // Criar uma imagem SVG simples como placeholder
    const svg = `
        <svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
            <rect width="150" height="150" fill="#374151"/>
            <text x="75" y="75" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="14" dy="0.3em">
                ${text}
            </text>
            <text x="75" y="95" text-anchor="middle" fill="#9ca3af" font-family="Arial, sans-serif" font-size="10" dy="0.3em">
                Image
            </text>
        </svg>
    `;
    
    return new NextResponse(svg, {
        headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=86400'
        }
    });
}
