import { NextRequest, NextResponse } from 'next/server';
import { generateOTPCode } from '@/lib/api';

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

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing required field: projectId' },
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
      // Check if template requires OTP code and generate if needed
      if (variables && 'otp_code' in variables && variables.otp_code === '{otp_code}') {
        // Generate OTP code if placeholder is present
        variables.otp_code = generateOTPCode();
        console.log('Generated OTP code for test email:', variables.otp_code);
      }
      
      // Send email using Firebase template via SMTP service
      try {
        const response = await fetch(`${SMTP_API_URL}/api/email/send`, {
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
          const errorText = await response.text();
          let errorMessage = `SMTP service error: ${response.status}`;
          
          // Handle specific error cases
          if (response.status === 500) {
            if (errorText.includes('Username and Password not accepted')) {
              errorMessage = 'SMTP authentication failed. Please check your SMTP credentials in the settings.';
            } else if (errorText.includes('DatetimeWithNanoseconds')) {
              errorMessage = 'Template data error. Please try again or contact support.';
            } else {
              errorMessage = 'SMTP service error. Please check your configuration.';
            }
          } else if (response.status === 502) {
            errorMessage = 'SMTP service is unavailable. Please try again later.';
          }
          
          throw new Error(errorMessage);
        }

        result = await response.json();
        
        if (!result.success) {
          // Handle specific error messages from the SMTP service
          let errorMessage = result.error || 'Failed to send email';
          
          if (result.error && result.error.includes('Username and Password not accepted')) {
            errorMessage = 'SMTP authentication failed. Please check your SMTP credentials in the settings.';
          } else if (result.error && result.error.includes('DatetimeWithNanoseconds')) {
            errorMessage = 'Template data error. Please try again or contact support.';
          }
          
          throw new Error(errorMessage);
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
      // Send email with provided content via SMTP service
      if (!content) {
        return NextResponse.json(
          { error: 'Missing required field: content (when templateId is not provided)' },
          { status: 400 }
        );
      }

      try {
        const response = await fetch(`${SMTP_API_URL}/api/email/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to_email: to,
            subject: subject || 'Test Email',
            content: content,
            variables: variables || {}
          }),
        });

        if (!response.ok) {
          throw new Error(`SMTP service error: ${response.status}`);
        }

        result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to send email');
        }

        console.log('Test email sent successfully:', {
          to,
          subject: subject || 'Test Email',
          variables,
          type
        });

      } catch (error) {
        console.error('Error sending email via SMTP service:', error);
        throw error;
      }
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
