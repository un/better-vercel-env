interface SessionTokenRecord {
  token: string;
  updatedAt: number;
}

class SessionTokenStore {
  private readonly sessions = new Map<string, SessionTokenRecord>();

  setToken(sessionId: string, token: string): void {
    this.sessions.set(sessionId, {
      token,
      updatedAt: Date.now(),
    });
  }

  getToken(sessionId: string): string | null {
    return this.sessions.get(sessionId)?.token ?? null;
  }

  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}

export const sessionTokenStore = new SessionTokenStore();
