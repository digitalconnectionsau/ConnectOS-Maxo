// Twilio call management utilities
import { Device, Call } from '@twilio/voice-sdk';

export interface CallEvent {
  type: 'incoming' | 'outgoing' | 'connected' | 'disconnected' | 'muted' | 'held';
  callSid?: string;
  phoneNumber: string;
  contactName?: string;
  duration?: number;
}

class TwilioCallManager {
  private device: Device | null = null;
  private currentCall: Call | null = null;
  private listeners: ((event: CallEvent) => void)[] = [];

  async initialize(accessToken: string) {
    try {
      this.device = new Device(accessToken, {
        logLevel: 1
      });

      this.device.on('ready', () => {
        console.log('Twilio Device is ready');
      });

      this.device.on('error', (error) => {
        console.error('Twilio Device error:', error);
      });

      this.device.on('incoming', (call) => {
        console.log('Incoming call from:', call.parameters.From);
        this.currentCall = call;
        
        this.notifyListeners({
          type: 'incoming',
          callSid: call.parameters.CallSid,
          phoneNumber: call.parameters.From,
          contactName: this.getContactName(call.parameters.From)
        });

        call.on('accept', () => {
          console.log('Call accepted');
          this.notifyListeners({
            type: 'connected',
            callSid: call.parameters.CallSid,
            phoneNumber: call.parameters.From,
            contactName: this.getContactName(call.parameters.From)
          });
        });

        call.on('disconnect', () => {
          console.log('Call disconnected');
          this.currentCall = null;
          this.notifyListeners({
            type: 'disconnected',
            callSid: call.parameters.CallSid,
            phoneNumber: call.parameters.From
          });
        });
      });

      await this.device.register();
      return true;
    } catch (error) {
      console.error('Failed to initialize Twilio Device:', error);
      return false;
    }
  }

  async makeCall(phoneNumber: string): Promise<boolean> {
    if (!this.device) {
      console.error('Device not initialized');
      return false;
    }

    try {
      const call = await this.device.connect({
        params: { To: phoneNumber }
      });

      this.currentCall = call;
      
      this.notifyListeners({
        type: 'outgoing',
        callSid: call.parameters?.CallSid,
        phoneNumber: phoneNumber,
        contactName: this.getContactName(phoneNumber)
      });

      call.on('accept', () => {
        this.notifyListeners({
          type: 'connected',
          callSid: call.parameters?.CallSid,
          phoneNumber: phoneNumber,
          contactName: this.getContactName(phoneNumber)
        });
      });

      call.on('disconnect', () => {
        this.currentCall = null;
        this.notifyListeners({
          type: 'disconnected',
          callSid: call.parameters?.CallSid,
          phoneNumber: phoneNumber
        });
      });

      return true;
    } catch (error) {
      console.error('Failed to make call:', error);
      return false;
    }
  }

  answerCall(): boolean {
    if (this.currentCall) {
      this.currentCall.accept();
      return true;
    }
    return false;
  }

  endCall(): boolean {
    if (this.currentCall) {
      this.currentCall.disconnect();
      return true;
    }
    return false;
  }

  toggleMute(): boolean {
    if (this.currentCall) {
      const isMuted = this.currentCall.isMuted();
      this.currentCall.mute(!isMuted);
      
      this.notifyListeners({
        type: 'muted',
        callSid: this.currentCall.parameters?.CallSid,
        phoneNumber: this.currentCall.parameters?.To || this.currentCall.parameters?.From
      });
      
      return !isMuted;
    }
    return false;
  }

  // Note: Twilio Voice SDK doesn't have built-in hold functionality
  // This would need to be implemented with conference or other methods
  toggleHold(): boolean {
    // Implementation would depend on your specific hold strategy
    console.log('Hold functionality needs custom implementation');
    return false;
  }

  sendDTMF(digit: string): boolean {
    if (this.currentCall) {
      this.currentCall.sendDigits(digit);
      return true;
    }
    return false;
  }

  onCallEvent(listener: (event: CallEvent) => void) {
    this.listeners.push(listener);
  }

  removeCallEventListener(listener: (event: CallEvent) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notifyListeners(event: CallEvent) {
    this.listeners.forEach(listener => listener(event));
    
    // Also dispatch browser event for React components
    window.dispatchEvent(new CustomEvent('callStateUpdate', {
      detail: this.eventToCallState(event)
    }));
  }

  private eventToCallState(event: CallEvent) {
    const isActive = event.type === 'connected';
    const isIncoming = event.type === 'incoming';
    
    return {
      isActive,
      isIncoming,
      isOnHold: false, // Would be managed separately
      isMuted: event.type === 'muted',
      contactName: event.contactName,
      phoneNumber: event.phoneNumber,
      duration: 0, // Managed by the component
      callSid: event.callSid
    };
  }

  private getContactName(_phoneNumber: string): string | undefined {
    // This would lookup the contact name from your CRM data
    // For now, return undefined to show phone number
    return undefined;
  }
}

export const twilioCallManager = new TwilioCallManager();