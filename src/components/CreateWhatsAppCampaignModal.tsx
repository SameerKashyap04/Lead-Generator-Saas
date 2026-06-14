import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Image as ImageIcon, UploadCloud, ArrowRight, FileText, FileSpreadsheet, FileJson } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { type ProjectWithStats, type WhatsAppCampaign, type Lead, type CampaignRecipient, type ImportHistory, type Project } from '@/types';
import { generateId } from '@/utils/constants';
import { parseCsvFile, parseExcelFile, parseJsonFile, normalizePhone, isDuplicate, addToDuplicateSet } from '@/utils/import-parsers';
import { ImportMappingUI } from './ImportMappingUI';
import { ImportPreviewTable } from './ImportPreviewTable';
import { addWhatsAppCampaign, updateWhatsAppCampaign, addCampaignRecipients, addImportHistory, addProject, addLeads } from '@/services/database';

interface CreateWhatsAppCampaignModalProps {
  projects: ProjectWithStats[];
  onClose: () => void;
  onSuccess: () => void;
  onToast: (msg: string, type: 'success'|'error'|'info'|'warning') => void;
  initialCampaign?: WhatsAppCampaign | null;
}

type LeadSource = 'project' | 'csv' | 'excel' | 'json';
type ImportStep = 'setup' | 'mapping' | 'preview';

