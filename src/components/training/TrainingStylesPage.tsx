import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Star, Edit, Trash2, Heart, Target, Zap } from 'lucide-react';
import { useTrainingStyles } from '../../hooks/useTrainingStyles';
import EmptyState from '../ui/EmptyState';
import TrainingStyleModal from './TrainingStyleModal';
import { TrainingStyle } from '../../types/database';
import Skeleton from '../ui/Skeleton';

const TrainingStylesPage: React.FC = () => {
  const { 
    styles, 
    favoriteStyles, 
    loading, 
    error, 
    createStyle, 
    updateStyle, 
    toggleFavorite 
  } = useTrainingStyles();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStyle, setEditingStyle] = useState<TrainingStyle | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('');

  const filteredStyles = styles.filter(style => {
    const matchesSearch = style.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (style.description && style.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = !filterCategory || style.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(styles.map(style => style.category).filter(Boolean))];

  const handleCreateStyle = async (styleData: Partial<TrainingStyle>) => {
    const success = await createStyle(styleData);
    if (success) {
      setIsModalOpen(false);
    }
  };

  const handleUpdateStyle = async (styleData: Partial<TrainingStyle>) => {
    if (!editingStyle) return;
    
    const success = await updateStyle(editingStyle.id, styleData);
    if (success) {
      setIsModalOpen(false);
      setEditingStyle(null);
    }
  };

  const handleEditStyle = (style: TrainingStyle) => {
    setEditingStyle(style);
    setIsModalOpen(true);
  };

  const handleToggleFavorite = async (styleId: string) => {
    await toggleFavorite(styleId);
  };

  const getIntensityLabel = (intensity: string) => {
    const labels = {
      muito_baixa: 'Muito Baixa',
      baixa: 'Baixa',
      moderada: 'Moderada',
      moderada_alta: 'Moderada Alta',
      alta: 'Alta',
      muito_alta: 'Muito Alta'
    };
    return labels[intensity as keyof typeof labels] || intensity;
  };

  const getIntensityColor = (intensity: string) => {
    const colors = {
      muito_baixa: 'bg-green-100 text-green-700',
      baixa: 'bg-blue-100 text-blue-700',
      moderada: 'bg-yellow-100 text-yellow-700',
      moderada_alta: 'bg-orange-100 text-orange-700',
      alta: 'bg-red-100 text-red-700',
      muito_alta: 'bg-purple-100 text-purple-700'
    };
    return colors[intensity as keyof typeof colors] || 'bg-slate-100 text-slate-700';
  };

  const isFavorite = (styleId: string) => {
    return favoriteStyles.some(fav => fav.id === styleId);
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div>
          <Skeleton className="h-8 w-1/4 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-lg">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Cabeçalho da Página */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8"
      >
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
            Estilos de Treino
          </h1>
          <p className="text-lg text-slate-600">
            Gerencie suas metodologias de treino e organize seus favoritos
          </p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setEditingStyle(null);
            setIsModalOpen(true);
          }}
          className="mt-4 sm:mt-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Criar Novo Estilo
        </motion.button>
      </motion.div>

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white rounded-xl p-6 shadow-lg mb-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Busca */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Buscar Estilos
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Nome ou descrição do estilo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Filtro por Categoria */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Categoria
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Todas as categorias</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Estado de Erro */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8"
        >
          Erro ao carregar estilos de treino: {error}
        </motion.div>
      )}

      {/* Seção de Favoritos */}
      {favoriteStyles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-500" />
            Meus Favoritos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favoriteStyles.map((style, index) => (
              <motion.div
                key={style.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-slate-900">{style.name}</h3>
                  <button
                    onClick={() => handleToggleFavorite(style.id)}
                    className="text-yellow-500 hover:text-yellow-600 transition-colors"
                  >
                    <Heart className="w-5 h-5 fill-current" />
                  </button>
                </div>
                <p className="text-sm text-slate-700 mb-3">{style.description}</p>
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getIntensityColor(style.intensity)}`}>
                    {getIntensityLabel(style.intensity)}
                  </span>
                  <button
                    onClick={() => handleEditStyle(style)}
                    className="text-slate-500 hover:text-blue-600 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Grid de Estilos */}
      {filteredStyles.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <EmptyState
            icon={Target}
            title="Nenhum estilo encontrado"
            description={searchTerm || filterCategory
              ? "Não encontramos estilos com os filtros aplicados. Tente ajustar os critérios de busca."
              : "Você ainda não criou nenhum estilo de treino. Comece criando sua primeira metodologia personalizada."
            }
            actionText="+ Criar Primeiro Estilo"
            onAction={() => {
              setEditingStyle(null);
              setIsModalOpen(true);
            }}
          />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredStyles.map((style, index) => (
            <motion.div
              key={style.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100"
            >
              {/* Cabeçalho do Estilo */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {style.name}
                  </h3>
                  {style.description && (
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                      {style.description}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleFavorite(style.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      isFavorite(style.id)
                        ? 'text-yellow-500 hover:text-yellow-600 bg-yellow-50'
                        : 'text-slate-400 hover:text-yellow-500 hover:bg-yellow-50'
                    }`}
                    title={isFavorite(style.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  >
                    <Heart className={`w-4 h-4 ${isFavorite(style.id) ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleEditStyle(style)}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar estilo"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Badges de Informação */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getIntensityColor(style.intensity)}`}>
                    <Zap className="w-3 h-3 mr-1" />
                    {getIntensityLabel(style.intensity)}
                  </span>
                  {style.category && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      {style.category}
                    </span>
                  )}
                </div>
                
                {style.duration && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Target className="w-4 h-4" />
                    <span>Duração: {style.duration}</span>
                  </div>
                )}
              </div>

              {/* Informações Adicionais */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {style.is_default ? 'Estilo padrão' : 'Estilo personalizado'}
                  </span>
                  <span>
                    Criado em {new Date(style.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Modal de Estilo */}
      <TrainingStyleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingStyle(null);
        }}
        onSave={editingStyle ? handleUpdateStyle : handleCreateStyle}
        style={editingStyle}
        loading={loading}
      />
    </div>
  );
};

export default TrainingStylesPage;