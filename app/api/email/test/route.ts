import { NextRequest, NextResponse } from 'next/server';

const SMTP_API_URL = process.env.NEXT_PUBLIC_SMTP_URL || 'https://smtp.theholylabs.com';

export async function POST(request: NextRequest) {
  try {
    const { to, subject, content, templateId, variables, type, projectId } = await request.json();

    // Validate required fields
    if (!to) {
      return NextResponse.json(
        { error: 'Missing required field: to' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    let result;

    if (templateId) {
      // Send email using Firebase template
      try {
        const response = await fetch(`${SMTP_API_URL}/api/email/send-template`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            template_id: templateId,
            to_email: to,
            variables: variables || {},
            project_id: projectId
          }),
        });

        if (!response.ok) {
          throw new Error(`SMTP service error: ${response.status}`);
        }

        result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to send email');
        }

        console.log('Test email sent successfully using Firebase template:', {
          to,
          templateId,
          variables,
          templateName: result.template_name
        });

      } catch (error) {
        console.error('Error sending email via SMTP service:', error);
        throw error;
      }
    } else {
      // Fallback: Send email with provided content (for backward compatibility)
      if (!content) {
        return NextResponse.json(
          { error: 'Missing required field: content (when templateId is not provided)' },
          { status: 400 }
        );
      }

      // For now, simulate sending the email
      console.log('Test email would be sent (simulated):', {
        to,
        subject: subject || 'No subject',
        content: content.substring(0, 100) + '...',
        variables,
        type
      });

      // Simulate successful email sending
      result = {
        messageId: `test-${Date.now()}`,
        success: true
      };

      console.log('Test email sent successfully (simulated):', {
        to,
        subject: subject || 'Test Email',
        variables,
        type
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: result.messageId || result.template_id || 'test-message-id',
      templateName: result.template_name
    });

  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send test email' },
      { status: 500 }
    );
  }
}
