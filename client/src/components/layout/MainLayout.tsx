import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar.js';
import { Header } from './Header.js';
import { RepositorySelector } from '../repository/RepositorySelector.js';
import { Modal } from '../common/Modal.js';
import { useRepositoryContext } from '../../context/RepositoryContext.js';

export const MainLayout: React.FC = () => {
  const { currentRepo, openRepo } = useRepositoryContext();
  const [isRepoModalOpen, setIsRepoModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleRepoSelected = async (path: string) => {
    try {
      await openRepo(path);
      setIsRepoModalOpen(false);
      navigate('/repository');
    } catch {
      // Error handled inside hook/selector
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0d1117] text-[#c9d1d9]">
      <Sidebar />
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
        <Header
          currentRepo={currentRepo}
          onOpenRepoClick={() => setIsRepoModalOpen(true)}
        />
        <main className="flex-1 overflow-y-auto bg-[#0d1117] relative">
          <Outlet />
        </main>
      </div>

      <Modal
        isOpen={isRepoModalOpen}
        onClose={() => setIsRepoModalOpen(false)}
        title="Open Local Git Repository"
        maxWidth="xl"
      >
        <RepositorySelector onSelectRepository={handleRepoSelected} />
      </Modal>
    </div>
  );
};
