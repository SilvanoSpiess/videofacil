import React, { useState } from 'react';

interface LeadFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  isFirstTime?: boolean;
}

export const LeadForm: React.FC<LeadFormProps> = ({ onSuccess, onCancel, isFirstTime = true }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    restaurant: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);

    // Mask: (99) 99999-9999
    if (value.length > 2) value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    if (value.length > 10) value = `${value.slice(0, 10)}-${value.slice(10)}`;

    setFormData(prev => ({ ...prev, whatsapp: value }));
  };

  const validate = (data = formData) => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneDigits = data.whatsapp.replace(/\D/g, '');

    if (!data.name.trim()) newErrors.name = "Qual o seu nome?";
    if (!data.restaurant.trim()) newErrors.restaurant = "Qual o nome do seu negócio?";

    if (!data.email) {
      newErrors.email = "E-mail necessário";
    } else if (!emailRegex.test(data.email)) {
      newErrors.email = "Formato de e-mail inválido";
    }

    if (!phoneDigits) {
      newErrors.whatsapp = "WhatsApp necessário";
    } else if (phoneDigits.length < 10) {
      newErrors.whatsapp = "Número muito curto";
    }

    return newErrors;
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const newErrors = validate();
    setErrors(newErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    setErrors(newErrors);
    setTouched({ name: true, email: true, whatsapp: true, restaurant: true });

    if (Object.keys(newErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const webhookUrl = import.meta.env.VITE_GHL_WEBHOOK_URL;

      console.log('🚀 Enviando lead para webhook:', webhookUrl);
      const payload = {
        ...formData,
        source: 'Video Facil App',
        timestamp: new Date().toISOString(),
        type: isFirstTime ? 'First Free Redemption' : 'Lead'
      };
      console.log('📦 Payload:', payload);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log('✅ Resposta do webhook:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro do webhook:', errorText);
      }

      onSuccess();
    } catch (error) {
      console.error("❌ Webhook error:", error);
      alert(`Erro ao enviar lead. Verifique o console (F12) para mais detalhes.`);
      // Não chamar onSuccess() para que o usuário veja o erro
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFieldInvalid = (field: string) => touched[field] && errors[field];

  return (
    <div className="bg-[#1f2937] w-full max-w-lg rounded-3xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-500">

      {/* Header with Background Accent */}
      <div className="relative p-8 bg-gradient-to-br from-[#ff6b3d] to-[#e65b2d] text-white">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors bg-black/10 rounded-full p-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2a3 3 0 01-3 3H6a3 3 0 01-3-3v-2m18-13l-9 9-9-9" />
          </svg>
        </div>

        <h3 className="text-2xl font-bold mb-1">Quase lá! 🎬</h3>
        <p className="text-white/80 text-sm">
          {isFirstTime
            ? "Como este é seu primeiro acesso, vamos liberar seu vídeo cinematográfico gratuitamente. Deixe seus dados abaixo."
            : "Complete o cadastro para prosseguir com a geração do seu vídeo exclusivo."}
        </p>
      </div>

      <div className="p-8 bg-[#1f2937]">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Grid for Name and Restaurant */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 ml-1 uppercase tracking-wider">Seu Nome</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ex: João Silva"
                  onBlur={() => handleBlur('name')}
                  className={`w-full bg-[#111827] border ${isFieldInvalid('name') ? 'border-red-500' : 'border-gray-700'} rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#ff6b3d] focus:border-transparent outline-none transition-all placeholder-gray-600`}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              {isFieldInvalid('name') && <p className="text-red-400 text-[10px] font-bold mt-1 ml-1">{errors.name}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 ml-1 uppercase tracking-wider">Nome da Empresa</label>
              <input
                type="text"
                placeholder="Restaurante/Negócio"
                onBlur={() => handleBlur('restaurant')}
                className={`w-full bg-[#111827] border ${isFieldInvalid('restaurant') ? 'border-red-500' : 'border-gray-700'} rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#ff6b3d] focus:border-transparent outline-none transition-all placeholder-gray-600`}
                value={formData.restaurant}
                onChange={(e) => setFormData({ ...formData, restaurant: e.target.value })}
              />
              {isFieldInvalid('restaurant') && <p className="text-red-400 text-[10px] font-bold mt-1 ml-1">{errors.restaurant}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400 ml-1 uppercase tracking-wider">E-mail Profissional</label>
            <input
              type="email"
              placeholder="seu@email.com"
              onBlur={() => handleBlur('email')}
              className={`w-full bg-[#111827] border ${isFieldInvalid('email') ? 'border-red-500' : 'border-gray-700'} rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#ff6b3d] focus:border-transparent outline-none transition-all placeholder-gray-600`}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            {isFieldInvalid('email') && <p className="text-red-400 text-[10px] font-bold mt-1 ml-1">{errors.email}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400 ml-1 uppercase tracking-wider">WhatsApp Principal</label>
            <input
              type="text"
              placeholder="(00) 00000-0000"
              onBlur={() => handleBlur('whatsapp')}
              className={`w-full bg-[#111827] border ${isFieldInvalid('whatsapp') ? 'border-red-500' : 'border-gray-700'} rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#ff6b3d] focus:border-transparent outline-none transition-all placeholder-gray-600`}
              value={formData.whatsapp}
              onChange={handlePhoneChange}
            />
            {isFieldInvalid('whatsapp') && <p className="text-red-400 text-[10px] font-bold mt-1 ml-1">{errors.whatsapp}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-2xl transition-all mt-4 flex items-center justify-center gap-3 active:scale-95 ${isSubmitting
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-500 text-white hover:shadow-green-500/20'
              }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Iniciando Produção...
              </>
            ) : (
              <>
                <span>{isFirstTime ? 'Gerar Meu 1º Vídeo Grátis' : 'Gerar Vídeo HD'}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>

          <p className="text-[10px] text-center text-gray-500 italic">
            Ao clicar, você concorda em ser contatado pela AipYra para soluções de inovação.
          </p>
        </form>
      </div>
    </div>
  );
};