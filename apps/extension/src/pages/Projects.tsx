/* ============================================================
   LeadScaper Pro — Projects Page
   ============================================================ */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, Badge, EmptyState } from '@/components/ui/SharedComponents';
import {
  addProject, updateProject, deleteProject,
  getProjectsWithStats,
} from '@/services/database';
import { generateId, PROJECT_COLORS } from '@/utils/constants';
import { cn, timeAgo } from '@/utils/formatters';
import type { Project, ProjectWithStats } from '@/types';
import {
  FolderOpen, Plus, Trash2, Edit3, Users, Calendar,
  X, Mail, Phone, AlertTriangle,
} from 'lucide-react';

interface ProjectsProps {
  onToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onNavigateToProject: (projectId: string) => void;
}

export default function Projects({ onToast, onNavigateToProject }: ProjectsProps) {
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0]);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<ProjectWithStats | null>(null);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getProjectsWithStats();
      setProjects(data as ProjectWithStats[]);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Listen for PROJECT_UPDATED to auto-refresh
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

  async function handleCreate() {
    if (!newName.trim()) return;

    const project: Project = {
      id: generateId(),
      name: newName.trim(),
      description: newDescription.trim(),
      color: selectedColor,
      icon: '📁',
      leadCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await addProject(project);
    setShowCreateModal(false);
    setNewName('');
    setNewDescription('');
    onToast?.(`Project "${project.name}" created`, 'success');
    loadProjects();
  }

  async function handleDelete(deleteLeads: boolean) {
    if (!deleteTarget) return;
    await deleteProject(deleteTarget.id, deleteLeads);
    onToast?.(
      deleteLeads
        ? `Project "${deleteTarget.name}" and all its leads deleted`
        : `Project "${deleteTarget.name}" deleted — leads moved to unassigned`,
      'info'
    );
    setDeleteTarget(null);
    loadProjects();
  }

  async function handleRename(id: string, name: string) {
    await updateProject(id, { name });
    setEditingId(null);
    loadProjects();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Projects</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Organize your leads into projects and folders</p>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => setShowCreateModal(true)}
        >
          New Project
        </Button>
      </motion.div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Create New Project</h3>
              <div className="space-y-3">
                <Input
                  label="Project Name"
                  placeholder="e.g., Mumbai Dentists Q1"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  autoFocus
                />
                <Input
                  label="Description (optional)"
                  placeholder="Brief description of this project"
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                />
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">Color</label>
                  <div className="flex gap-2">
                    {PROJECT_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={cn(
                          'w-7 h-7 rounded-full transition-transform',
                          selectedColor === color && 'ring-2 ring-offset-2 ring-offset-[var(--bg-secondary)] scale-110'
                        )}
                        style={{ backgroundColor: color, '--ring-color': color } as React.CSSProperties}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                  <Button variant="primary" onClick={handleCreate} disabled={!newName.trim()}>Create Project</Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-6 max-w-md w-full mx-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="p-2 rounded-xl bg-red-500/10 text-red-400">
                  <AlertTriangle size={20} />
                </span>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Delete Project</h3>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-2">
                Are you sure you want to delete <strong className="text-[var(--text-primary)]">"{deleteTarget.name}"</strong>?
              </p>
              {deleteTarget.totalLeads > 0 && (
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  This project contains <strong className="text-[var(--text-primary)]">{deleteTarget.totalLeads} leads</strong>.
                  Choose what to do with them:
                </p>
              )}
              <div className="flex flex-col gap-2 mt-4">
                {deleteTarget.totalLeads > 0 ? (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(true)}
                      className="w-full"
                    >
                      Delete Project & All {deleteTarget.totalLeads} Leads
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleDelete(false)}
                      className="w-full"
                    >
                      Delete Project — Keep Leads (Unassigned)
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(false)}
                    className="w-full"
                  >
                    Delete Empty Project
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={() => setDeleteTarget(null)}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Projects Grid */}
      {(projects?.length || 0) === 0 && !isLoading ? (
        <EmptyState
          icon={<FolderOpen size={32} />}
          title="No projects yet"
          description="Create your first project to start organizing leads by campaign, city, or category."
          action={
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowCreateModal(true)}>
              Create Project
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {(projects || []).map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card hoverable onClick={() => onNavigateToProject(project.id)}>
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-bold"
                      style={{ backgroundColor: project.color }}
                    >
                      {project.name.charAt(0).toUpperCase()}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(project); }}
                      className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {editingId === project.id ? (
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        autoFocus
                        defaultValue={project.name}
                        onClick={e => e.stopPropagation()}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleRename(project.id, (e.target as HTMLInputElement).value);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="text-sm font-semibold bg-transparent text-[var(--text-primary)] border-b border-brand-500 outline-none flex-1"
                      />
                      <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="text-[var(--text-tertiary)]">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <h3
                      className="text-sm font-semibold text-[var(--text-primary)] mb-1 cursor-pointer hover:text-brand-400 transition-colors"
                      onDoubleClick={(e) => { e.stopPropagation(); setEditingId(project.id); }}
                    >
                      {project.name}
                    </h3>
                  )}

                  {project.description && (
                    <p className="text-xs text-[var(--text-secondary)] mb-3 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  {/* Dynamic Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                      <Users size={12} className="text-brand-400" />
                      <span className="font-semibold text-[var(--text-primary)]">{project.totalLeads}</span>
                      <span>Leads</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                      <Mail size={12} className="text-green-400" />
                      <span className="font-semibold text-[var(--text-primary)]">{project.totalEmails}</span>
                      <span>Emails</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                      <Phone size={12} className="text-cyan-400" />
                      <span className="font-semibold text-[var(--text-primary)]">{project.totalPhones}</span>
                      <span>Phones</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[var(--border-secondary)]">
                    <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                      <Calendar size={12} />
                      <span>{timeAgo(project.updatedAt)}</span>
                    </div>
                    <Badge variant="brand" size="sm">
                      View Details →
                    </Badge>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
