import crypto from 'crypto';

interface CallSession {
  id: string;
  callerId: string;
  calleeId: string;
  callerName: string;
  type: 'audio' | 'video';
  status: 'ringing' | 'accepted' | 'rejected' | 'ended' | 'missed';
  startTime?: Date;
  endTime?: Date;
}

export class CallService {
  private activeCalls: Map<string, CallSession> = new Map();
  private waitingCalls: Map<string, CallSession> = new Map();

  initiateCall(callerId: string, calleeId: string, callerName: string, type: 'audio' | 'video'): CallSession {
    const callId = crypto.randomUUID();
    const call: CallSession = { id: callId, callerId, calleeId, callerName, type, status: 'ringing' };
    this.activeCalls.set(callId, call);
    this.waitingCalls.set(calleeId, call);
    return call;
  }

  acceptCall(callId: string): CallSession | null {
    const call = this.activeCalls.get(callId);
    if (call && call.status === 'ringing') {
      call.status = 'accepted';
      call.startTime = new Date();
      this.waitingCalls.delete(call.calleeId);
    }
    return call || null;
  }

  rejectCall(callId: string): CallSession | null {
    const call = this.activeCalls.get(callId);
    if (call) { call.status = 'rejected'; this.waitingCalls.delete(call.calleeId); }
    return call || null;
  }

  endCall(callId: string): CallSession | null {
    const call = this.activeCalls.get(callId);
    if (call) { call.status = 'ended'; call.endTime = new Date(); this.waitingCalls.delete(call.calleeId); }
    return call || null;
  }

  getPendingCall(userId: string): CallSession | null {
    return this.waitingCalls.get(userId) || null;
  }

  getCallStatus(callId: string): CallSession | null {
    return this.activeCalls.get(callId) || null;
  }
}

export const callService = new CallService();