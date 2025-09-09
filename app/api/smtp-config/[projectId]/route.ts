import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

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

    // Get project data from Firebase
    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      return NextResponse.json({
        success: false,
        error: 'Project not found'
      }, { status: 404 });
    }

    const projectData = projectDoc.data();
    const smtpConfig = projectData?.smtpConfig;

    if (!smtpConfig) {
      return NextResponse.json({
        success: false,
        error: 'No SMTP configuration found for this project'
      }, { status: 404 });
    }

    // Remove sensitive data before sending
    const safeConfig = { ...smtpConfig };
    delete safeConfig.password;

    return NextResponse.json({
      success: true,
      config: safeConfig
    });

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

    // Validate required fields
    const requiredFields = ['host', 'port', 'username', 'password'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Get project data to get project name
    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const projectData = projectDoc.data();
    const projectName = projectData?.name || 'Email Service';

    // Prepare SMTP config
    const smtpConfig = {
      host: body.host,
      port: parseInt(body.port),
      secure: Boolean(body.secure),
      username: body.username,
      password: body.password,
      from_email: body.username, // Use username as from_email
      from_name: projectName, // Use project name as from_name
      updatedAt: new Date(),
      projectId: projectId,
      projectName: projectName,
      service: 'smtp-service'
    };

    // Update project document with SMTP config
    await updateDoc(projectRef, {
      smtpConfig: smtpConfig,
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'SMTP configuration saved successfully'
    });

  } catch (error) {
    console.error('Error saving SMTP config:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save SMTP configuration' },
      { status: 500 }
    );
  }
}
