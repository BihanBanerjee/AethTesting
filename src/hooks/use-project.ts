// src/hooks/use-project.ts
import { api } from '@/trpc/react'
import { useUser } from '@clerk/nextjs'
import { useLocalStorage } from 'usehooks-ts'
import { useEffect } from 'react'

const useProject = () => {
    const { user } = useUser()
    const { data: projects } = api.project.getProjects.useQuery()
    
    // Use user-specific localStorage key
    const storageKey = user?.id ? `Aetheria-projectId-${user.id}` : 'Aetheria-projectId'
    const [projectId, setProjectId] = useLocalStorage(storageKey, '')
    
    // Only use projectId if the current user owns this project
    const project = projects?.find(p => p.id === projectId)
    
    // If no valid project found but projects exist, auto-select the first one
    const finalProject = project || projects?.[0]
    const finalProjectId = finalProject?.id || ''
    
    // Update localStorage if we auto-selected a different project - moved to useEffect
    useEffect(() => {
        if (finalProject && finalProject.id !== projectId) {
            setProjectId(finalProject.id)
        }
    }, [finalProject?.id, projectId, setProjectId])

    return {
        projects,
        project: finalProject,
        projectId: finalProjectId,
        setProjectId
    }
}

export default useProject