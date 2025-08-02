import { type PrismaClient } from "@prisma/client";

type ServiceContext = {
  db: PrismaClient;
  user: { userId: string | null; };
  headers: Headers;
};

export const feedbackService = {
  async updateInteractionFeedback(
    ctx: ServiceContext,
    input: {
      interactionId: string;
      rating?: number;
      helpful?: boolean;
      feedback?: string;
    }
  ) {
    return await ctx.db.aiInteraction.update({
      where: { 
        id: input.interactionId,
        userId: ctx.user.userId! // Ensure user can only update their own interactions
      },
      data: {
        rating: input.rating,
        helpful: input.helpful,
        feedback: input.feedback,
        updatedAt: new Date(),
      }
    });
  },

  async updateCodeGenerationFeedback(
    ctx: ServiceContext,
    input: {
      codeGenerationId: string;
      satisfaction?: number;
      applied?: boolean;
      modified?: boolean;
    }
  ) {
    return await ctx.db.codeGeneration.update({
      where: { 
        id: input.codeGenerationId,
        userId: ctx.user.userId! // Ensure user can only update their own code generations
      },
      data: {
        satisfaction: input.satisfaction,
        applied: input.applied,
        modified: input.modified,
        updatedAt: new Date(),
      }
    });
  },

  async createAiInteraction(
    ctx: ServiceContext,
    input: {
      projectId: string;
      intent: string;
      query: string;
      confidence?: number;
      contextFiles?: any;
      metadata?: any;
      responseType?: string;
      responseTime?: number;
      success?: boolean;
      tokenCount?: number;
      modelUsed?: string;
    }
  ) {
    return await ctx.db.aiInteraction.create({
      data: {
        projectId: input.projectId,
        userId: ctx.user.userId!,
        intent: input.intent,
        query: input.query,
        confidence: input.confidence,
        contextFiles: input.contextFiles,
        metadata: input.metadata,
        responseType: input.responseType,
        responseTime: input.responseTime,
        success: input.success ?? true,
        tokenCount: input.tokenCount,
        modelUsed: input.modelUsed,
      }
    });
  },

  async createCodeGeneration(
    ctx: ServiceContext,
    input: {
      projectId: string;
      prompt: string;
      intent: string;
      requirements?: any;
      contextFiles?: any;
      generatedCode?: string;
      filename?: string;
      language?: string;
      complexity?: number;
      linesOfCode?: number;
      modelUsed?: string;
      tokenCount?: number;
      generationTime?: number;
      timesSaved?: number;
    }
  ) {
    return await ctx.db.codeGeneration.create({
      data: {
        projectId: input.projectId,
        userId: ctx.user.userId!,
        prompt: input.prompt,
        intent: input.intent,
        requirements: input.requirements,
        contextFiles: input.contextFiles,
        generatedCode: input.generatedCode,
        filename: input.filename,
        language: input.language,
        complexity: input.complexity,
        linesOfCode: input.linesOfCode,
        modelUsed: input.modelUsed,
        tokenCount: input.tokenCount,
        generationTime: input.generationTime,
        timesSaved: input.timesSaved,
      }
    });
  }
};