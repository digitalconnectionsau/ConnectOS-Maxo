'use client';

import { useState, useEffect, useRef } from 'react';
import { Phone, PhoneCall, PhoneOff, Mic, MicOff, Pause, Play } from 'lucide-react';

interface CallState {
  isActive: boolean;
  isIncoming: boolean;
  isOnHold: boolean;
  isMuted: boolean;
  contactName?: string;
  phoneNumber: string;
  duration: number;
  callSid?: string;
}

interface PhoneInterfaceProps {
  onMakeCall?: (number: string) => void;
  onEndCall?: () => void;
  onAnswerCall?: () => void;
  onToggleMute?: () => void;
  onToggleHold?: () => void;
}

export default function PhoneInterface({ 
  onMakeCall, 
  onEndCall, 
  onAnswerCall, 
  onToggleMute, 
  onToggleHold 
}: PhoneInterfaceProps) {
  const [dialNumber, setDialNumber] = useState('');
  const [isDialerOpen, setIsDialerOpen] = useState(false);
  const [callState, setCallState] = useState<CallState>({
    isActive: false,
    isIncoming: false,
    isOnHold: false,
    isMuted: false,
    phoneNumber: '',
    duration: 0
  });
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  // Mock call state - in real app, this would come from Twilio
  useEffect(() => {
    // Listen for call events from your Twilio integration
    const handleCallUpdate = (event: CustomEvent) => {
      setCallState(event.detail);
      if (event.detail.isActive && !callStartTime) {
        setCallStartTime(new Date());
      } else if (!event.detail.isActive) {
        setCallStartTime(null);
      }
    };

    window.addEventListener('callStateUpdate', handleCallUpdate as EventListener);
    return () => window.removeEventListener('callStateUpdate', handleCallUpdate as EventListener);
  }, [callStartTime]);

  // Update call duration
  useEffect(() => {
    if (callState.isActive && callStartTime) {
      durationInterval.current = setInterval(() => {
        const now = new Date();
        const duration = Math.floor((now.getTime() - callStartTime.getTime()) / 1000);
        setCallState(prev => ({ ...prev, duration }));
      }, 1000);
    } else {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    }

    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, [callState.isActive, callStartTime]);

  const handleDialpadClick = (digit: string) => {
    setDialNumber(prev => prev + digit);
  };

  const handleBackspace = () => {
    setDialNumber(prev => prev.slice(0, -1));
  };

  const handleCall = () => {
    if (dialNumber && onMakeCall) {
      onMakeCall(dialNumber);
      setDialNumber('');
      setIsDialerOpen(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const dialpadButtons = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#']
  ];

  // Incoming call interface
  if (callState.isIncoming && !callState.isActive) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-sm w-full mx-4">
          <div className="mb-6">
            <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Phone className="w-12 h-12 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold mb-1">
              {callState.contactName || 'Unknown Caller'}
            </h3>
            <p className="text-gray-600">{callState.phoneNumber}</p>
          </div>
          
          <div className="flex justify-center gap-8">
            <button
              onClick={onEndCall}
              className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <PhoneOff className="w-8 h-8" />
            </button>
            <button
              onClick={onAnswerCall}
              className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white transition-colors animate-pulse"
            >
              <Phone className="w-8 h-8" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active call interface
  if (callState.isActive) {
    return (
      <div className="fixed bottom-4 right-4 bg-white rounded-2xl shadow-2xl border p-6 min-w-80 z-40">
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-3 flex items-center justify-center">
            <PhoneCall className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="font-semibold text-lg">
            {callState.contactName || 'Unknown'}
          </h3>
          <p className="text-gray-600 text-sm mb-1">{callState.phoneNumber}</p>
          <p className="text-green-600 font-mono text-lg">
            {formatDuration(callState.duration)}
          </p>
          {callState.isOnHold && (
            <p className="text-yellow-600 text-sm mt-1">Call on Hold</p>
          )}
        </div>

        <div className="flex justify-center gap-3">
          <button
            onClick={onToggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              callState.isMuted 
                ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={callState.isMuted ? 'Unmute' : 'Mute'}
          >
            {callState.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            onClick={onToggleHold}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              callState.isOnHold 
                ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={callState.isOnHold ? 'Resume' : 'Hold'}
          >
            {callState.isOnHold ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>

          <button
            onClick={onEndCall}
            className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
            title="End Call"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // Floating action button and dialer
  return (
    <>
      {/* Floating Phone Button */}
      <button
        onClick={() => setIsDialerOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full shadow-lg flex items-center justify-center text-white transition-all hover:scale-110 z-30"
        title="Open Dialer"
      >
        <Phone className="w-6 h-6" />
      </button>

      {/* Dialer Modal */}
      {isDialerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            {/* Display */}
            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg p-4 h-16 flex items-center justify-center">
                <span className="text-2xl font-mono tracking-wider">
                  {dialNumber || 'Enter number...'}
                </span>
              </div>
            </div>

            {/* Dialpad */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {dialpadButtons.flat().map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleDialpadClick(digit)}
                  className="aspect-square bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-xl font-semibold transition-colors active:bg-gray-300"
                >
                  {digit}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleBackspace}
                className="flex-1 bg-gray-200 hover:bg-gray-300 py-3 rounded-lg font-medium transition-colors"
                disabled={!dialNumber}
              >
                ⌫
              </button>
              <button
                onClick={handleCall}
                className="flex-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 py-3 px-6 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
                disabled={!dialNumber}
              >
                <Phone className="w-5 h-5" />
                Call
              </button>
              <button
                onClick={() => setIsDialerOpen(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 py-3 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}