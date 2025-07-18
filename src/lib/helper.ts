export function calculateQuestionImpact(question: any, interactions: any[], codeGenerations: any[]) {
    let impact = 0;
    
    // Base impact from question type
    const intentImpact = {
        'code_generation': 10,
        'debug': 8,
        'code_improvement': 7,
        'refactor': 7,
        'code_review': 6,
        'explain': 4,
        'question': 3
    };
    
    impact += intentImpact[question.intent] || 3;
    
    // Boost for high satisfaction
    if (question.satisfaction && question.satisfaction >= 4) {
        impact += question.satisfaction;
    }
    
    // Boost for applied code
    if (codeGenerations.some(gen => gen.applied)) {
        impact += 15;
    }
    
    // Boost for code generation with many lines
    const totalLinesGenerated = codeGenerations.reduce((sum, gen) => sum + (gen.linesOfCode || 0), 0);
    impact += Math.min(totalLinesGenerated / 10, 20); // Max 20 points for lines
    
    return Math.round(impact);
}

export function getIntentIcon(intent: string | null) {
    const icons = {
        'code_generation': '🔧',
        'debug': '🐛',
        'code_review': '👀',
        'explain': '💡',
        'code_improvement': '⚡',
        'refactor': '🔄',
        'question': '❓'
    };
    return icons[intent || 'question'] || '❓';
}

export function getIntentColor(intent: string | null) {
    const colors = {
        'code_generation': 'bg-green-500/20 text-green-200 border-green-500/30',
        'debug': 'bg-red-500/20 text-red-200 border-red-500/30',
        'code_review': 'bg-purple-500/20 text-purple-200 border-purple-500/30',
        'explain': 'bg-blue-500/20 text-blue-200 border-blue-500/30',
        'code_improvement': 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30',
        'refactor': 'bg-indigo-500/20 text-indigo-200 border-indigo-500/30',
        'question': 'bg-gray-500/20 text-gray-200 border-gray-500/30'
    };
    return colors[intent || 'question'] || colors.question;
}

export function getConfidenceLevel(confidence: number | null) {
    if (!confidence) return null;
    if (confidence >= 0.9) return 'Very High';
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.7) return 'Medium';
    if (confidence >= 0.6) return 'Low';
    return 'Very Low';
}

export function getSatisfactionLevel(satisfaction: number | null) {
    if (!satisfaction) return null;
    if (satisfaction >= 4.5) return 'Excellent';
    if (satisfaction >= 4) return 'Good';
    if (satisfaction >= 3) return 'Fair';
    if (satisfaction >= 2) return 'Poor';
    return 'Very Poor';
}

export function formatProcessingTime(timeMs: number) {
    if (timeMs < 1000) return `${timeMs}ms`;
    if (timeMs < 60000) return `${(timeMs / 1000).toFixed(1)}s`;
    return `${(timeMs / 60000).toFixed(1)}m`;
}


export async function getQuestionStatistics(db: any, projectId: string, timeRange: string) {
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
        codeGenerationCounts  // 👈 NEW: Separate query for boolean counts
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

        // 👈 FIXED: Only aggregate numeric fields
        db.codeGeneration.aggregate({
            where: {
                projectId,
                ...(timeFilter && { createdAt: timeFilter })
            },
            _count: { id: true },
            _sum: { 
                linesOfCode: true  // 👈 REMOVED: applied (boolean field)
            },
            _avg: { satisfaction: true }
        }),

        // 👈 NEW: Separate queries for boolean counts
        Promise.all([
            db.codeGeneration.count({
                where: {
                    projectId,
                    applied: true,  // 👈 Count where applied = true
                    ...(timeFilter && { createdAt: timeFilter })
                }
            }),
            db.codeGeneration.count({
                where: {
                    projectId,
                    modified: true,  // 👈 Count where modified = true
                    ...(timeFilter && { createdAt: timeFilter })
                }
            })
        ])
    ]);

    // 👈 Extract boolean counts
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
            totalApplied: appliedCount,  // 👈 FIXED: Use separate count
            totalModified: modifiedCount,  // 👈 NEW: Also get modified count
            totalLinesGenerated: codeGenerationStats._sum.linesOfCode,
            avgLinesOfCode: codeGenerationStats._sum.linesOfCode && codeGenerationStats._count.id > 0 ? 
                codeGenerationStats._sum.linesOfCode / codeGenerationStats._count.id : 0,
            avgSatisfaction: codeGenerationStats._avg.satisfaction,
            applicationRate: codeGenerationStats._count.id > 0 ? 
                appliedCount / codeGenerationStats._count.id : 0  // 👈 FIXED: Use separate count
        },
        timeRange
    };
}