import { inngest } from "../../client";
import { checkTranscriptionStatus, retrieveTranscriptionResults, submitMeetingForProcessing } from "@/lib/assembly";
import { db } from "@/server/db";

interface MeetingEventData {
  meetingUrl: string;
  meetingId: string;
  userId: string;
  projectId?: string; // Optional: for additional project validation
}

interface MeetingEvent {
  data: MeetingEventData;
}

interface InngestStep {
  run: <T>(id: string, fn: () => Promise<T>) => Promise<T>;
  sleep: (id: string, duration: string) => Promise<void>;
}

export const processMeetingFunction = inngest.createFunction(
  {
    id: "aetheria-process-meeting",
    name: "Aetheria: Process Meeting Recording", 
    retries: 1,
    concurrency: {
      limit: 3,
      key: "event.data.userId",
    },
  },
  { event: "meeting.processing.requested" },
  async ({ event, step }: { event: MeetingEvent; step: InngestStep }) => {
    const { meetingUrl, meetingId, userId, projectId } = event.data;

    try {
      console.log(`Starting to process meeting ${meetingId} for user ${userId}`);

      // Step 1: Validate meeting (< 10 seconds)
      const validationResult = await step.run("validate-meeting", async () => {
        const meeting = await db.meeting.findUnique({
          where: { id: meetingId },
          include: {
            project: {
              include: {
                userToProjects: {
                  where: { userId },
                  select: { userId: true }
                }
              }
            }
          }
        });

        if (!meeting) {
          throw new Error(`Meeting ${meetingId} not found`);
        }

        if (meeting.project.userToProjects.length === 0) {
          throw new Error(`User ${userId} not authorized for meeting ${meetingId}`);
        }

        // Optional: Additional project validation if projectId is provided
        if (projectId && meeting.project.id !== projectId) {
          throw new Error(`Meeting ${meetingId} belongs to project ${meeting.project.id}, not ${projectId}`);
        }

        // Log project association for debugging
        console.log(`Meeting ${meetingId} is associated with project ${meeting.project.id} and user ${userId} is authorized`);

        if (meeting.status !== 'PROCESSING') {
          console.log(`Meeting ${meetingId} already processed with status: ${meeting.status}`);
          return { alreadyProcessed: true };
        }

        console.log(`Meeting ${meetingId} validated, starting processing`);
        return { alreadyProcessed: false };
      });

      if (validationResult.alreadyProcessed) {
        return { success: true, message: "Meeting already processed" };
      }

      // Step 2: Submit transcription job (< 10 seconds)
      const transcriptionJob = await step.run("submit-transcription", async () => {
        console.log(`Submitting transcription job for meeting ${meetingId}`);
        return await submitMeetingForProcessing(meetingUrl);
      });

      // Step 3: Poll for completion (each poll < 10 seconds)
      let transcriptionStatus;
      let pollAttempts = 0;
      const maxPolls = 20; // Maximum 20 polls = ~10 minutes max wait time

      do {
        pollAttempts++;
        
        // Wait before polling (except first attempt)
        if (pollAttempts > 1) {
          await step.sleep("wait-before-poll", `${30}s`); // Wait 30 seconds between polls
        }

        transcriptionStatus = await step.run(`poll-transcription-${pollAttempts}`, async () => {
          console.log(`Polling transcription status (attempt ${pollAttempts}/${maxPolls}) for meeting ${meetingId}`);
          return await checkTranscriptionStatus(transcriptionJob.transcriptId);
        });

        console.log(`Poll ${pollAttempts}: Status = ${transcriptionStatus.status}`);

        // Check for failure
        if (transcriptionStatus.status === 'error') {
          throw new Error(`Transcription failed: ${transcriptionStatus.error}`);
        }

        // Check for timeout
        if (pollAttempts >= maxPolls && transcriptionStatus.status !== 'completed') {
          throw new Error(`Transcription timeout after ${maxPolls} polling attempts`);
        }

      } while (transcriptionStatus.status !== 'completed');

      // Step 4: Retrieve results (< 10 seconds)
      const meetingData = await step.run("retrieve-transcription-results", async () => {
        console.log(`Retrieving transcription results for meeting ${meetingId}`);
        
        try {
          const result = await retrieveTranscriptionResults(transcriptionJob.transcriptId);
          
          if (!result.summaries || result.summaries.length === 0) {
            throw new Error('No summaries generated from transcription');
          }
          
          console.log(`Successfully retrieved ${result.summaries.length} discussion points for meeting ${meetingId}`);
          return result.summaries;
        } catch (error) {
          console.error(`Error retrieving transcription results for ${meetingId}:`, error);
          
          // Create fallback summary
          const fallbackSummary = {
            start: "00:00",
            end: "00:00",
            gist: "Meeting Processing Failed",
            headline: "Unable to process audio",
            summary: `Meeting audio could not be processed due to: ${error instanceof Error ? error.message : String(error)}. Please try re-uploading the meeting or contact support if the issue persists.`
          };
          
          return [fallbackSummary];
        }
      });

      // Step 5: Save issues to database (< 10 seconds)
      await step.run("save-meeting-issues", async () => {
        console.log(`Saving ${meetingData.length} issues to database for meeting ${meetingId}`);
        
        try {
          // Check if issues already exist
          const existingIssues = await db.issue.findMany({
            where: { meetingId }
          });

          if (existingIssues.length > 0) {
            console.log(`Issues already exist for meeting ${meetingId}, skipping creation`);
            return { savedIssues: existingIssues.length, skipped: true };
          }

          // Batch insert all issues
          await db.issue.createMany({
            data: meetingData.map(summary => ({
              start: summary.start,
              end: summary.end,
              gist: summary.gist,
              headline: summary.headline,
              summary: summary.summary,
              meetingId
            }))
          });

          console.log(`Successfully saved ${meetingData.length} issues for meeting ${meetingId}`);
          return { savedIssues: meetingData.length, skipped: false };
        } catch (error) {
          console.error(`Error saving issues for meeting ${meetingId}:`, error);
          throw new Error(`Failed to save issues: ${error instanceof Error ? error.message : String(error)}`);
        }
      });

      // Step 6: Update meeting status (< 5 seconds)
      await step.run("update-meeting-status", async () => {
        console.log(`Updating meeting ${meetingId} status to COMPLETED`);
        
        try {
          const meetingName = meetingData[0]?.headline || 'Meeting Summary';
          
          const updatedMeeting = await db.meeting.update({
            where: { id: meetingId },
            data: {
              status: 'COMPLETED',
              name: meetingName
            }
          });

          console.log(`Meeting ${meetingId} successfully completed with name: ${meetingName}`);
          return updatedMeeting;
        } catch (error) {
          console.error(`Error updating meeting status for ${meetingId}:`, error);
          throw new Error(`Failed to update meeting status: ${error instanceof Error ? error.message : String(error)}`);
        }
      });

      console.log(`Meeting ${meetingId} processing completed successfully`);
      return { 
        success: true, 
        meetingId, 
        issuesCreated: meetingData.length,
        meetingName: meetingData[0]?.headline || 'Meeting Summary'
      };

    } catch (error) {
      console.error(`Error processing meeting ${meetingId}:`, error);
      
      // Mark meeting as failed with detailed error info
      await step.run("mark-meeting-failed", async () => {
        try {
          return await db.meeting.update({
            where: { id: meetingId },
            data: { 
              status: 'COMPLETED', // Keep as COMPLETED but with error info in issues
              name: `Processing Failed: ${error instanceof Error ? error.message.substring(0, 50) : String(error).substring(0, 50)}...`
            }
          });
        } catch (dbError) {
          console.error(`Failed to update meeting status to failed:`, dbError);
          return null;
        }
      });

      throw error;
    }
  }
);