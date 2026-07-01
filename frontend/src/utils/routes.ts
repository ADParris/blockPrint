/* src/utils/routes.ts */
export const paths = {
  projectDashboard: (namespace: string, projectId: string) =>
    `/${namespace}/projects/${projectId}/dashboard`,

  projectRoadmap: (namespace: string, projectId: string) =>
    `/${namespace}/projects/${projectId}/roadmap`,

  pageKanban: (namespace: string, projectId: string, pageId: string) =>
    `/${namespace}/projects/${projectId}/pages/${pageId}/kanban`,

  pageDocument: (namespace: string, projectId: string, pageId: string) =>
    `/${namespace}/projects/${projectId}/pages/${pageId}/document`,

  pageCanvas: (namespace: string, projectId: string, pageId: string) =>
    `/${namespace}/projects/${projectId}/pages/${pageId}/canvas`,
};
