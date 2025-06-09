import { serverApi } from '@/services/serverApi';
import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for authenticated endpoints
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Force complete a mission (dev only)
 * @route POST /api/dev/missions/:id/force-complete
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { success: false, error: 'Not available in production' },
        { status: 403 }
      );
    }

    const response = await serverApi.post<{ success: boolean; data?: any }>(
      `/dev/missions/${id}/force-complete`
    );

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error('Error force completing mission:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to force complete mission',
      },
      { status: error.status || 500 }
    );
  }
}
