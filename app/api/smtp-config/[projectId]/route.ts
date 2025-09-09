import { NextRequest, NextResponse } from 'next/server';

const SMTP_API_URL = process.env.NEXT_PUBLIC_SMTP_URL || 'https://smtp.theholylabs.com';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${SMTP_API_URL}/api/smtp-config/${projectId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({
          success: false,
          error: 'No SMTP configuration found for this project'
        }, { status: 404 });
      }
      throw new Error(`SMTP service error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching SMTP config:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch SMTP configuration' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const body = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${SMTP_API_URL}/api/smtp-config/${projectId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `SMTP service error: ${response.status}`;
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
      } catch {
        // Use default error message if parsing fails
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error saving SMTP config:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save SMTP configuration' },
      { status: 500 }
    );
  }
}
