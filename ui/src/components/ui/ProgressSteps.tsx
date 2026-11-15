import { assertResourceName } from '@/resourceName';
assertResourceName();

import { Check } from 'lucide-react';

export function ProgressSteps({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const done = currentStep > index;
        const current = currentStep === index;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all
                ${done ? 'bg-success-500 text-white' : current ? 'bg-white text-dark-950' : 'bg-dark-800 text-dark-500 border border-dark-700'}`}>
                {done ? <Check className="w-5 h-5" /> : index + 1}
              </div>
              <span className={`text-xs whitespace-nowrap ${current ? 'text-white font-medium' : 'text-dark-500'}`}>{step}</span>
            </div>
            {index < steps.length - 1 && <div className={`flex-1 h-0.5 mx-3 mb-6 ${done ? 'bg-success-500' : 'bg-dark-700'}`} />}
          </div>
        );
      })}
    </div>
  );
}
