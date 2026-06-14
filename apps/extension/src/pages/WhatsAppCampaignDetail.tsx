import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import { Card, Badge, EmptyState } from '@/components/ui/SharedComponents';
import {
  getAllWhatsAppCampaigns, getLeadsByProject, updateLead, getRecipientsByCampaign, updateCampaignRecipient
} from '@/services/database';
import { getSettings, saveSettings } from '@/services/storage';
import { cn } from '@/utils/formatters';
import type { WhatsAppCampaign, Lead, Settings } from '@/types';
import {
  ArrowLeft, MessageCircle, Copy, ExternalLink, CheckCircle, ChevronLeft, ChevronRight, Save, Image as ImageIcon, Activity, Play, Square
} from 'lucide-react';
import { executeAutoSend } from '@/services/whatsapp-automation';

interface WhatsAppCampaignDetailProps {
  campaignId: string;
  onBack: () => void;
  onToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

interface Diagnostics {
  whatsappUrl: string;
  tabId: number | null;
  loggedIn: boolean | 'Unknown';
  currentUrl: string;
  lastError: string | null;
}

export default function WhatsAppCampaignDetail({ campaignId, onBack, onToast }: WhatsAppCampaignDetailProps) {
  const [campaign, setCampaign] = useState<WhatsAppCampaign | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentIndex, setCurrentIndex] = useState(0);

