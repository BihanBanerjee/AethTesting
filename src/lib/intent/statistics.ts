// Complex database statistics for question analytics
/* eslint-disable @typescript-eslint/no-explicit-any */

// Database interface for statistics queries
interface DbInstance {
    question: {
        count: (params: any) => Promise<number>;
        groupBy: (params: any) => Promise<Array<{ intent: string; _count: { id: number } }>>;
        aggregate: (params: any) => Promise<any>;
    };
    codeGeneration: {
        count: (params: any) => Promise<number>;
        aggregate: (params: any) => Promise<any>;
    };
}

export async function getQuestionStatistics(
    db: DbInstance, 
    projectId: string, 
    timeRange: string
) {
    const timeFilter = timeRange === 'all' ? undefined : {
        gte: new Date(Date.now() - (
            timeRange === 'day' ? 24 * 60 * 60 * 1000 :
            timeRange === 'week' ? 7 * 24 * 60 * 60 * 1000 :
            30 * 24 * 60 * 60 * 1000
        ))
    };

    const [
        totalQuestions,
        intentDistribution,
        satisfactionStats,
        confidenceStats,
        processingTimeStats,
        codeGenerationStats,
        codeGenerationCounts
    ] = await Promise.all([
        db.question.count({
            where: {
                projectId,
                ...(timeFilter && { createdAt: timeFilter })
            }
        }),

        db.question.groupBy({
            by: ['intent'],
            where: {
                projectId,
                ...(timeFilter && { createdAt: timeFilter })
            },
            _count: { id: true }
        }),

        db.question.aggregate({
            where: {
                projectId,
                satisfaction: { not: null },
                ...(timeFilter && { createdAt: timeFilter })
            },
            _avg: { satisfaction: true },
            _count: { satisfaction: true }
        }),

        db.question.aggregate({
            where: {
                projectId,
                confidence: { not: null },
                ...(timeFilter && { createdAt: timeFilter })
            },
            _avg: { confidence: true }
        }),

        db.question.aggregate({
            where: {
                projectId,
                processingTime: { not: null },
                ...(timeFilter && { createdAt: timeFilter })
            },
            _avg: { processingTime: true }
        }),

        db.codeGeneration.aggregate({
            where: {
                projectId,
                ...(timeFilter && { createdAt: timeFilter })
            },
            _count: { id: true },
            _sum: { 
                linesOfCode: true
            },
            _avg: { satisfaction: true }
        }),

        Promise.all([
            db.codeGeneration.count({
                where: {
                    projectId,
                    applied: true,
                    ...(timeFilter && { createdAt: timeFilter })
                }
            }),
            db.codeGeneration.count({
                where: {
                    projectId,
                    modified: true,
                    ...(timeFilter && { createdAt: timeFilter })
                }
            })
        ])
    ]);

    const [appliedCount, modifiedCount] = codeGenerationCounts;

    return {
        total: totalQuestions,
        intentDistribution: intentDistribution.reduce((acc, item) => {
            acc[item.intent || 'question'] = item._count.id;
            return acc;
        }, {} as Record<string, number>),
        satisfaction: {
            average: satisfactionStats._avg.satisfaction,
            avgRating: satisfactionStats._avg.satisfaction,
            totalRatings: satisfactionStats._count.satisfaction
        },
        confidence: {
            average: confidenceStats._avg.confidence
        },
        performance: {
            avgProcessingTime: processingTimeStats._avg.processingTime
        },
        codeGeneration: {
            totalGenerated: codeGenerationStats._count.id,
            totalApplied: appliedCount,
            totalModified: modifiedCount,
            totalLinesGenerated: codeGenerationStats._sum.linesOfCode,
            avgLinesOfCode: codeGenerationStats._sum.linesOfCode && codeGenerationStats._count.id > 0 ? 
                codeGenerationStats._sum.linesOfCode / codeGenerationStats._count.id : 0,
            avgSatisfaction: codeGenerationStats._avg.satisfaction,
            applicationRate: codeGenerationStats._count.id > 0 ? 
                appliedCount / codeGenerationStats._count.id : 0
        },
        timeRange
    };
}