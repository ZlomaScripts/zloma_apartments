import { assertResourceName } from '@/resourceName';
assertResourceName();

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { ProgressSteps } from '@/components/ui/ProgressSteps';
import { StepPaymentType } from './StepPaymentType';
import { StepDuration } from './StepDuration';
import { StepConfirm } from './StepConfirm';
import { Button } from '@/components/ui/Button';
import { PaymentType } from '@/types';
import { useT } from '@/i18n';

type Step = 'payment' | 'duration' | 'confirm';

export function BookingFlow() {
  const t = useT();
  const { bookingRoom, setBookingRoom, hotel } = useStore();
  const [step, setStep] = useState<Step>('payment');
  const [paymentType, setPaymentType] = useState<PaymentType>('prepaid');
  const [days, setDays] = useState(hotel?.pricing.contractMinDays || 7);

  if (!bookingRoom) return null;
  const cancel = () => setBookingRoom(null);
  const steps: Step[] = paymentType === 'contract' ? ['payment', 'duration', 'confirm'] : ['payment', 'confirm'];

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-dark-700/50 bg-dark-950/40 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-white">{t('booking_title', bookingRoom.room_number)}</h1>
          <p className="text-dark-400 text-sm">{t('booking_subtitle')}</p>
        </div>
        <Button variant="ghost" onClick={cancel}>{t('cancel_booking')}</Button>
      </div>
      <div className="flex-1 overflow-y-auto p-8">
        <ProgressSteps steps={steps.map(s => t('step_' + s))} currentStep={steps.indexOf(step)} />
        <div className="mt-8">
          {step === 'payment' && (
            <StepPaymentType onBack={cancel} onNext={(type) => { setPaymentType(type); setStep(type === 'contract' ? 'duration' : 'confirm'); }} />
          )}
          {step === 'duration' && (
            <StepDuration days={days} setDays={setDays} onBack={() => setStep('payment')} onNext={() => setStep('confirm')} />
          )}
          {step === 'confirm' && (
            <StepConfirm paymentType={paymentType} days={days} onBack={() => setStep(paymentType === 'contract' ? 'duration' : 'payment')} />
          )}
        </div>
      </div>
    </div>
  );
}