export function CreateWhatsAppCampaignModal({ projects, onClose, onSuccess, onToast, initialCampaign }: CreateWhatsAppCampaignModalProps) {
  const [step, setStep] = useState<ImportStep>('setup');
  const [name, setName] = useState(initialCampaign?.name || '');
  const [source, setSource] = useState<LeadSource>((initialCampaign?.source as LeadSource) || 'project');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialCampaign?.projectId || '');
  const [messageTemplate, setMessageTemplate] = useState(initialCampaign?.messageTemplate || 'Hi {{businessName}},\n\nI noticed you are located in {{city}}.\n\nBest,\nSameer');
  
  const [attachments, setAttachments] = useState<string[]>(
    initialCampaign?.attachments?.length ? initialCampaign.attachments : (initialCampaign?.imageUrl ? [initialCampaign.imageUrl] : [])
  );

  // Import states
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  
  // Preview stats
  const [mappedLeads, setMappedLeads] = useState<Partial<CampaignRecipient>[]>([]);
  const [duplicateCount, setDuplicateCount] = useState(0);

  // Save options
  const [saveToProject, setSaveToProject] = useState(false);
  const [saveProjectId, setSaveProjectId] = useState<string>('new');
  const [newProjectName, setNewProjectName] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);

  // File Handlers
  const handleAttachments = (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(f => {
      if (f.size > 16 * 1024 * 1024) {
        onToast(`File ${f.name} is larger than 16MB`, 'error');
        return false;
      }
      return true;
    });

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        if (e.target?.result) {
          setAttachments(prev => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleImportFile = async (file: File) => {
    setFile(file);
    setIsProcessing(true);
    let result;
    
    try {
      if (source === 'csv') result = await parseCsvFile(file);
      else if (source === 'excel') result = await parseExcelFile(file);
      else if (source === 'json') result = await parseJsonFile(file);
      
      if (!result || result.errors.length > 0) {
        onToast(`Import error: ${result?.errors[0] || 'Failed to parse'}`, 'error');
        setFile(null);
        setIsProcessing(false);
        return;
      }

      if (result.data.length === 0) {
        onToast('The file is empty', 'warning');
        setFile(null);
        setIsProcessing(false);
        return;
      }

      setParsedData(result.data);

      // Extract headers from the first object
      const headers = Object.keys(result.data[0]);
      setFileHeaders(headers);

      // Auto-map if possible
      const autoMap: Record<string, string> = {};
      const targetFields = ['businessName', 'phone', 'email', 'website', 'city', 'category', 'address'];
      
      for (const field of targetFields) {
        const match = headers.find(h => h.toLowerCase().replace(/[\s_]/g, '') === field.toLowerCase());
        if (match) autoMap[field] = match;
      }

      setMapping(autoMap);
      setStep('mapping');
    } catch (e: any) {
      onToast(`Error processing file: ${e.message}`, 'error');
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const processMapping = () => {
    const existingSet = new Set<string>();
    let duplicates = 0;
    const finalLeads: Partial<CampaignRecipient>[] = [];

    for (const row of parsedData) {
      const mappedLead: Partial<CampaignRecipient> = {};
      
      // Apply mapping
      for (const [targetKey, sourceHeader] of Object.entries(mapping)) {
        if (sourceHeader && row[sourceHeader] !== undefined) {
          (mappedLead as any)[targetKey] = String(row[sourceHeader]);
        }
      }

      // If no phone, still add it to be shown as invalid in preview
      if (!mappedLead.phone) {
        finalLeads.push(mappedLead);
        continue;
      }

      // Check duplicates
      if (isDuplicate(mappedLead, existingSet)) {
        duplicates++;
      } else {
        addToDuplicateSet(mappedLead, existingSet);
        finalLeads.push(mappedLead);
      }
    }

    setMappedLeads(finalLeads);
    setDuplicateCount(duplicates);
    setStep('preview');
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      onToast('Campaign name is required', 'error');
      return;
    }

    setIsProcessing(true);

    try {
      if (initialCampaign) {
        // Handle Update
        await updateWhatsAppCampaign(initialCampaign.id, {
          name: name.trim(),
          messageTemplate: messageTemplate.trim(),
          imageUrl: attachments[0] || null,
          attachments: attachments
        });
        onToast('Campaign updated successfully', 'success');
        onSuccess();
        return;
      }

      const campaignId = generateId();
      let finalProjectId = selectedProjectId;

      if (source === 'project') {
        if (!selectedProjectId) throw new Error("Please select a project");
      } else {
        // Handle imported data
        const validLeads = mappedLeads.filter(l => !!l.phone);
        if (validLeads.length === 0) throw new Error("No valid contacts found in import");

        // 1. Save to Project if requested
        if (saveToProject) {
          if (saveProjectId === 'new') {
            if (!newProjectName.trim()) throw new Error("Please enter a new project name");
            finalProjectId = generateId();
            await addProject({
              id: finalProjectId,
              name: newProjectName.trim(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              description: '',
              color: 'bg-brand-500',
              icon: 'Folder',
              leadCount: 0
            } as Project);
          } else {
            finalProjectId = saveProjectId;
          }

          // Create full Lead records for the project
          const projectLeads: Lead[] = validLeads.map(l => ({
            id: generateId(),
            projectId: finalProjectId,
            sessionId: 'import_' + generateId(),
            businessName: l.businessName || 'Unknown',
            phone: normalizePhone(l.phone!),
            emails: l.email ? [l.email] : [],
            website: l.website || null,
            city: l.city || null,
            category: l.category || 'Imported',
            fullAddress: l.address || '',
            rating: null,
            reviewCount: null,
            scrapedAt: new Date().toISOString(),
            status: 'scraped',
            contacted: false,
            contactedAt: null,
            tags: [],
            isFavorite: false,
            state: null,
            postalCode: null,
            googleMapsUrl: null,
            cid: null,
            placeId: null,
            isVerified: false,
            hasClaimed: false,
            timezone: null,
            openingHours: null
          } as unknown as Lead));

          await addLeads(projectLeads);
        } else {
          finalProjectId = ''; // Explicitly no project
        }

        // 2. Create Campaign Recipients
        const recipients: CampaignRecipient[] = validLeads.map(l => ({
          id: generateId(),
          campaignId,
          businessName: l.businessName,
          phone: normalizePhone(l.phone!),
          email: l.email,
          website: l.website,
          city: l.city,
          category: l.category,
          address: l.address,
          status: 'pending'
        }));

        await addCampaignRecipients(recipients);

        // 3. Save Import History
        const importHist: ImportHistory = {
          id: generateId(),
          fileName: file?.name || 'Unknown',
          importType: source as 'csv'|'excel'|'json',
          date: new Date().toISOString(),
          recordsImported: parsedData.length,
          validRecords: validLeads.length,
          invalidRecords: mappedLeads.length - validLeads.length,
          duplicatesRemoved: duplicateCount
        };
        await addImportHistory(importHist);
      }

      // 4. Create Campaign
      const campaign: WhatsAppCampaign = {
        id: campaignId,
        name: name.trim(),
        source,
        projectId: finalProjectId || undefined,
        messageTemplate: messageTemplate.trim(),
        imageUrl: attachments[0] || null,
        attachments: attachments,
        createdAt: new Date().toISOString(),
      };

      await addWhatsAppCampaign(campaign);
      onToast('Campaign created successfully', 'success');
      onSuccess();
    } catch (err: any) {
      onToast(err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass-card max-w-4xl w-full max-h-[90vh] flex flex-col"
      >
        <div className="p-5 border-b border-[var(--border-secondary)] flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">{initialCampaign ? 'Edit WhatsApp Campaign' : 'Create WhatsApp Campaign'}</h2>
          <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 bg-[var(--bg-primary)]">
          {step === 'setup' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <Input
                label="Campaign Name"
                placeholder="e.g., Summer Dentists Outreach"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
              />

              {!initialCampaign && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Lead Source</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { id: 'project', label: 'Project', icon: <FileText size={16}/> },
                      { id: 'csv', label: 'CSV Upload', icon: <FileText size={16}/> },
                      { id: 'excel', label: 'Excel (.xlsx)', icon: <FileSpreadsheet size={16}/> },
                      { id: 'json', label: 'JSON Upload', icon: <FileJson size={16}/> },
                    ].map(s => (
                      <button
                        key={s.id}
                        onClick={() => setSource(s.id as LeadSource)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                          source === s.id 
                            ? 'border-brand-500 bg-brand-500/10 text-brand-400' 
                            : 'border-[var(--border-secondary)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--border-primary)]'
                        }`}
                      >
                        {s.icon}
                        <span className="text-sm font-medium">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!initialCampaign && (
                source === 'project' ? (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Select Project</label>
                    <select
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:border-brand-500 outline-none"
                      value={selectedProjectId}
                      onChange={e => setSelectedProjectId(e.target.value)}
                    >
                      <option value="" disabled>Select a project...</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.validWhatsAppLeadCount} WhatsApp leads)
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Upload {source.toUpperCase()} File</label>
                    <div className="relative w-full h-32 border-2 border-dashed border-[var(--border-primary)] hover:border-brand-500/50 rounded-xl bg-[var(--bg-secondary)] flex flex-col items-center justify-center transition-all group overflow-hidden">
                      <input 
                        type="file" 
                        accept={source === 'csv' ? '.csv' : source === 'excel' ? '.xlsx, .xls' : '.json'} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleImportFile(file);
                        }} 
                        disabled={isProcessing}
                      />
                      <UploadCloud size={24} className="text-[var(--text-tertiary)] group-hover:text-brand-400 mb-2 transition-colors" />
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {isProcessing ? 'Processing...' : `Drag & Drop ${source.toUpperCase()}`}
                      </p>
                    </div>
                  </div>
                )
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Message Template</label>
                </div>
                <textarea
                  className="w-full h-32 px-3.5 py-2.5 rounded-xl text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:border-brand-500 outline-none resize-none"
                  value={messageTemplate}
                  onChange={e => setMessageTemplate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Attachments (Images/Videos)</label>
                
                {attachments.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
                    {attachments.map((att, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-[var(--border-secondary)] group bg-[var(--bg-primary)]">
                        {att.startsWith('data:video/') ? (
                          <video src={att} className="w-full h-full object-cover" />
                        ) : (
                          <img src={att} alt={`Attachment ${idx+1}`} className="w-full h-full object-cover" />
                        )}
                        <button 
                          onClick={() => removeAttachment(idx)}
                          className="absolute top-1.5 right-1.5 p-1.5 bg-black/60 hover:bg-red-500 rounded-full text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="relative w-full h-24 border-2 border-dashed border-[var(--border-primary)] hover:border-brand-500/50 rounded-xl bg-[var(--bg-secondary)] flex flex-col items-center justify-center transition-all group overflow-hidden">
                  <input 
                    type="file" 
                    multiple
                    accept="image/*, video/*" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    onChange={e => e.target.files?.length && handleAttachments(e.target.files)} 
                  />
                  <UploadCloud size={20} className="text-[var(--text-tertiary)] group-hover:text-brand-400 mb-1 transition-colors" />
                  <p className="text-sm font-medium text-[var(--text-primary)]">Add More Files</p>
                </div>
              </div>
            </div>
          )}

          {step === 'mapping' && (
            <ImportMappingUI 
              fileHeaders={fileHeaders}
              mapping={mapping}
              onMappingChange={(target, source) => setMapping(p => ({ ...p, [target]: source }))}
              onConfirm={processMapping}
              onCancel={() => setStep('setup')}
            />
          )}

          {step === 'preview' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-secondary)] space-y-4">
                <h3 className="font-semibold text-lg">Save Options</h3>
                <div className="flex gap-4">
                  <button
                    onClick={() => setSaveToProject(false)}
                    className={`flex-1 p-4 rounded-xl border ${!saveToProject ? 'border-brand-500 bg-brand-500/10 text-brand-400' : 'border-[var(--border-secondary)]'}`}
                  >
                    Use Only in Campaign
                  </button>
                  <button
                    onClick={() => setSaveToProject(true)}
                    className={`flex-1 p-4 rounded-xl border ${saveToProject ? 'border-brand-500 bg-brand-500/10 text-brand-400' : 'border-[var(--border-secondary)]'}`}
                  >
                    Save to Project
                  </button>
                </div>

                {saveToProject && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <select
                      className="px-3.5 py-2.5 rounded-xl text-sm bg-[var(--bg-tertiary)] border border-[var(--border-primary)]"
                      value={saveProjectId}
                      onChange={e => setSaveProjectId(e.target.value)}
                    >
                      <option value="new">-- Create New Project --</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    {saveProjectId === 'new' && (
                      <Input
                        placeholder="New Project Name"
                        value={newProjectName}
                        onChange={e => setNewProjectName(e.target.value)}
                      />
                    )}
                  </div>
                )}
              </div>

              <ImportPreviewTable
                data={mappedLeads}
                totalRecords={parsedData.length}
                validRecords={mappedLeads.filter(l => !!l.phone).length}
                invalidRecords={mappedLeads.length - mappedLeads.filter(l => !!l.phone).length}
                duplicatesRemoved={duplicateCount}
              />
            </div>
          )}
        </div>

        <div className="p-5 border-t border-[var(--border-secondary)] flex justify-end gap-3 bg-[var(--bg-tertiary)]">
          <Button variant="secondary" onClick={onClose} disabled={isProcessing}>Cancel</Button>
          
          {step === 'setup' && (initialCampaign || source === 'project') && (
            <Button variant="primary" onClick={handleCreate} disabled={!name || (!initialCampaign && !selectedProjectId) || isProcessing} isLoading={isProcessing}>
              {initialCampaign ? 'Update Campaign' : 'Create Campaign'}
            </Button>
          )}

          {step === 'preview' && (
            <Button variant="primary" onClick={handleCreate} disabled={isProcessing} isLoading={isProcessing}>
              Confirm & Create Campaign
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
