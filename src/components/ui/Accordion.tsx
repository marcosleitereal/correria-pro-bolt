import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface AccordionContextType {
  openItem: string | null;
  setOpenItem: (item: string | null) => void;
  type: 'single' | 'multiple';
  collapsible: boolean;
}

const AccordionContext = createContext<AccordionContextType | undefined>(undefined);

interface AccordionProps {
  children: React.ReactNode;
  type?: 'single' | 'multiple';
  collapsible?: boolean;
  defaultValue?: string;
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  children,
  type = 'single',
  collapsible = true,
  defaultValue,
  className = ''
}) => {
  const [openItem, setOpenItem] = useState<string | null>(defaultValue || null);

  return (
    <AccordionContext.Provider value={{ openItem, setOpenItem, type, collapsible }}>
      <div className={`space-y-2 ${className}`}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

interface AccordionItemProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({
  children,
  value,
  className = ''
}) => {
  return (
    <div className={`border border-slate-200 rounded-lg overflow-hidden ${className}`}>
      {children}
    </div>
  );
};

interface AccordionTriggerProps {
  children: React.ReactNode;
  className?: string;
  value?: string;
}

export const AccordionTrigger: React.FC<AccordionTriggerProps> = ({
  children,
  className = '',
  value
}) => {
  const context = useContext(AccordionContext);
  if (!context) throw new Error('AccordionTrigger must be used within Accordion');

  const { openItem, setOpenItem } = context;
  
  // Get value from props or try to extract from parent AccordionItem
  const [parentElement] = React.useState(() => {
    // This will be set by the parent AccordionItem
    return value || '';
  });

  const isOpen = openItem === (value || parentElement);

  const handleClick = () => {
    const currentValue = value || parentElement;
    if (isOpen && context.collapsible) {
      setOpenItem(null);
    } else {
      setOpenItem(currentValue);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-center justify-between p-4 text-left bg-white hover:bg-slate-50 transition-colors ${className}`}
    >
      <span className="font-semibold text-slate-900">{children}</span>
      <motion.div
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <ChevronDown className="w-5 h-5 text-slate-500" />
      </motion.div>
    </button>
  );
};

interface AccordionContentProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

export const AccordionContent: React.FC<AccordionContentProps> = ({
  children,
  value,
  className = ''
}) => {
  const context = useContext(AccordionContext);
  if (!context) throw new Error('AccordionContent must be used within Accordion');

  const { openItem } = context;
  const isOpen = openItem === value;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className={`p-4 bg-slate-50 border-t border-slate-200 ${className}`}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};