import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { Star, Send, CheckCircle, AlertCircle, User, MessageSquare, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface TrainingData {
  training_id: string;
  training_title: string;
  training_created_at: string;
  coach_id: string;
  coach_name: string;
  coach_avatar: string | null;
  athlete_name: string | null;
}

const PublicFeedbackPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [training, setTraining] = useState<TrainingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    athlete_name: '',
    rating: 0,
    feedback_text: ''
  });
  
  const [hoveredRating, setHoveredRating] = useState(0);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (token) {
      fetchTrainingData();
    }
  }, [token]);

  const fetchTrainingData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Buscando dados do treino com token:', token);

      const { data, error: fetchError } = await supabase.rpc('get_training_for_feedback', { 
        feedback_token: token 
      });

      if (fetchError) {
        console.error('❌ Erro na função RPC:', fetchError);
        throw fetchError;
      }

      console.log('📊 Dados retornados:', data);

      if (!data || data.length === 0) {
        setError('Link de feedback inválido ou expirado.');
        return;
      }

      setTraining(data[0]);
      
      // Definir nome do atleta no formulário se disponível
      if (data[0].athlete_name) {
        setFormData(prev => ({ ...prev, athlete_name: data[0].athlete_name }));
      }
      
      console.log('✅ Dados do treino carregados:', data[0]);
    } catch (err: any) {
      console.error('❌ Erro ao buscar dados do treino:', err);
      setError('Erro ao carregar dados do treino. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.feedback_text.trim()) {
      errors.feedback_text = 'Feedback é obrigatório';
    }

    if (formData.rating === 0) {
      errors.rating = 'Por favor, selecione uma avaliação';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !training) {
      return;
    }

    setSubmitting(true);
    console.log('📤 Enviando feedback:', {
      training_id: training.training_id,
      rating: formData.rating,
      feedback_text: formData.feedback_text.trim()
    });

    try {
      const { error: insertError } = await supabase
        .from('athlete_feedback')
        .insert({
          training_id: training.training_id,
          athlete_name: formData.athlete_name || training.athlete_name || 'Atleta',
          athlete_email: null,
          rating: formData.rating,
          feedback_text: formData.feedback_text.trim()
        });

      if (insertError) {
        console.error('❌ Erro ao inserir feedback:', insertError);
        throw insertError;
      }

      console.log('✅ Feedback enviado com sucesso');
      setSubmitted(true);
    } catch (err: any) {
      console.error('❌ Erro ao enviar feedback:', err);
      setError('Erro ao enviar feedback. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpar erro quando usuário começar a digitar
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleRatingClick = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
    if (formErrors.rating) {
      setFormErrors(prev => ({ ...prev, rating: '' }));
    }
  };

  const formatTrainingDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Data não disponível';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !training) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-4">
            Ops! Algo deu errado
          </h1>
          <p className="text-slate-600 mb-6">
            {error || 'Link de feedback inválido ou expirado.'}
          </p>
          <p className="text-sm text-slate-500">
            Verifique se o link está correto ou entre em contato com seu treinador.
          </p>
        </motion.div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-4">
            Feedback Enviado!
          </h1>
          <p className="text-slate-600 mb-6">
            Obrigado pelo seu feedback! Ele foi enviado ao seu treinador e ajudará a melhorar seus próximos treinos.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 text-sm">
              ✅ Seu feedback foi registrado com sucesso
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-8 text-center">
            <div className="mb-4">
              {training.coach_avatar ? (
                <img
                  src={training.coach_avatar}
                  alt="Avatar do treinador"
                  className="w-20 h-20 rounded-full mx-auto object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full mx-auto flex items-center justify-center border-4 border-white shadow-lg">
                  <User className="w-10 h-10 text-white" />
                </div>
              )}
            </div>
            <h1 className="text-3xl font-bold mb-2">
              Feedback para o Treinador
            </h1>
            <h2 className="text-2xl font-semibold text-blue-100">
              {training.coach_name}
            </h2>
            <p className="text-blue-100 mt-2">
              Treino: {training.training_title}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="text-center mb-8">
              <MessageSquare className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {formData.athlete_name || training.athlete_name 
                  ? `Como foi seu treino, ${formData.athlete_name || training.athlete_name}?` 
                  : 'Como foi seu treino?'
                }
              </h3>
              <p className="text-slate-600">
                Seu feedback é muito importante para melhorar os próximos treinos
              </p>
            </div>

            {/* Campo para nome do atleta se não estiver disponível */}
            {!training.athlete_name && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Seu Nome (opcional)
                </label>
                <input
                  type="text"
                  value={formData.athlete_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, athlete_name: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Digite seu nome (opcional)"
                />
              </div>
            )}

            {/* Avaliação */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Avaliação do Treino *
              </label>
              <div className="flex items-center justify-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingClick(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 transition-colors ${
                        star <= (hoveredRating || formData.rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-slate-300 hover:text-yellow-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-600">
                  {formData.rating > 0 && `${formData.rating}/5 estrelas`}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  1 = Muito difícil, 5 = Perfeito
                </p>
              </div>
              {formErrors.rating && (
                <p className="mt-2 text-sm text-red-600 text-center">{formErrors.rating}</p>
              )}
            </div>

            {/* Feedback Text */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Seu Feedback *
              </label>
              <textarea
                name="feedback_text"
                value={formData.feedback_text}
                onChange={handleInputChange}
                rows={6}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors resize-none ${
                  formErrors.feedback_text ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
                }`}
                placeholder="Como foi o treino? Conseguiu completar todas as atividades? Houve alguma dificuldade? Compartilhe sua experiência..."
                required
              />
              {formErrors.feedback_text && (
                <p className="mt-1 text-sm text-red-600">{formErrors.feedback_text}</p>
              )}
              <p className="mt-2 text-xs text-slate-500">
                Descreva como foi a execução do treino, dificuldades encontradas, pontos positivos, etc.
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enviando Feedback...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Enviar Feedback
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="bg-slate-50 px-8 py-6 text-center border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Treino criado em {formatTrainingDate(training.training_created_at)}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Powered by <strong>Correria.Pro</strong>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PublicFeedbackPage;