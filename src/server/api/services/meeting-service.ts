import { z } from "zod";
import { type PrismaClient } from "@prisma/client";

type ServiceContext = {
  db: PrismaClient;
  user: { userId: string | null; };
  headers: Headers;
};

export const meetingService = {
  async uploadMeeting(
    ctx: ServiceContext,
    input: {
      projectId: string;
      meetingUrl: string;
      name: string;
    }
  ) {
    const meeting = await ctx.db.meeting.create({
      data: {
        meetingUrl: input.meetingUrl,
        projectId: input.projectId,
        name: input.name,
        status: 'PROCESSING'
      }
    });
    return meeting;
  },

  async getMeetings(
    ctx: ServiceContext,
    input: {
      projectId: string;
    }
  ) {
    return await ctx.db.meeting.findMany({
      where: {
        projectId: input.projectId
      },
      include: {
        issues: true
      }
    });
  },

  async deleteMeeting(
    ctx: ServiceContext,
    input: {
      meetingId: string;
    }
  ) {
    // First delete all associated issues
    await ctx.db.issue.deleteMany({
      where: {
        meetingId: input.meetingId
      }
    });

    // Then delete the meeting
    return await ctx.db.meeting.delete({
      where: {
        id: input.meetingId
      }
    });
  },

  async getMeetingById(
    ctx: ServiceContext,
    input: {
      meetingId: string;
    }
  ) {
    return await ctx.db.meeting.findUnique({
      where: {
        id: input.meetingId
      },
      include: {
        issues: true
      }
    });
  }
};