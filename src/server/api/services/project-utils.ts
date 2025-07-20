import { type PrismaClient } from "@prisma/client";
import { checkCredits } from "@/lib/github";

type ServiceContext = {
  db: PrismaClient;
  user: { userId: string | null; };
  headers: Headers;
};

export const projectUtils = {
  async validateUserCredits(
    ctx: ServiceContext,
    githubUrl: string,
    githubToken?: string
  ) {
    const user = await ctx.db.user.findUnique({
      where: {
        id: ctx.user.userId!
      },
      select: {
        credits: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const currentCredits = user.credits || 0;
    const fileCount = await checkCredits(githubUrl, githubToken ?? '');
    
    if (currentCredits < fileCount) {
      throw new Error('Insufficient credits');
    }

    return { user, fileCount };
  },

  async getUserCredits(
    ctx: ServiceContext
  ) {
    return await ctx.db.user.findUnique({
      where: {
        id: ctx.user.userId!
      },
      select: {
        credits: true
      }
    });
  },

  async checkProjectFileCount(
    githubUrl: string,
    githubToken?: string
  ) {
    const fileCount = await checkCredits(githubUrl, githubToken ?? '');
    return fileCount;
  },

  async getProjectTeamMembers(
    ctx: ServiceContext,
    projectId: string
  ) {
    return await ctx.db.userToProject.findMany({
      where: {
        projectId
      },
      include: {
        user: true
      }
    });
  },

  async archiveProject(
    ctx: ServiceContext,
    projectId: string
  ) {
    return await ctx.db.project.update({
      where: {
        id: projectId
      },
      data: {
        deletedAt: new Date()
      }
    });
  },

  async deleteQuestion(
    ctx: ServiceContext,
    questionId: string
  ) {
    const question = await ctx.db.question.findUnique({
      where: {
        id: questionId
      },
      select: {
        userId: true
      }
    });

    if (!question) {
      throw new Error('Question not found');
    }

    if (question.userId !== ctx.user.userId) {
      throw new Error('Unauthorized: You can only delete your own questions');
    }

    return await ctx.db.question.delete({
      where: {
        id: questionId
      }
    });
  }
};