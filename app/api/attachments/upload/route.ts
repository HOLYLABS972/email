import { NextRequest, NextResponse } from 'next/server';
import { db, storage } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const projectId = formData.get('projectId') as string;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    const uploadedAttachments = [];

    for (const file of files) {
      try {
        // Create attachment ID
        const attachmentId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Upload file to Firebase Storage
        const storageRef = ref(storage, `attachments/${projectId}/${attachmentId}`);
        const fileBuffer = await file.arrayBuffer();
        const fileUint8Array = new Uint8Array(fileBuffer);
        
        // Upload to Firebase Storage
        const snapshot = await uploadBytes(storageRef, fileUint8Array, {
          contentType: file.type,
          customMetadata: {
            originalName: file.name,
            projectId: projectId
          }
        });

        // Get download URL
        const downloadURL = await getDownloadURL(snapshot.ref);

        // Create attachment metadata for Firestore
        const attachmentData = {
          id: attachmentId,
          filename: file.name,
          content_type: file.type,
          size: file.size,
          projectId: projectId,
          uploadedAt: new Date(),
          storagePath: `attachments/${projectId}/${attachmentId}`,
          downloadURL: downloadURL
        };

        // Save metadata to Firestore
        const attachmentRef = doc(db, 'attachments', attachmentId);
        await setDoc(attachmentRef, attachmentData);

        uploadedAttachments.push({
          id: attachmentId,
          filename: file.name,
          content_type: file.type,
          size: file.size,
          url: downloadURL
        });

      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        // Continue with other files even if one fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `${uploadedAttachments.length} file(s) uploaded successfully`,
      attachments: uploadedAttachments
    });

  } catch (error) {
    console.error('Error uploading attachments:', error);
    return NextResponse.json(
      { error: 'Failed to upload attachments' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const attachmentId = searchParams.get('attachmentId');

    if (attachmentId) {
      // Get specific attachment
      const attachmentRef = doc(db, 'attachments', attachmentId);
      const attachmentDoc = await getDoc(attachmentRef);

      if (!attachmentDoc.exists()) {
        return NextResponse.json(
          { error: 'Attachment not found' },
          { status: 404 }
        );
      }

      const attachmentData = attachmentDoc.data();
      // Remove the actual content for security, only return metadata
      const { content, ...metadata } = attachmentData;

      return NextResponse.json({
        success: true,
        attachment: metadata
      });
    }

    if (projectId) {
      // Get all attachments for a project
      // Note: This would require a more complex query in a real implementation
      return NextResponse.json({
        success: true,
        message: 'Use attachmentId to get specific attachment'
      });
    }

    return NextResponse.json(
      { error: 'Project ID or Attachment ID is required' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error fetching attachments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attachments' },
      { status: 500 }
    );
  }
}
