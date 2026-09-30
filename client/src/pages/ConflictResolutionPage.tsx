import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitMerge,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FolderGit2,
} from 'lucide-react';
import { useRepositoryContext } from '../context/RepositoryContext.js';
import { useConflicts } from '../hooks/useConflicts.js';
import { ConflictList } from '../components/conflicts/ConflictList.js';
import { ConflictViewer } from '../components/conflicts/ConflictViewer.js';
import { AIAnalysis } from '../components/ai/AIAnalysis.js';
import { Button } from '../components/common/Button.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { Toast } from '../components/common/Toast.js';

export const ConflictResolutionPage: React.FC = () => {
  const { currentRepo, activeSessionId } = useRepositoryContext();
  const {
    session,
    conflicts,
    selectedConflict,
    setSelectedConflict,
    loadSession,
    approveConflict,
    editConflict,
    refineWithPrompt,
    rejectConflict,
    loading,
  } = useConflicts();

  const [isEditing, setIsEditing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedChangeIndex, setSelectedChangeIndex] = useState<number | null>(0);
  const [toast, setToast] = useState<{ type: any; title: string; message?: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (activeSessionId) {
      loadSession(activeSessionId);
    }
  }, [activeSessionId, loadSession]);

  const handleAccept = async () => {
    if (!selectedConflict) return;
    setIsProcessing(true);
    try {
      await approveConflict(selectedConflict._id);
      setToast({
        type: 'success',
        title: 'Resolution Approved',
        message: `AI resolution approved for ${selectedConflict.filePath}`,
      });
      setIsEditing(false);
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Approval Failed',
        message: err.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveModified = async (modifiedCode: string) => {
    if (!selectedConflict) return;
    setIsProcessing(true);
    try {
      await editConflict(selectedConflict._id, modifiedCode);
      setToast({
        type: 'success',
        title: 'Custom Resolution Saved',
        message: `Your modified code was approved for ${selectedConflict.filePath}`,
      });
      setIsEditing(false);
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Save Failed',
        message: err.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedConflict) return;
    setIsProcessing(true);
    try {
      await rejectConflict(selectedConflict._id, 'Developer rejected AI proposal');
      setToast({
        type: 'warning',
        title: 'Resolution Rejected',
        message: `Resolution rejected for ${selectedConflict.filePath}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkReview = async () => {
    if (!selectedConflict) return;
    setToast({
      type: 'info',
      title: 'Flagged for Human Review',
      message: 'This conflict has been marked for manual team discussion.',
    });
  };

  const handleRefineWithPrompt = async (userPrompt: string) => {
    if (!selectedConflict) return;
    try {
      const result = await refineWithPrompt(selectedConflict._id, userPrompt);
      setToast({
        type: 'success',
        title: 'Resolution Updated',
        message: `AI customized resolution according to your prompt.`,
      });
      setSelectedChangeIndex(0);
      return result;
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Refinement Failed',
        message: err.message,
      });
      throw err;
    }
  };

  const allApproved =
    conflicts.length > 0 &&
    conflicts.every((c) => c.status === 'APPROVED' || c.status === 'APPLIED');

  if (!activeSessionId || (!loading && conflicts.length === 0)) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <EmptyState
          icon={<GitMerge className="w-12 h-12 text-[#58a6ff]" />}
          title="No Active Conflict Session"
          description="Start a merge analysis between two branches from the Repository page to view and resolve conflicts."
          action={
            <Button onClick={() => navigate('/repository')} icon={<ArrowRight className="w-4 h-4" />}>
              Go to Branch Selector
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#0d1117]">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50">
          <Toast
            type={toast.type}
            title={toast.title}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {/* Top Session Status Bar */}
      <div className="h-12 bg-[#161b22] border-b border-[#30363d] px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-white font-medium">
            <GitMerge className="w-4 h-4 text-[#58a6ff]" />
            <span>Resolving:</span>
            <span className="text-[#58a6ff]">{session?.sourceBranch}</span>
            <span className="text-[#8b949e]">→</span>
            <span className="text-[#3fb950]">{session?.targetBranch}</span>
          </div>

          <span className="text-[#8b949e]">|</span>

          <span className="text-[#8b949e]">
            {conflicts.filter((c) => c.status === 'APPROVED' || c.status === 'APPLIED').length} of{' '}
            {conflicts.length} files approved
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant={allApproved ? 'primary' : 'outline'}
            onClick={() => navigate('/verification')}
            icon={<ShieldCheck className="w-4 h-4" />}
          >
            {allApproved ? 'Proceed to Verification & Commit' : 'View Verification Status'}
          </Button>
        </div>
      </div>

      {/* Main 3-Pane Conflict Studio */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: Conflict List */}
        <ConflictList
          conflicts={conflicts}
          selectedConflictId={selectedConflict?._id || null}
          onSelectConflict={(c) => {
            setSelectedConflict(c);
            setIsEditing(false);
            setSelectedChangeIndex(0);
          }}
        />

        {/* Center: Monaco Diff / Editor / AI Highlights */}
        <div className="flex-1 min-w-0 h-full overflow-hidden">
          {selectedConflict ? (
            <ConflictViewer
              conflict={selectedConflict}
              isEditing={isEditing}
              onEditToggle={() => setIsEditing(!isEditing)}
              onSaveModifiedResolution={handleSaveModified}
              selectedChangeIndex={selectedChangeIndex}
              onSelectChangeIndex={setSelectedChangeIndex}
              onRefineConflict={handleRefineWithPrompt}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-[#8b949e]">
              Select a conflict from the sidebar to inspect diff and AI analysis
            </div>
          )}
        </div>

        {/* Right: AI Intent Analysis Panel with Chatbot */}
        {selectedConflict && (
          <div className="w-[420px] shrink-0 h-full overflow-hidden">
            <AIAnalysis
              conflict={selectedConflict}
              onAccept={handleAccept}
              onEditToggle={() => setIsEditing(!isEditing)}
              onReject={handleReject}
              onMarkReview={handleMarkReview}
              isEditing={isEditing}
              isProcessing={isProcessing}
              onRefineConflict={handleRefineWithPrompt}
              selectedChangeIndex={selectedChangeIndex}
              onSelectChange={setSelectedChangeIndex}
            />
          </div>
        )}
      </div>
    </div>
  );
};
