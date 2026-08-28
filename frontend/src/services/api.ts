import { CurateGroupPayload, CurateResponse, FeedbackPayload } from '../types/api';

const API_BASE = '/api/v1';

export const apiService = {
  /**
   * Sends a group thumbnail chunk for AI curation.
   */
  async submitGroupForCuration(payload: CurateGroupPayload): Promise<CurateResponse> {
    const response = await fetch(`${API_BASE}/curate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to submit group for curation: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Connects to Server-Sent Events (SSE) stream.
   */
  createEventSource(): EventSource {
    return new EventSource(`${API_BASE}/stream`);
  },

  /**
   * Sends user feedback and attention zoom logs.
   */
  async submitFeedback(payload: FeedbackPayload): Promise<void> {
    const response = await fetch(`${API_BASE}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to submit feedback: ${response.statusText}`);
    }
  },
};
