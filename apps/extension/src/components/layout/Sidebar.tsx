/* ============================================================
   LeadScaper Pro — Sidebar Navigation
   ============================================================ */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/formatters';
import { getProjectsWithStats } from '@/services/database';
import type { ProjectWithStats } from '@/types';
import {
  LayoutDashboard, Search, FolderOpen, Download, Settings,
  Zap, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
} from 'lucide-react';

const navIcons: Record<string, React.ReactNode> = {
  dashboard: <LayoutDashboard size={20} />,
  scraper: <Search size={20} />,
  projects: <FolderOpen size={20} />,
  'whatsapp-campaigns': <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" /><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" /></svg>,
  exports: <Download size={20} />,
  settings: <Settings size={20} />,
};

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  onNavigateToProject: (projectId: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'projects', label: 'Projects' },
  { id: 'scraper', label: 'Scraper' },
  { id: 'whatsapp-campaigns', label: 'WhatsApp Campaigns' },
  { id: 'exports', label: 'Exports' },
  { id: 'settings', label: 'Settings' },
];

export default function Sidebar({ activePage, onNavigate, onNavigateToProject, collapsed, onToggleCollapse }: SidebarProps) {
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [showProjects, setShowProjects] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      const data = await getProjectsWithStats();
      setProjects(data as ProjectWithStats[]);
    } catch (err) {
      console.error('[Sidebar] Failed to load projects:', err);
    }
  }, []);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Listen for PROJECT_UPDATED messages to refresh counts
  useEffect(() => {
    const listener = (msg: any) => {
      if (msg.type === 'PROJECT_UPDATED' || msg.type === 'LEADS_FOUND') {
        loadProjects();
      }
    };
    try {
      chrome.runtime.onMessage.addListener(listener);
      return () => chrome.runtime.onMessage.removeListener(listener);
    } catch {
      return () => {};
    }
  }, [loadProjects]);

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="glass-sidebar h-screen flex flex-col relative z-20"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[var(--border-secondary)]">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0 shadow-brand">
          <Zap size={16} className="text-white" />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="overflow-hidden"
          >
            <h1 className="text-sm font-bold text-[var(--text-primary)] whitespace-nowrap leading-tight">
              LeadScaper Pro
            </h1>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activePage === item.id || (item.id === 'projects' && activePage === 'project-detail');
          return (
            <div key={item.id}>
              <motion.button
                onClick={() => {
                  onNavigate(item.id);
                  if (item.id === 'projects' && !collapsed) {
                    setShowProjects(prev => !prev);
                  }
                }}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-brand-500/15 text-brand-400 shadow-inner'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                )}
              >
                <span className={cn(
                  'flex-shrink-0 transition-colors',
                  isActive && 'text-brand-400'
                )}>
                  {navIcons[item.id]}
                </span>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="whitespace-nowrap flex-1 text-left"
                  >
                    {item.label}
                  </motion.span>
                )}
                {/* Show expand icon for Projects */}
                {item.id === 'projects' && !collapsed && projects.length > 0 && (
                  <span className="text-[var(--text-tertiary)]">
                    {showProjects ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </span>
                )}
                {isActive && !collapsed && item.id !== 'projects' && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400"
                  />
                )}
              </motion.button>

              {/* Dynamic Project Sub-items */}
              {item.id === 'projects' && !collapsed && (
                <AnimatePresence>
                  {showProjects && projects.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="ml-5 mt-1 space-y-0.5 overflow-hidden"
                    >
                      {projects.map(project => (
                        <button
                          key={project.id}
                          onClick={() => onNavigateToProject(project.id)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: project.color }}
                          />
                          <span className="truncate flex-1 text-left">{project.name}</span>
                          <span className="text-[10px] text-[var(--text-tertiary)] tabular-nums">
                            {project.totalLeads}
                          </span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-2 border-t border-[var(--border-secondary)]">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </motion.aside>
  );
}