  const [settings, setSettings] = useState<Settings | null>(null);
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Auto Mode State
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const isAutoRunningRef = useRef(false);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${time}] ${msg}`]);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [campaigns, userSettings] = await Promise.all([
        getAllWhatsAppCampaigns(),
        getSettings()
      ]);
      setSettings(userSettings);
      const camp = campaigns.find(c => c.id === campaignId);
      setCampaign(camp || null);
      
      if (camp) {
        let validLeads: any[] = [];
        
        if (camp.source === 'project' || !camp.source) {
          const projectLeads = await getLeadsByProject(camp.projectId || '');
          validLeads = projectLeads.filter(l => !!l.phone);
        } else {
          const recipients = await getRecipientsByCampaign(camp.id);
          validLeads = recipients.filter(l => !!l.phone).map(r => ({
            ...r,
            contacted: r.status === 'contacted',
            fullAddress: r.address || '',
          }));
        }
        
        // Sort leads: Uncontacted first, then contacted
        validLeads.sort((a, b) => {
          if (a.contacted === b.contacted) return 0;
          return a.contacted ? 1 : -1;
        });
        
        setLeads(validLeads);
      }
    } catch (err) {
      console.error('Failed to load campaign:', err);
    } finally {
      setIsLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentLead = leads[currentIndex] || null;

  const resolvedMessage = useMemo(() => {
    if (!campaign || !currentLead) return '';
    let msg = campaign.messageTemplate;
    msg = msg.replace(/\{\{businessName\}\}/g, currentLead.businessName || '');
    msg = msg.replace(/\{\{category\}\}/g, currentLead.category || '');
    msg = msg.replace(/\{\{city\}\}/g, currentLead.city || '');
    msg = msg.replace(/\{\{phone\}\}/g, currentLead.phone || '');
    msg = msg.replace(/\{\{website\}\}/g, currentLead.website || '');
    msg = msg.replace(/\{\{address\}\}/g, currentLead.fullAddress || '');
    return msg;
  }, [campaign, currentLead]);

  const handleNext = () => {
    if (currentIndex < leads.length - 1) setCurrentIndex(prev => prev + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  async function handleMarkContacted(status: boolean) {
    if (!currentLead) return;
    
    if (campaign?.source === 'project' || !campaign?.source) {
      await updateLead(currentLead.id, {
        contacted: status,
        contactedAt: (status ? new Date().toISOString() : null) as any
      });
    } else {
      await updateCampaignRecipient(currentLead.id, {
        status: status ? 'contacted' : 'pending',
        contactedAt: (status ? new Date().toISOString() : null) as any
      });
    }
    
    // Update local state to reflect UI instantly
    setLeads(prev => prev.map(l => l.id === currentLead.id ? { ...l, contacted: status, contactedAt: (status ? new Date().toISOString() : null) as any } : l));
    onToast?.(status ? 'Marked as Contacted' : 'Marked as Pending', 'success');
  }

  async function handleCopyMessage() {
    await navigator.clipboard.writeText(resolvedMessage);
    onToast?.('Message copied to clipboard', 'success');
  }
  
  async function handleCopyNumber() {
    if (currentLead?.phone) {
      await navigator.clipboard.writeText(currentLead.phone);
      onToast?.('Phone number copied to clipboard', 'success');
    }
  }

  async function handleOpenWhatsApp() {
    if (!currentLead?.phone) return;
    
    setLogs([]);
    setShowDiagnostics(true);
    addLog('Starting WhatsApp open sequence...');

    const diagState: Diagnostics = {
      whatsappUrl: '',
      tabId: null,
      loggedIn: 'Unknown',
      currentUrl: '',
      lastError: null
    };
    setDiagnostics(diagState);

    // --- PHONE NORMALIZATION ---
    addLog(`Original Number: ${currentLead.phone}`);
    const originalPhone = currentLead.phone;
    let formattedPhone = originalPhone.replace(/\D/g, '');
    const defaultCC = (settings?.defaultCountryCode || '91').replace(/\D/g, '');

    // If it has a plus, it's already an international number
    if (!originalPhone.includes('+')) {
      if (formattedPhone.startsWith('0')) {
        // Starts with local zero
        formattedPhone = formattedPhone.substring(1);
        formattedPhone = defaultCC + formattedPhone;
      } else if (formattedPhone.length <= 10) {
        // Likely a local number missing the country code (e.g., 9876543210)
        // Only prefix if it doesn't already start with the country code (unless it's exactly 10 digits in India which can start with 91)
        if (formattedPhone.length === 10 && defaultCC === '91' && formattedPhone.startsWith('91')) {
          formattedPhone = defaultCC + formattedPhone; // India number starting with 91 (e.g. 9123456789)
        } else if (!formattedPhone.startsWith(defaultCC)) {
          formattedPhone = defaultCC + formattedPhone;
        }
      }
    }

    addLog(`Normalized Number: ${formattedPhone}`);

    // --- VALIDATION ---
    if (formattedPhone.length < 8 || formattedPhone.length > 15) {
      const errMsg = `Validation Failed: Length ${formattedPhone.length} is invalid (must be 8-15 digits)`;
      addLog(errMsg);
      diagState.lastError = errMsg;
      setDiagnostics({ ...diagState });
      onToast?.('Invalid phone number. Must be 8-15 digits long.', 'error');
      return;
    }
    
    const encodedMessage = encodeURIComponent(resolvedMessage);
    addLog(`Message Encoded: ${encodedMessage.substring(0, 20)}...`);
    
    const isDesktopMode = settings?.whatsAppMode === 'desktop';
    
    if (isDesktopMode) {
      const url = `whatsapp://send?phone=${formattedPhone}&text=${encodedMessage}`;
      diagState.whatsappUrl = url;
      setDiagnostics({ ...diagState });
      addLog(`Opening Desktop URL: ${url}`);
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    const sendUrl = `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;
    diagState.whatsappUrl = sendUrl;
    setDiagnostics({ ...diagState });
    addLog(`Generated Final URL: ${sendUrl}`);

    if (typeof chrome === 'undefined' || !chrome.tabs) {
      addLog('Chrome tabs API unavailable. Using fallback window.open');
      window.open(sendUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    try {
      addLog('Searching for existing WhatsApp Web tabs...');
      const tabs = await chrome.tabs.query({ url: "*://web.whatsapp.com/*" });
      let waTab = (tabs?.length || 0) > 0 ? tabs[0] : null;

      let isNewTab = false;

      if (!waTab) {
        addLog('No existing WhatsApp tab found. Creating new tab directly to sendUrl...');
        // Create new tab directly to sendUrl to avoid "loading 2 times"
        waTab = await chrome.tabs.create({ url: sendUrl, active: true });
        addLog(`Created new tab with ID: ${waTab.id}`);
        isNewTab = true;
      } else {
        addLog(`Existing WhatsApp tab found. Tab ID: ${waTab.id}`);
        // Focus existing tab
        await chrome.tabs.update(waTab.id!, { active: true });
        addLog('Updated tab to active.');
        const currentWindow = await chrome.windows.getCurrent();
        if (waTab.windowId !== currentWindow.id) {
          await chrome.windows.update(waTab.windowId, { focused: true });
        }
      }

      diagState.tabId = waTab.id || null;
      diagState.currentUrl = waTab.url || 'Unknown';
      setDiagnostics({ ...diagState });

      onToast?.('Checking WhatsApp session...', 'info');
      addLog('Checking WhatsApp Web login state...');

      // Check session
      let loggedIn = false;
      let qrVisible = false;
      let attempts = 0;

      while (attempts < 15) {
        await new Promise(res => setTimeout(res, 1000));
        attempts++;

        try {
          const results = await chrome.scripting.executeScript({
            target: { tabId: waTab.id! },
            func: () => {
              const hasChatSearch = !!document.querySelector('[data-testid="chat-list-search"]') || !!document.querySelector('#side');
              const hasQRCode = !!document.querySelector('[data-testid="qrcode"]') || !!document.querySelector('canvas');
              return { hasChatSearch, hasQRCode };
            }
          });

          if (results && results[0] && results[0].result) {
            const res = results[0].result as { hasChatSearch: boolean; hasQRCode: boolean };
            if (res.hasQRCode) {
              qrVisible = true;
              break;
            }
            if (res.hasChatSearch) {
              loggedIn = true;
              break;
            }
          }
        } catch (e: any) {
          addLog(`Content script injection error: ${e.message}`);
          diagState.lastError = e.message;
          setDiagnostics({ ...diagState });
        }
      }

      if (qrVisible) {
        addLog('QR Code visible. User is NOT logged in.');
        diagState.loggedIn = false;
        setDiagnostics({ ...diagState });
        onToast?.('Please login to WhatsApp Web first.', 'error');
        return; // Stop execution
      }

      if (loggedIn) {
        addLog('WhatsApp Session Found. WhatsApp Logged In.');
        diagState.loggedIn = true;
        setDiagnostics({ ...diagState });
        
        if (!isNewTab) {
          addLog('Navigating via soft React Router injection to avoid hard reload...');
          await chrome.scripting.executeScript({
            target: { tabId: waTab.id! },
            func: (phone, text) => {
              const a = document.createElement('a');
              a.href = `https://web.whatsapp.com/send?phone=${phone}&text=${text}`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            },
            args: [formattedPhone, encodedMessage]
          });
          addLog('Soft navigation successful.');
        } else {
          addLog('Tab is already on sendUrl. No further navigation needed.');
        }

        // Just checking final URL
        const updatedTabs = await chrome.tabs.query({ url: "*://web.whatsapp.com/*" });
        const updatedTab = updatedTabs.find(t => t.id === waTab?.id);
        diagState.currentUrl = updatedTab?.url || sendUrl;
        
        // Check if phone number might be invalid (starts with 0, missing country code)
        if (formattedPhone.startsWith('0')) {
          addLog('WARNING: Phone number starts with 0. WhatsApp requires Country Code (e.g., 91 for India, 44 for UK). This may cause WhatsApp to show a blank chat!');
          onToast?.('Phone number may be missing a country code. Chat might not open.', 'warning');
        }
        
        setDiagnostics({ ...diagState });
      } else {
        addLog('Timeout checking login state. No QR or Chat found.');
        diagState.loggedIn = 'Unknown';
        setDiagnostics({ ...diagState });
        onToast?.('Open WhatsApp manually and try again.', 'warning');
      }

    } catch (err: any) {
      addLog(`Exception occurred: ${err.message}`);
      console.error(err);
      diagState.lastError = err.message;
      setDiagnostics({ ...diagState });
      addLog('Falling back to creating a new tab.');
      chrome.tabs.create({ url: sendUrl });
    }
  }
  const stopAutoCampaign = () => {
    setIsAutoRunning(false);
    isAutoRunningRef.current = false;
    onToast?.('Auto-Sender stopped.', 'info');
  };

  const startAutoCampaign = async () => {
    if (!settings || leads.length === 0) return;
    
    // Check daily limit
    const todayStr = new Date().toISOString().split('T')[0];
    let sentToday = settings.whatsappSentToday?.date === todayStr ? (settings.whatsappSentToday.count || 0) : 0;
    const dailyLimit = settings.whatsappDailyLimit || 40;

    if (sentToday >= dailyLimit) {
       onToast?.(`Daily limit of ${dailyLimit} reached. Please wait until tomorrow.`, 'warning');
       return;
    }

    setIsAutoRunning(true);
    isAutoRunningRef.current = true;
    
    const minDelay = settings.whatsappMinDelay || 30;
    const maxDelay = settings.whatsappMaxDelay || 120;
    
    let tempIndex = currentIndex;
    let currentSentToday = sentToday;

    onToast?.('Starting Auto-Sender...', 'success');

    while (isAutoRunningRef.current && tempIndex < leads.length) {
       const lead = leads[tempIndex];
       
       if (lead.contacted) {
          tempIndex++;
          setCurrentIndex(tempIndex);
          continue;
       }

       if (currentSentToday >= dailyLimit) {
          onToast?.(`Daily limit of ${dailyLimit} reached. Stopping.`, 'info');
          break;
       }

       setCurrentIndex(tempIndex);
       
       try {
         // Resolve message
         let msg = campaign?.messageTemplate || '';
         msg = msg.replace(/\{\{businessName\}\}/g, lead.businessName || '');
         msg = msg.replace(/\{\{category\}\}/g, lead.category || '');
         msg = msg.replace(/\{\{city\}\}/g, lead.city || '');
         msg = msg.replace(/\{\{phone\}\}/g, lead.phone || '');
         msg = msg.replace(/\{\{website\}\}/g, lead.website || '');
         msg = msg.replace(/\{\{address\}\}/g, lead.fullAddress || '');

         // Normalize Phone
         let formattedPhone = (lead.phone || '').replace(/\D/g, '');
         const defaultCC = (settings?.defaultCountryCode || '91').replace(/\D/g, '');
         if (!lead.phone?.includes('+')) {
           if (formattedPhone.startsWith('0')) formattedPhone = defaultCC + formattedPhone.substring(1);
           else if (formattedPhone.length <= 10 && !formattedPhone.startsWith(defaultCC)) formattedPhone = defaultCC + formattedPhone;
         }

         if (formattedPhone.length < 8) {
           onToast?.(`Skipped ${lead.businessName} (Invalid phone)`, 'warning');
           tempIndex++;
           continue;
         }

         // Open tab without text URL parameter to force typing simulation
         const sendUrl = `https://web.whatsapp.com/send?phone=${formattedPhone}`;
         
         const tabs = await chrome.tabs.query({ url: "*://web.whatsapp.com/*" });
         let waTab = (tabs?.length || 0) > 0 ? tabs[0] : null;

         if (!waTab) {
           waTab = await chrome.tabs.create({ url: sendUrl, active: true });
         } else {
           await chrome.tabs.update(waTab.id!, { active: true });
           await chrome.scripting.executeScript({
             target: { tabId: waTab.id! },
             func: (url) => { window.location.href = url; },
             args: [sendUrl]
           });
         }

         // Wait for page to load
         await new Promise(r => setTimeout(r, 4000));

         // Execute DOM automation
         await executeAutoSend(waTab.id!, msg, campaign?.attachments || (campaign?.imageUrl ? [campaign.imageUrl] : []), settings?.osType || 'mac');
         
         // Update state
         currentSentToday++;
         await saveSettings({ whatsappSentToday: { date: todayStr, count: currentSentToday } });
         setSettings(prev => prev ? { ...prev, whatsappSentToday: { date: todayStr, count: currentSentToday } } : prev);
         
         await updateLead(lead.id, { contacted: true, contactedAt: new Date().toISOString() });
         setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, contacted: true } : l));

       } catch (err: any) {
         console.error("Auto send failed", err);
         onToast?.(`Failed sending to ${lead.businessName}: ${err.message}`, 'error');
         break;
       }

       // Next Lead & Delay
       tempIndex++;
       if (tempIndex >= leads.length) break;
       
       const waitTime = Math.floor(Math.random() * (maxDelay - minDelay + 1) + minDelay);
       onToast?.(`Waiting ${waitTime}s before next message...`, 'info');
       
       for(let i=0; i < waitTime && isAutoRunningRef.current; i++) {
         await new Promise(r => setTimeout(r, 1000));
       }
    }
    
    setIsAutoRunning(false);
    isAutoRunningRef.current = false;
    onToast?.('Auto-Sender Finished.', 'success');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-[var(--text-secondary)]">Loading campaign...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <EmptyState
        icon={<MessageCircle size={32} />}
        title="Campaign not found"
        description="This campaign may have been deleted."
        action={<Button variant="primary" onClick={onBack}>Back to Campaigns</Button>}
      />
    );
  }

  if (leads.length === 0) {
    return (
      <EmptyState
        icon={<MessageCircle size={32} />}
        title="No WhatsApp-ready leads"
        description="The selected project does not have any leads with phone numbers."
        action={<Button variant="primary" onClick={onBack}>Back to Campaigns</Button>}
      />
    );
  }

  const contactedCount = leads.filter(l => l.contacted).length;
  const progress = Math.round((contactedCount / leads.length) * 100);

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back to Campaigns
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="p-1.5 rounded-lg bg-green-500/10 text-green-500">
                <MessageCircle size={18} />
              </span>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">{campaign.name}</h1>
            </div>
            <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
              <span>{leads.length} Valid Leads</span>
              <span className="w-1 h-1 rounded-full bg-[var(--border-secondary)]" />
              <span className="text-green-400">{contactedCount} Contacted</span>
              {settings?.whatsappSendMode === 'auto' && (
                <>
                  <span className="w-1 h-1 rounded-full bg-[var(--border-secondary)]" />
                  <span className="text-brand-400 font-medium">
                    Today's Quota: {settings?.whatsappSentToday?.date === new Date().toISOString().split('T')[0] ? (settings.whatsappSentToday.count || 0) : 0} / {settings?.whatsappDailyLimit || 40}
                  </span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="text-right">
                <div className="text-sm font-semibold text-[var(--text-primary)]">{progress}% Complete</div>
                <div className="w-32 h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden mt-1">
                   <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
             </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: List / Navigation */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="flex flex-col h-[calc(100vh-220px)] overflow-hidden !p-0">
             <div className="p-4 border-b border-[var(--border-secondary)] bg-[var(--bg-secondary)]">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Lead Queue</h3>
             </div>
             <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {leads.map((lead, idx) => (
                  <button
                    key={lead.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={cn(
                      'w-full flex items-center justify-between p-3 rounded-xl text-left transition-all',
                      currentIndex === idx
                        ? 'bg-brand-500/10 border-brand-500/30 border'
                        : 'border border-transparent hover:bg-[var(--bg-tertiary)]'
                    )}
                  >
                    <div className="truncate pr-2">
                       <div className={cn(
                         "text-sm font-medium truncate",
                         currentIndex === idx ? 'text-brand-400' : 'text-[var(--text-primary)]'
                       )}>
                          {lead.businessName}
                       </div>
                       <div className="text-xs text-[var(--text-tertiary)] truncate mt-0.5">
                          {lead.phone}
                       </div>
                    </div>
                    {lead.contacted && (
                       <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                    )}
                  </button>
                ))}
             </div>
          </Card>
        </div>

        {/* Right Column: Execution */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="relative overflow-hidden flex flex-col h-[calc(100vh-220px)]">
             {/* Progress / Nav Header */}
             <div className="flex items-center justify-between pb-4 border-b border-[var(--border-secondary)]">
                <div className="flex items-center gap-3">
                   <Badge variant={currentLead?.contacted ? 'success' : 'default'} size="sm">
                      {currentLead?.contacted ? 'Contacted' : 'Not Contacted'}
                   </Badge>
                   <span className="text-sm text-[var(--text-tertiary)]">
                      Lead {currentIndex + 1} of {leads.length}
                   </span>
                </div>
                <div className="flex items-center gap-2">
                   <Button variant="secondary" onClick={handlePrev} disabled={currentIndex === 0} icon={<ChevronLeft size={16} />}>
                      Prev
                   </Button>
                   <Button variant="secondary" onClick={handleNext} disabled={currentIndex === leads.length - 1}>
                      Next <ChevronRight size={16} className="ml-1" />
                   </Button>
                </div>
             </div>
             
             {/* Lead Details */}
             <div className="py-6 flex-1 overflow-y-auto">
                <div className="mb-6">
                   <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">{currentLead?.businessName}</h2>
                   <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--text-secondary)]">
                      <span>{currentLead?.category}</span>
                      {currentLead?.city && <span>• {currentLead.city}</span>}
                   </div>
                </div>
                
                {/* Message Preview */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-5 mb-6 relative">
                   <div className="absolute top-4 right-4 flex gap-2">
                      <button onClick={handleCopyNumber} className="p-1.5 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-secondary)] hover:text-brand-400 transition-colors" title="Copy Number">
                         <Copy size={14} />
                      </button>
                   </div>
                   <h4 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">Message Preview</h4>
                   <div className="whitespace-pre-wrap text-sm text-[var(--text-primary)] font-medium leading-relaxed">
                      {resolvedMessage}
                   </div>
                </div>

                {/* Optional Attachments */}
                {(campaign.attachments?.length ? campaign.attachments : (campaign.imageUrl ? [campaign.imageUrl] : [])).length > 0 && (
                   <div className="mb-6">
                      <h4 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">Attachments</h4>
                      
                      <div className="text-sm text-[var(--text-secondary)] bg-[var(--bg-secondary)] p-3 rounded-xl border border-brand-500/20 mb-4">
                         <p className="font-semibold text-brand-400 mb-1 flex items-center gap-1.5"><ImageIcon size={14} /> Attachment Info</p>
                         If you are using Auto-Sender, attachments will be pasted automatically. For manual Click-to-Chat, keep these files handy to attach them manually.
                      </div>

                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {(campaign.attachments?.length ? campaign.attachments : (campaign.imageUrl ? [campaign.imageUrl] : [])).map((att, idx) => (
                           <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-[var(--border-secondary)] bg-[var(--bg-primary)] shadow-sm">
                              {att.startsWith('data:video/') ? (
                                <video src={att} controls className="w-full h-full object-cover" />
                              ) : (
                                <img src={att} alt={`Attachment ${idx+1}`} className="w-full h-full object-cover" />
                              )}
                           </div>
                        ))}
                      </div>
                   </div>
                )}


             </div>

             {/* Actions Footer */}
             <div className="pt-4 border-t border-[var(--border-secondary)] flex items-center justify-between">
                <div>
                   <Button 
                     variant="ghost" 
                     onClick={() => handleMarkContacted(!currentLead?.contacted)}
                     className={currentLead?.contacted ? 'text-[var(--text-tertiary)] hover:text-red-400' : 'text-[var(--text-secondary)] hover:text-brand-400'}
                   >
                     {currentLead?.contacted ? 'Undo Contacted Status' : 'Mark as Contacted (Skip Send)'}
                   </Button>
                </div>
                <div className="flex items-center gap-3">
                   <Button variant="secondary" icon={<Copy size={16} />} onClick={handleCopyMessage}>
                      Copy Message
                   </Button>
                   {settings?.whatsappSendMode === 'auto' ? (
                     isAutoRunning ? (
                       <Button variant="primary" className="bg-red-600 hover:bg-red-500 text-white shadow-red-500/20" icon={<Square size={16} />} onClick={stopAutoCampaign}>
                          Stop Auto-Sender
                       </Button>
                     ) : (
                       <Button variant="primary" className="bg-brand-600 hover:bg-brand-500 text-white shadow-brand-500/20" icon={<Play size={16} />} onClick={startAutoCampaign}>
                          Start Auto Campaign
                       </Button>
                     )
                   ) : (
                     <Button variant="primary" className="bg-green-600 hover:bg-green-500 text-white shadow-green-500/20" icon={<ExternalLink size={16} />} onClick={handleOpenWhatsApp}>
                        Open WhatsApp
                     </Button>
                   )}
                </div>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
