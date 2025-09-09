import { NextRequest, NextResponse } from 'next/server';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';

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

    // Get fresh download URL from Firebase Storage
    let downloadURL = attachmentData.downloadURL;
    if (attachmentData.storagePath) {
      try {
        const storageRef = ref(storage, attachmentData.storagePath);
        downloadURL = await getDownloadURL(storageRef);
      } catch (error) {
        console.error('Error getting download URL:', error);
        return NextResponse.json(
          { error: 'File not found in storage' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      attachment: {
        id: attachmentData.id,
        filename: attachmentData.filename,
        content_type: attachmentData.content_type,
        size: attachmentData.size,
        downloadURL: downloadURL,
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
