import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, RotateCcw, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface AvatarCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageFile: File | null;
  onCropComplete: (croppedFile: File) => Promise<void>;
  uploading: boolean;
}

const AvatarCropModal: React.FC<AvatarCropModalProps> = ({
  isOpen,
  onClose,
  imageFile,
  onCropComplete,
  uploading
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [processing, setProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (imageFile && isOpen) {
      console.log('🖼️ AvatarCrop: Carregando arquivo para edição:', imageFile.name);
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setImageSrc(result);
        console.log('✅ AvatarCrop: Imagem carregada para preview');
      };
      reader.readAsDataURL(imageFile);
    }
  }, [imageFile, isOpen]);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    console.log('🖼️ AvatarCrop: Imagem renderizada, configurando crop inicial');
    const { width, height } = e.currentTarget;
    
    // Criar crop quadrado centralizado
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 80,
        },
        1, // Aspect ratio 1:1 (quadrado)
        width,
        height
      ),
      width,
      height
    );
    
    setCrop(crop);
    console.log('✅ AvatarCrop: Crop inicial configurado:', crop);
  }, []);

  const getCroppedImage = useCallback(async (): Promise<File | null> => {
    console.log('✂️ AvatarCrop: Iniciando processo de cropping');
    
    if (!completedCrop || !imgRef.current || !canvasRef.current) {
      console.error('❌ AvatarCrop: Dados necessários para crop não disponíveis');
      return null;
    }

    const image = imgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('❌ AvatarCrop: Contexto do canvas não disponível');
      return null;
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Configurar canvas com tamanho fixo para avatar (300x300)
    const avatarSize = 300;
    canvas.width = avatarSize;
    canvas.height = avatarSize;

    console.log('🎨 AvatarCrop: Configurando canvas:', {
      canvasSize: `${avatarSize}x${avatarSize}`,
      cropArea: completedCrop,
      imageScale: { scaleX, scaleY }
    });

    // Limpar canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, avatarSize, avatarSize);

    // Aplicar transformações
    ctx.save();
    ctx.translate(avatarSize / 2, avatarSize / 2);
    ctx.rotate((rotate * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.translate(-avatarSize / 2, -avatarSize / 2);

    // Desenhar imagem cropada
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      avatarSize,
      avatarSize
    );

    ctx.restore();

    console.log('✅ AvatarCrop: Imagem desenhada no canvas');

    // Converter canvas para blob
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error('❌ AvatarCrop: Falha ao converter canvas para blob');
            resolve(null);
            return;
          }

          console.log('✅ AvatarCrop: Blob criado com sucesso:', {
            size: blob.size,
            type: blob.type
          });

          // Criar arquivo com nome único
          const fileName = `avatar-${Date.now()}.jpg`;
          const file = new File([blob], fileName, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });

          console.log('✅ AvatarCrop: Arquivo final criado:', fileName);
          resolve(file);
        },
        'image/jpeg',
        0.9 // Qualidade 90%
      );
    });
  }, [completedCrop, scale, rotate]);

  const handleSave = async () => {
    console.log('💾 AvatarCrop: Iniciando salvamento do avatar cropado');
    setProcessing(true);

    try {
      const croppedFile = await getCroppedImage();
      
      if (!croppedFile) {
        console.error('❌ AvatarCrop: Falha ao gerar arquivo cropado');
        return;
      }

      console.log('✅ AvatarCrop: Arquivo cropado gerado, iniciando upload');
      await onCropComplete(croppedFile);
      
      console.log('✅ AvatarCrop: Upload concluído com sucesso');
      onClose();
    } catch (error) {
      console.error('❌ AvatarCrop: Erro durante salvamento:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    console.log('❌ AvatarCrop: Cancelando edição de avatar');
    onClose();
  };

  const resetTransforms = () => {
    console.log('🔄 AvatarCrop: Resetando transformações');
    setScale(1);
    setRotate(0);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Editar Avatar</h2>
                <p className="text-blue-100">
                  Ajuste sua foto de perfil como desejar
                </p>
              </div>
              <button
                onClick={handleCancel}
                disabled={processing || uploading}
                className="text-white hover:text-blue-200 transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Crop Area */}
          <div className="p-6">
            {imageSrc && (
              <div className="space-y-6">
                {/* Image Cropper */}
                <div className="flex justify-center">
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={1} // Forçar aspecto quadrado
                    minWidth={50}
                    minHeight={50}
                    className="max-w-full max-h-96"
                  >
                    <img
                      ref={imgRef}
                      alt="Crop preview"
                      src={imageSrc}
                      style={{
                        transform: `scale(${scale}) rotate(${rotate}deg)`,
                        maxWidth: '100%',
                        maxHeight: '400px'
                      }}
                      onLoad={onImageLoad}
                    />
                  </ReactCrop>
                </div>

                {/* Controls */}
                <div className="space-y-4">
                  {/* Zoom Controls */}
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-slate-700 min-w-0">
                      Zoom:
                    </label>
                    <button
                      onClick={() => setScale(Math.max(0.5, scale - 0.1))}
                      className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      disabled={scale <= 0.5}
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <input
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.1"
                      value={scale}
                      onChange={(e) => setScale(Number(e.target.value))}
                      className="flex-1"
                    />
                    <button
                      onClick={() => setScale(Math.min(3, scale + 0.1))}
                      className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      disabled={scale >= 3}
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-slate-600 min-w-0">
                      {Math.round(scale * 100)}%
                    </span>
                  </div>

                  {/* Rotation Controls */}
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-slate-700 min-w-0">
                      Rotação:
                    </label>
                    <button
                      onClick={() => setRotate(rotate - 90)}
                      className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={rotate}
                      onChange={(e) => setRotate(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm text-slate-600 min-w-0">
                      {rotate}°
                    </span>
                  </div>

                  {/* Reset Button */}
                  <div className="flex justify-center">
                    <button
                      onClick={resetTransforms}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                    >
                      Resetar Ajustes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Hidden Canvas for Processing */}
            <canvas
              ref={canvasRef}
              style={{ display: 'none' }}
            />
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 bg-slate-50">
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={processing || uploading}
                className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              
              <button
                onClick={handleSave}
                disabled={processing || uploading || !completedCrop}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-lg font-semibold hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {(processing || uploading) && <Loader2 className="w-5 h-5 animate-spin" />}
                <Save className="w-5 h-5" />
                {processing ? 'Processando...' : uploading ? 'Enviando...' : 'Salvar e Continuar'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AvatarCropModal;