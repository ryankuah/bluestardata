import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Forward the request to BLS API
    const blsResponse = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!blsResponse.ok) {
      return NextResponse.json(
        { error: `BLS API responded with status: ${blsResponse.status}` },
        { status: blsResponse.status }
      );
    }

    const data = await blsResponse.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Healthcare data proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch healthcare data' },
      { status: 500 }
    );
  }
}