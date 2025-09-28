import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const SMTP_API_URL = process.env.NEXT_PUBLIC_SMTP_URL || 'https://smtp.theholylabs.com';

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const { testEmail } = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    if (!testEmail) {
      return NextResponse.json(
        { error: 'Test email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(testEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Get project SMTP config
    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const projectData = projectDoc.data();
    const smtpConfig = projectData?.smtpConfig;

    if (!smtpConfig) {
      return NextResponse.json(
        { error: 'No SMTP configuration found for this project' },
        { status: 404 }
      );
    }

    // Test SMTP connection by sending a test email
    try {
      const response = await fetch(`${SMTP_API_URL}/api/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          project_id: projectId,
          template_id: 'test-template', // We'll create a simple test template
          variables: {
            test_message: 'This is a test email to verify your SMTP configuration.',
            company_name: projectData.name || 'Your Company',
            test_time: new Date().toLocaleString()
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `SMTP test failed: ${response.status}`;
        
        if (response.status === 500) {
          if (errorText.includes('Username and Password not accepted')) {
            errorMessage = 'SMTP authentication failed. Please check your username and password.';
          } else if (errorText.includes('Connection refused')) {
            errorMessage = 'Cannot connect to SMTP server. Please check your host and port settings.';
          } else if (errorText.includes('timeout')) {
            errorMessage = 'SMTP connection timed out. Please check your network connection and server settings.';
          } else {
            errorMessage = 'SMTP server error. Please check your configuration.';
          }
        } else if (response.status === 502) {
          errorMessage = 'SMTP service is unavailable. Please try again later.';
        } else if (response.status === 504) {
          errorMessage = 'SMTP connection timed out. This might be due to incorrect server settings or network issues.';
        }
        
        return NextResponse.json({
          success: false,
          error: errorMessage,
          details: errorText
        }, { status: 500 });
      }

      const result = await response.json();
      
      if (!result.success) {
        return NextResponse.json({
          success: false,
          error: result.error || 'Failed to send test email',
          details: result
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'SMTP configuration test successful! Test email sent.',
        smtpConfig: {
          host: smtpConfig.host,
          port: smtpConfig.port,
          secure: smtpConfig.secure,
          username: smtpConfig.username,
          // Don't return password for security
        }
      });

    } catch (error) {
      console.error('Error testing SMTP configuration:', error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to test SMTP configuration'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in SMTP test:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to test SMTP configuration' },
      { status: 500 }
    );
  }
}
