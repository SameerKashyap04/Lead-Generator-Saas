/* ============================================================
   LeadScaper Pro — Dashboard App (Full Page Tab)
   The main multi-page application with sidebar navigation.
   ============================================================ */

import React from 'react';
import Layout from '@/components/layout/Layout';
import Dashboard from '@/pages/Dashboard';
import Scraper from '@/pages/Scraper';
import Projects from '@/pages/Projects';
import ProjectDetail from '@/pages/ProjectDetail';
import WhatsAppCampaigns from '@/pages/WhatsAppCampaigns';
import WhatsAppCampaignDetail from '@/pages/WhatsAppCampaignDetail';
import Exports from '@/pages/Exports';
import SettingsPage from '@/pages/Settings';

import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function App() {
  return (
    <Layout>
      {({ activePage, activeProjectId, activeCampaignId, preselectedProjectId, navigateToProject, navigateToCampaignDetail, navigateToCreateCampaign, navigateBack, toast }) => (
        <ErrorBoundary fallbackMessage="A page failed to load properly. Please try reloading the extension.">
          {(() => {
            switch (activePage) {
              case 'dashboard':
                return <Dashboard />;
              case 'scraper':
                return <Scraper onToast={(msg, type) => toast[type]?.(msg) ?? toast.info(msg)} />;
              case 'projects':
                return (
                  <Projects
                    onToast={(msg, type) => toast[type]?.(msg) ?? toast.info(msg)}
                    onNavigateToProject={navigateToProject}
                  />
                );
              case 'project-detail':
                return activeProjectId ? (
                  <ProjectDetail
                    projectId={activeProjectId}
                    onBack={navigateBack}
                    onToast={(msg, type) => toast[type]?.(msg) ?? toast.info(msg)}
                    onCreateWhatsAppCampaign={navigateToCreateCampaign}
                  />
                ) : (
                  <Dashboard />
                );
              case 'whatsapp-campaigns':
                return (
                  <WhatsAppCampaigns
                    preselectedProjectId={preselectedProjectId}
                    onToast={(msg, type) => toast[type]?.(msg) ?? toast.info(msg)}
                    onNavigateToCampaign={navigateToCampaignDetail}
                  />
                );
              case 'whatsapp-campaign-detail':
                return activeCampaignId ? (
                  <WhatsAppCampaignDetail
                    campaignId={activeCampaignId}
                    onBack={navigateBack}
                    onToast={(msg, type) => toast[type]?.(msg) ?? toast.info(msg)}
                  />
                ) : (
                  <WhatsAppCampaigns
                    preselectedProjectId={null}
                    onToast={(msg, type) => toast[type]?.(msg) ?? toast.info(msg)}
                    onNavigateToCampaign={navigateToCampaignDetail}
                  />
                );
              case 'exports':
                return <Exports onToast={(msg, type) => toast[type]?.(msg) ?? toast.info(msg)} />;
              case 'settings':
                return <SettingsPage onToast={(msg, type) => toast[type]?.(msg) ?? toast.info(msg)} />;
              default:
                return <Dashboard />;
            }
          })()}
        </ErrorBoundary>
      )}
    </Layout>
  );
}
