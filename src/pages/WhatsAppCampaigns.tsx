/* ============================================================
   LeadScaper Pro — WhatsApp Campaigns Dashboard
   ============================================================ */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, Badge, EmptyState } from '@/components/ui/SharedComponents';
import {
  getAllWhatsAppCampaigns, getProjectsWithStats, addWhatsAppCampaign, deleteWhatsAppCampaign, updateWhatsAppCampaign
} from '@/services/database';
import { generateId } from '@/utils/constants';
import { cn, timeAgo } from '@/utils/formatters';
import type { WhatsAppCampaign, ProjectWithStats } from '@/types';
import {
  MessageCircle, Plus, Trash2, Calendar, Users, FolderOpen, Image as ImageIcon, Edit2,
} from 'lucide-react';
import { CreateWhatsAppCampaignModal } from '@/components/CreateWhatsAppCampaignModal';

interface WhatsAppCampaignsProps {
  preselectedProjectId?: string | null;
  onToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onNavigateToCampaign: (campaignId: string) => void;
}

export default function WhatsAppCampaigns({ preselectedProjectId, onToast, onNavigateToCampaign }: WhatsAppCampaignsProps) {
  const [campaigns, setCampaigns] = useState<WhatsAppCampaign[]>([]);
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<WhatsAppCampaign | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [camps, projs] = await Promise.all([
        getAllWhatsAppCampaigns(),
        getProjectsWithStats(),
      ]);
      setCampaigns(camps);
      setProjects(projs as ProjectWithStats[]);
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    if (preselectedProjectId) {
      setShowCreateModal(true);
    }
  }, [loadData, preselectedProjectId]);

  const closeAndResetModal = () => {
    setShowCreateModal(false);
    setEditingCampaign(null);
  };

  const openEditModal = (campaign: WhatsAppCampaign) => {
    setEditingCampaign(campaign);
    setShowCreateModal(true);
  };

  async function handleDelete(id: string) {
    await deleteWhatsAppCampaign(id);
    onToast?.('Campaign deleted', 'info');
    loadData();
  }

  const getProjectName = (id: string) => projects.find(p => p.id === id)?.name || 'Unknown Project';
  const getProjectStats = (id: string) => projects.find(p => p.id === id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">WhatsApp Campaigns</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Create and manage personalized click-to-chat campaigns</p>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => {
            setShowCreateModal(true);
          }}
        >
          New Campaign
        </Button>
      </motion.div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateWhatsAppCampaignModal
            projects={projects}
            initialCampaign={editingCampaign}
            onClose={() => closeAndResetModal()}
            onSuccess={() => {
              closeAndResetModal();
              loadData();
            }}
            onToast={onToast || (() => {})}
          />
        )}
      </AnimatePresence>

      {/* Campaigns Grid */}
      {(campaigns?.length || 0) === 0 && !isLoading ? (
        <EmptyState
          icon={<MessageCircle size={32} />}
          title="No campaigns yet"
          description="Create your first WhatsApp campaign to start contacting leads."
          action={
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowCreateModal(true)}>
              Create Campaign
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {(campaigns || []).map((campaign, index) => {
              const pStats = getProjectStats(campaign.projectId || '');
              return (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card hoverable onClick={() => onNavigateToCampaign(campaign.id)}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                        <MessageCircle size={20} />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditModal(campaign); }}
                          className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-brand-400 hover:bg-brand-500/10 transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(campaign.id); }}
                          className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1 truncate">
                      {campaign.name}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] mb-4 truncate">
                      <FolderOpen size={12} />
                      <span className="truncate">{campaign.source === 'project' || !campaign.source ? getProjectName(campaign.projectId || '') : `Imported (${campaign.source.toUpperCase()})`}</span>
                      {campaign.imageUrl && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-[var(--border-secondary)] mx-1" />
                          <span className="flex items-center gap-1 text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded-md">
                            <ImageIcon size={10} />
                            Image
                          </span>
                        </>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)]">
                      <div>
                        <div className="text-xs text-[var(--text-tertiary)] uppercase mb-0.5">WhatsApp Ready</div>
                        <div className="font-semibold text-[var(--text-primary)]">
                          {pStats?.validWhatsAppLeadCount ?? 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-[var(--text-tertiary)] uppercase mb-0.5">Contacted</div>
                        <div className="font-semibold text-green-400">
                          {pStats?.contactedCount ?? 0}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[var(--border-secondary)]">
                      <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                        <Calendar size={12} />
                        <span>{timeAgo(campaign.createdAt)}</span>
                      </div>
                      <Badge variant="success" size="sm">
                        Open Campaign →
                      </Badge>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
