/* src/utils/routes.ts */
export const paths = {
  projectDashboard: (namespace: string, projectId: string) =>
    `/${namespace}/projects/${projectId}`,

  projectRoadmap: (namespace: string, projectId: string) =>
    `/${namespace}/projects/${projectId}/roadmap`,

  pageRoadmap: (namespace: string, projectId: string, pageId: string) =>
    `/${namespace}/projects/${projectId}/pages/${pageId}/roadmap`,

  pageDocument: (namespace: string, projectId: string, pageId: string) =>
    `/${namespace}/projects/${projectId}/pages/${pageId}`,

  pageCanvas: (namespace: string, projectId: string, pageId: string) =>
    `/${namespace}/projects/${projectId}/pages/${pageId}/canvas`,
};
