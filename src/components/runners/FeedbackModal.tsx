import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, MessageSquare, Loader2 } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  training: any;
  existingFeedback: any;
  onSave: (trainingId: string, feedbackText: string, rating: number) => Promise<boolean>;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  training,
  existingFeedback,
  onSave
}) => {
  const [feedbackText, setFeedbackText] = useState('');
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && training) {
      if (existingFeedback) {
        setFeedbackText(existingFeedback.feedback_text || '');
        setRating(existingFeedback.rating || 0);
      } else {
        setFeedbackText('');
        setRating(0);
      }
      setError(null);
    }
  }, [isOpen, training, existingFeedback]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!training) return;
    
    if (!feedbackText.trim()) {
      setError('Por favor, adicione um comentário sobre o treino.');
      return;
    }

    if (rating === 0) {
      setError('Por favor, selecione uma avaliação de 1 a 5 estrelas.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const success = await onSave(training.id, feedbackText.trim(), rating);
      if (success) {
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar feedback');
    } finally {
      setSaving(false);
    }
  };

  const formatTrainingDate = () => {
    if (!training) return '';
    return new Date(training.created_at).toLocaleDateString('pt-BR');
  };

  if (!isOpen || !training) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Feedback do Treino
                </h2>
                <p className="text-blue-100">
                  {training.title} - {formatTrainingDate()}
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
              >
                {error}
              </motion.div>
            )}

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Avaliação do Treino *
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= (hoveredRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-slate-300 hover:text-yellow-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-sm text-slate-600 ml-2">
                  {rating > 0 && `(${rating}/5)`}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                1 = Muito difícil, 5 = Perfeito
              </p>
            </div>

            {/* Feedback Text */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Comentários sobre o Treino *
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={6}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  placeholder="Como foi o treino? O atleta conseguiu completar todas as atividades? Houve alguma dificuldade ou observação importante?"
                  required
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Descreva como foi a execução do treino, dificuldades encontradas, pontos positivos, etc.
              </p>
            </div>
          </form>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 bg-slate-50">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-lg font-semibold hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                Salvar Feedback
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FeedbackModal;