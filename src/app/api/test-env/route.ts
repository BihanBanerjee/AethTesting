// // src/app/api/test-env/route.ts - App Router version
// import { NextRequest, NextResponse } from 'next/server';

// export async function GET(request: NextRequest) {
//   try {
//     const hasApiKey = !!process.env.GEMINI_API_KEY;
//     const keyPreview = process.env.GEMINI_API_KEY ? 
//       `${process.env.GEMINI_API_KEY.substring(0, 8)}...` : 
//       'Not found';
      
//     return NextResponse.json({ 
//       hasApiKey, 
//       keyPreview,
//       nodeEnv: process.env.NODE_ENV,
//       timestamp: new Date().toISOString(),
//       // Additional debugging info
//       envVars: {
//         hasGeminiKey: hasApiKey,
//         nodeEnv: process.env.NODE_ENV,
//         platform: process.platform,
//         nodeVersion: process.version
//       }
//     });
//   } catch (error) {
//     console.error('Error in test-env API:', error);
//     return NextResponse.json(
//       { 
//         error: 'Failed to check environment variables',
//         hasApiKey: false,
//         keyPreview: 'Error occurred'
//       }, 
//       { status: 500 }
//     );
//   }
// }

// // Optional: Handle other HTTP methods with descriptive errors
// export async function POST() {
//   return NextResponse.json(
//     { error: 'POST method not supported for this endpoint' }, 
//     { status: 405 }
//   );
// }

// export async function PUT() {
//   return NextResponse.json(
//     { error: 'PUT method not supported for this endpoint' }, 
//     { status: 405 }
//   );
// }

// export async function DELETE() {
//   return NextResponse.json(
//     { error: 'DELETE method not supported for this endpoint' }, 
//     { status: 405 }
//   );
// }