import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: { attachmentId: string } }
) {
  try {
    const { attachmentId } = params;

    if (!attachmentId) {
      return NextResponse.json(
        { error: 'Attachment ID is required' },
        { status: 400 }
      );
    }

    // Get attachment from Firestore
    const attachmentRef = doc(db, 'attachments', attachmentId);
    const attachmentDoc = await getDoc(attachmentRef);

    if (!attachmentDoc.exists()) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      );
    }

    const attachmentData = attachmentDoc.data();

    return NextResponse.json({
      success: true,
      attachment: {
        id: attachmentData.id,
        filename: attachmentData.filename,
        content_type: attachmentData.content_type,
        size: attachmentData.size,
        content: attachmentData.content, // Base64 encoded content
        projectId: attachmentData.projectId,
        uploadedAt: attachmentData.uploadedAt
      }
    });

  } catch (error) {
    console.error('Error fetching attachment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attachment' },
      { status: 500 }
    );
  }
}
