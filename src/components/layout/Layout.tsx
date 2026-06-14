/* ============================================================
   LeadScaper Pro — Layout Component
   ============================================================ */

import React, { useState, useCallback } from 'react';
import Sidebar from './Sidebar';
import { ToastContainer } from '@/components/ui/SharedComponents';
import { useToast } from '@/hooks/useToast';
import { useTheme } from '@/hooks/useTheme';

interface LayoutProps {
  children: (props: {
    activePage: string;
    activeProjectId: string | null;
    activeCampaignId: string | null;
    preselectedProjectId: string | null;
    navigateToProject: (projectId: string) => void;
    navigateToCampaignDetail: (campaignId: string) => void;
    navigateToCreateCampaign: (projectId: string) => void;
    navigateBack: () => void;
    toast: ReturnType<typeof useToast>;
  }) => React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [activePage, setActivePage] = useState('dashboard');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const [preselectedProjectId, setPreselectedProjectId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toast = useToast();

  // Initialize theme
  useTheme();

  const handleNavigate = useCallback((page: string) => {
    setActivePage(page);
    setActiveProjectId(null);
    setActiveCampaignId(null);
    setPreselectedProjectId(null);
  }, []);

  const navigateToProject = useCallback((projectId: string) => {
    setActivePage('project-detail');
    setActiveProjectId(projectId);
    setActiveCampaignId(null);
    setPreselectedProjectId(null);
  }, []);

  const navigateToCampaignDetail = useCallback((campaignId: string) => {
    setActivePage('whatsapp-campaign-detail');
    setActiveCampaignId(campaignId);
  }, []);

  const navigateToCreateCampaign = useCallback((projectId: string) => {
    setActivePage('whatsapp-campaigns');
    setPreselectedProjectId(projectId);
  }, []);

  const navigateBack = useCallback(() => {
    if (activePage === 'project-detail') {
      setActivePage('projects');
      setActiveProjectId(null);
    } else if (activePage === 'whatsapp-campaign-detail') {
      setActivePage('whatsapp-campaigns');
      setActiveCampaignId(null);
    } else {
      setActivePage('dashboard');
    }
    setPreselectedProjectId(null);
  }, [activePage]);

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden">
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        onNavigateToProject={navigateToProject}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(p => !p)}
      />

      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-6 max-w-[1400px] mx-auto">
          {children({
            activePage,
            activeProjectId,
            activeCampaignId,
            preselectedProjectId,
            navigateToProject,
            navigateToCampaignDetail,
            navigateToCreateCampaign,
            navigateBack,
            toast
          })}
        </div>
      </main>

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
}
