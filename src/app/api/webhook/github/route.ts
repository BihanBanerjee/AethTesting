// src/app/api/webhook/github/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { WebhookProcessor, verifyGitHubSignature } from '@/lib/webhooks';

interface GitHubWebhookPayload {
  action: string;
  repository: {
    full_name: string;
    html_url: string;
    default_branch: string;
  };
  commits?: Array<{
    id: string;
    message: string;
    author: {
      name: string;
      email: string;
    };
    added: string[];
    removed: string[];
    modified: string[];
    timestamp: string;
  }>;
  head_commit?: {
    id: string;
    message: string;
    author: {
      name: string;
      email: string;
    };
    added: string[];
    removed: string[];
    modified: string[];
    timestamp: string;
  };
  ref?: string;
  before?: string;
  after?: string;
  pull_request?: {
    number: number;
    title: string;
    state: string;
    merged: boolean;
    base: {
      ref: string;
    };
    head: {
      ref: string;
    };
  };
  release?: {
    name: string;
    tag_name: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-hub-signature-256');
    const event = req.headers.get('x-github-event');
    
    // Verify signature
    if (!signature || !verifyGitHubSignature(body, signature)) {
      console.error('Invalid GitHub webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload: GitHubWebhookPayload = JSON.parse(body);
    
    console.log(`📨 Received GitHub webhook: ${event} for ${payload.repository.full_name}`);

    // Find projects associated with this repository
    const projects = await WebhookProcessor.getProjectsForRepository(payload.repository.html_url);

    if (projects.length === 0) {
      console.log(`No projects found for repository: ${payload.repository.html_url}`);
      return NextResponse.json({ message: 'Repository not tracked' }, { status: 200 });
    }

    console.log(`Found ${projects.length} project(s) for repository ${payload.repository.full_name}`);

    // Handle different webhook events using the modular processor
    switch (event) {
      case 'push':
        await WebhookProcessor.handlePushEvent(payload, projects);
        break;
      
      case 'pull_request':
        await WebhookProcessor.handlePullRequestEvent(payload, projects);
        break;
      
      case 'repository':
        await WebhookProcessor.handleRepositoryEvent(payload, projects);
        break;
      
      case 'release':
        await WebhookProcessor.handleReleaseEvent(payload, projects);
        break;
      
      default:
        console.log(`ℹ️  Unhandled event type: ${event} - webhook received but no processing defined`);
    }

    console.log(`✅ Successfully processed ${event} webhook for ${payload.repository.full_name}`);
    return NextResponse.json({ 
      message: 'Webhook processed successfully',
      event,
      repository: payload.repository.full_name,
      projectsAffected: projects.length
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error processing GitHub webhook:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}