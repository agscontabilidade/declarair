import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';

export const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6"
        >
          <div className="max-w-4xl mx-auto bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl p-4 md:p-6 flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <div className="flex-shrink-0 bg-accent/10 p-3 rounded-full">
              <Cookie className="h-6 w-6 text-accent" />
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h4 className="font-display font-bold text-lg text-foreground mb-1">
                Respeitamos sua privacidade
              </h4>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Utilizamos cookies para melhorar sua experiência, analisar o tráfego e personalizar anúncios. 
                Ao clicar em "Aceitar", você concorda com o uso de todas as tecnologias de rastreamento.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDecline}
                className="flex-1 md:flex-none text-muted-foreground hover:text-foreground"
              >
                Recusar
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleAccept}
                className="flex-1 md:flex-none bg-accent hover:bg-accent/90 text-white font-bold px-6"
              >
                Aceitar tudo
              </Button>
              <button 
                onClick={() => setIsVisible(false)}
                className="absolute top-4 right-4 md:static md:ml-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
