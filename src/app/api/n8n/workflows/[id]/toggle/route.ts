import { NextRequest, NextResponse } from 'next/server';
import { verifyN8nApiKey } from '@/lib/webhook-verification';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!verifyN8nApiKey(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !['active', 'inactive'].includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status. Must be "active" or "inactive"' 
      }, { status: 400 });
    }

    // In production, you would update the workflow status via n8n API
    // const n8nApiUrl = process.env.N8N_API_BASE_URL || 'http://localhost:5678/api/v1';
    // const response = await fetch(`${n8nApiUrl}/workflows/${id}`, {
    //   method: 'PATCH',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.N8N_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({ active: status === 'active' }),
    // });

    // Mock response
    console.log(`Workflow ${id} status changed to: ${status}`);

    return NextResponse.json({ 
      success: true, 
      message: `Workflow ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
      workflowId: id,
      status 
    });
  } catch (error) {
    console.error('Error toggling workflow:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
