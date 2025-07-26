import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Users, UserPlus, UserMinus, Loader2, Save } from 'lucide-react';
import { TrainingGroup, Runner } from '../../types/database';
import { useGroupMemberships } from '../../hooks/useGroupMemberships';
import { useRunners } from '../../hooks/useRunners';

interface MemberManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: TrainingGroup | null;
}

const MemberManagementModal: React.FC<MemberManagementModalProps> = ({
  isOpen,
  onClose,
  group
}) => {
  const { runners } = useRunners();
  const { 
    getGroupMembers, 
    updateGroupMemberships, 
    loading: membershipsLoading 
  } = useGroupMemberships();

  const [availableRunners, setAvailableRunners] = useState<Runner[]>([]);
  const [currentMembers, setCurrentMembers] = useState<Runner[]>([]);
  const [availableSearch, setAvailableSearch] = useState('');
  const [membersSearch, setMembersSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize lists when modal opens
  useEffect(() => {
    if (isOpen && group) {
      initializeLists();
    }
  }, [isOpen, group, runners]);

  const initializeLists = () => {
    if (!group) return;

    const groupMemberIds = getGroupMembers(group.id);
    const members = runners.filter(runner => groupMemberIds.includes(runner.id));
    const available = runners.filter(runner => !groupMemberIds.includes(runner.id) && !runner.is_archived);

    setCurrentMembers(members);
    setAvailableRunners(available);
    setHasChanges(false);
  };

  const filteredAvailable = availableRunners.filter(runner =>
    runner.name.toLowerCase().includes(availableSearch.toLowerCase())
  );

  const filteredMembers = currentMembers.filter(runner =>
    runner.name.toLowerCase().includes(membersSearch.toLowerCase())
  );

  const addRunner = (runner: Runner) => {
    setAvailableRunners(prev => prev.filter(r => r.id !== runner.id));
    setCurrentMembers(prev => [...prev, runner]);
    setHasChanges(true);
  };

  const removeRunner = (runner: Runner) => {
    setCurrentMembers(prev => prev.filter(r => r.id !== runner.id));
    setAvailableRunners(prev => [...prev, runner]);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!group || !hasChanges) return;

    setSaving(true);
    try {
      const memberIds = currentMembers.map(member => member.id);
      await updateGroupMemberships(group.id, memberIds);
      setHasChanges(false);
      onClose();
    } catch (error) {
      console.error('Error saving memberships:', error);
    } finally {
      setSaving(false);
    }
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const getFitnessLevelLabel = (level: string) => {
    const labels = {
      beginner: 'Iniciante',
      intermediate: 'Intermediário',
      advanced: 'Avançado',
      professional: 'Profissional'
    };
    return labels[level as keyof typeof labels] || level;
  };

  if (!isOpen || !group) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[80vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  Gerenciar Membros do Grupo
                </h2>
                <p className="text-blue-100">
                  {group.name}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-blue-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
              {/* Available Runners */}
              <div className="border-r border-slate-200 flex flex-col">
                <div className="p-6 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Corredores Disponíveis ({filteredAvailable.length})
                  </h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Buscar corredores..."
                      value={availableSearch}
                      onChange={(e) => setAvailableSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                    />
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  {filteredAvailable.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">
                        {availableSearch ? 'Nenhum corredor encontrado' : 'Todos os corredores já estão no grupo'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredAvailable.map((runner) => (
                        <motion.div
                          key={runner.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-slate-50 rounded-lg p-3 flex items-center justify-between hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-900">{runner.name}</h4>
                            <div className="flex items-center gap-4 text-xs text-slate-600 mt-1">
                              {runner.birth_date && (
                                <span>{calculateAge(runner.birth_date)} anos</span>
                              )}
                              <span>{getFitnessLevelLabel(runner.fitness_level)}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => addRunner(runner)}
                            className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-1 text-sm"
                          >
                            Adicionar
                            <UserPlus className="w-3 h-3" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Current Members */}
              <div className="flex flex-col">
                <div className="p-6 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Membros Atuais ({filteredMembers.length})
                  </h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Buscar membros..."
                      value={membersSearch}
                      onChange={(e) => setMembersSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                    />
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  {filteredMembers.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">
                        {membersSearch ? 'Nenhum membro encontrado' : 'Nenhum membro no grupo'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredMembers.map((runner) => (
                        <motion.div
                          key={runner.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-blue-50 rounded-lg p-3 flex items-center justify-between hover:bg-blue-100 transition-colors"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-900">{runner.name}</h4>
                            <div className="flex items-center gap-4 text-xs text-slate-600 mt-1">
                              {runner.birth_date && (
                                <span>{calculateAge(runner.birth_date)} anos</span>
                              )}
                              <span>{getFitnessLevelLabel(runner.fitness_level)}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => removeRunner(runner)}
                            className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-colors flex items-center gap-1 text-sm"
                          >
                            <UserMinus className="w-3 h-3" />
                            Remover
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">
                {hasChanges && (
                  <span className="text-orange-600 font-medium">
                    ⚠️ Você tem alterações não salvas
                  </span>
                )}
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                
                <button
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                  <Save className="w-4 h-4" />
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MemberManagementModal;