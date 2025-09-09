import { NextRequest, NextResponse } from 'next/server';
import { generateOTPCode } from '@/lib/api';

const SMTP_API_URL = process.env.NEXT_PUBLIC_SMTP_URL || 'https://smtp.theholylabs.com';

export async function POST(request: NextRequest) {
  try {
    const { 
      templateId, 
      triggerRoute, 
      to, 
      variables = {}, 
      projectId,
      attachments = []
    } = await request.json();

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

    // Fetch attachment content if attachments are provided
    let attachmentData = [];
    if (attachments && attachments.length > 0) {
      try {
        for (const attachmentId of attachments) {
          const attachmentResponse = await fetch(`${request.nextUrl.origin}/api/attachments/${attachmentId}`);
          if (attachmentResponse.ok) {
            const attachmentResult = await attachmentResponse.json();
            if (attachmentResult.success) {
              // Fetch file content from Storage URL
              const fileResponse = await fetch(attachmentResult.attachment.downloadURL);
              if (fileResponse.ok) {
                const fileBuffer = await fileResponse.arrayBuffer();
                const base64Content = Buffer.from(fileBuffer).toString('base64');
                
                attachmentData.push({
                  id: attachmentResult.attachment.id,
                  filename: attachmentResult.attachment.filename,
                  content_type: attachmentResult.attachment.content_type,
                  size: attachmentResult.attachment.size,
                  content: base64Content,
                  url: attachmentResult.attachment.downloadURL
                });
              } else {
                console.error(`Failed to fetch file content for ${attachmentResult.attachment.filename}`);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching attachments:', error);
        // Continue without attachments if fetching fails
      }
    }

    if (templateId) {
      // Check if template requires OTP code and generate if needed
      if (templateId && variables && 'otp_code' in variables && variables.otp_code === '{otp_code}') {
        // Generate OTP code if placeholder is present
        variables.otp_code = generateOTPCode();
        console.log('Generated OTP code:', variables.otp_code);
      }
      
      // Send email using template ID (most flexible method)
      try {
        const response = await fetch(`${SMTP_API_URL}/api/email/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            template_id: templateId,
            to_email: to,
            variables: variables,
            project_id: projectId,
            attachments: attachmentData
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

        console.log('Email sent successfully using template ID:', {
          to,
          templateId,
          variables,
          templateName: result.template_name
        });

      } catch (error) {
        console.error('Error sending email via SMTP service:', error);
        throw error;
      }
    } else if (triggerRoute) {
      // Send email using trigger route
      try {
        const response = await fetch(`${SMTP_API_URL}/api/email/send-by-route`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            trigger_route: triggerRoute,
            to_email: to,
            variables: variables,
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

        console.log('Email sent successfully using trigger route:', {
          to,
          triggerRoute,
          variables,
          templateName: result.template_name
        });

      } catch (error) {
        console.error('Error sending email via SMTP service:', error);
        throw error;
      }
    } else {
      return NextResponse.json(
        { error: 'Either templateId or triggerRoute is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      messageId: result.messageId || result.template_id || 'email-message-id',
      templateName: result.template_name
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    );
  }
}
