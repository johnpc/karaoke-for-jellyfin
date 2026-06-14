// Core session lifecycle and user management
import { KaraokeSession, ConnectedUser } from "@/types";
import {
  createKaraokeSession,
  createConnectedUser,
  updateSessionActivity,
} from "@/lib/utils";
import { ValidationError } from "@/lib/validation";
import { SessionEventEmitter } from "./event-emitter";
import { addUser, removeUser, updateUserSocketId } from "./users";

export class SessionCore extends SessionEventEmitter {
  protected session: KaraokeSession | null = null;
  protected skipInProgress: boolean = false;
  protected songTransitionInProgress: boolean = false;
  protected queueOperationInProgress: boolean = false;

  createSession(sessionName: string, hostName: string): KaraokeSession {
    if (this.session) throw new ValidationError("A session is already active");
    const hostUser = createConnectedUser(hostName, true);
    this.session = createKaraokeSession(sessionName, hostUser);
    this.emit("session-created", this.session);
    return this.session;
  }

  getSession(): KaraokeSession | null {
    return this.session;
  }

  destroySession(): void {
    if (this.session) {
      const sessionId = this.session.id;
      this.session = null;
      this.emit("session-destroyed", { sessionId });
    }
  }

  updateSessionActivity(): void {
    if (this.session) {
      this.session = updateSessionActivity(this.session);
    }
  }

  addUser(userName: string, socketId?: string): ConnectedUser {
    if (!this.session) throw new ValidationError("No active session");
    const result = addUser(this.session, userName, this, socketId);
    this.session = result.session;
    return result.user;
  }

  removeUser(userId: string): void {
    if (!this.session) throw new ValidationError("No active session");
    this.session = removeUser(this.session, userId, this);
  }

  getConnectedUsers(): ConnectedUser[] {
    return this.session?.connectedUsers || [];
  }

  updateUserSocketId(userId: string, socketId: string): void {
    if (this.session) updateUserSocketId(this.session, userId, socketId);
  }
}
