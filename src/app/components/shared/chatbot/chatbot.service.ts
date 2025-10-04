import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isLoading?: boolean;
  isStreaming?: boolean; // New property to track streaming state
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  contextSent: boolean;
  startTime: Date;
}

@Injectable({
  providedIn: 'root',
})
export class ChatbotService {
  private isOpenSubject = new BehaviorSubject<boolean>(false);
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  private currentSessionSubject = new BehaviorSubject<ChatSession | null>(null);

  public isOpen$ = this.isOpenSubject.asObservable();
  public messages$ = this.messagesSubject.asObservable();
  public isLoading$ = this.isLoadingSubject.asObservable();
  public currentSession$ = this.currentSessionSubject.asObservable();

  private baseUrl = environment.apiUrl || 'https://fsdallback.onrender.com';
  private siteContext: any = null;

  // --- streaming queue & controls ---
  private chunkQueues: Map<string, string[]> = new Map();
  private processingFlags: Map<string, boolean> = new Map();
  private doneFlags: Map<string, boolean> = new Map();

  private normalCharDelay = 23; // ms per character for normal bot responses (tweakable: 40-80)
  private welcomeCharDelay = 19; // ms per character for welcome message (faster)
  private maxChunkSize = 120; // break incoming large chunks into these sized sub-chunks (chars)

  constructor(private http: HttpClient, private ngZone: NgZone) {
    this.initializeSiteContext();
  }

  // Safely extract textual content from SSE event data
  private extractTextFromEventData(raw: string): string {
    if (!raw) return '';
    // Direct special sentinel
    if (raw === '[DONE]') return '[DONE]';

    try {
      const parsed = JSON.parse(raw);

      // Known Gemini shapes:
      // { candidates: [ { content: { parts: [ { text: "..." } ] } } ] }
      if (parsed?.candidates && Array.isArray(parsed.candidates)) {
        const cand = parsed.candidates[0];
        if (cand?.content?.parts && Array.isArray(cand.content.parts)) {
          return cand.content.parts.map((p: any) => p.text || '').join('');
        }
      }

      // Other common shapes:
      if (typeof parsed === 'string') return parsed;
      if (parsed?.text) return parsed.text;
      if (parsed?.delta?.content) return parsed.delta.content;
      if (parsed?.content && typeof parsed.content === 'string') return parsed.content;

      // Fallback: find first string property
      for (const k of Object.keys(parsed)) {
        if (typeof parsed[k] === 'string' && parsed[k].trim()) return parsed[k];
      }

      return '';
    } catch (e) {
      // raw is plain text — return as-is
      return raw;
    }
  }

  // Break a string into array of safe Unicode-aware subchunks of maxLength characters
  private chunkStringByLength(text: string, maxLength: number): string[] {
    const chars = Array.from(text); // UTF-8 safe
    const chunks: string[] = [];
    for (let i = 0; i < chars.length; i += maxLength) {
      chunks.push(chars.slice(i, i + maxLength).join(''));
    }
    return chunks;
  }

  // Enqueue a received chunk for a messageId and kick off processor
  private enqueueChunk(messageId: string, chunk: string, charDelayMs?: number): void {
    if (!chunk) return;

    // split large chunks into smaller subchunks for streaming responsiveness
    const subChunks = this.chunkStringByLength(chunk, this.maxChunkSize);

    const q = this.chunkQueues.get(messageId) || [];
    q.push(...subChunks);
    this.chunkQueues.set(messageId, q);

    // If charDelay not provided, use normal delay
    const delay = typeof charDelayMs === 'number' ? charDelayMs : this.normalCharDelay;

    // kick processor (it guards re-entry)
    this.processQueue(messageId, delay).catch((err) => {
      console.error('Error processing chunk queue for', messageId, err);
    });
  }

  // Process the queue for a given message id: dequeue chunk-by-chunk and type them character-by-character.
  private async processQueue(messageId: string, charDelayMs: number): Promise<void> {
    if (this.processingFlags.get(messageId)) return; // already processing
    this.processingFlags.set(messageId, true);

    try {
      while (true) {
        const q = this.chunkQueues.get(messageId) || [];
        if (q.length === 0) break;

        const nextChunk = q.shift() || '';
        this.chunkQueues.set(messageId, q);

        // Type the next chunk character-by-character (UTF-8 safe)
        const chars = Array.from(nextChunk);
        for (let i = 0; i < chars.length; i++) {
          // update UI inside NgZone
          this.ngZone.run(() => {
            const currentMessages = this.messagesSubject.value;
            const targetMessage = currentMessages.find((msg) => msg.id === messageId);
            if (targetMessage) {
              targetMessage.content += chars[i];
              // push new array reference to trigger change detection
              this.messagesSubject.next([...currentMessages]);
            }
          });

          await this.delay(charDelayMs);
        }
      }

      // If server already sent [DONE] and queue empty -> complete the message
      if (this.doneFlags.get(messageId)) {
        this.ngZone.run(() => {
          this.completeMessageStreaming(messageId);
        });
        // cleanup
        this.doneFlags.delete(messageId);
        this.chunkQueues.delete(messageId);
      }
    } finally {
      this.processingFlags.set(messageId, false);
    }
  }

  // Initialize comprehensive site context for Gemini API
  private initializeSiteContext(): void {
    this.siteContext = {
      platform: {
        name: 'FestFlex',
        description: 'Professional Events Management Platform',
        purpose: 'Seamless event organization, registration, and participation',
        theme: 'Gradient Blue mix with purple (#3A72EC primary color)',
        features: [
          'Event Management',
          'User Registration',
          'Gallery',
          'Support System',
          'Interactive Dashboard',
        ],
      },
      pages: {
        home: {
          purpose: 'Main landing page with event highlights and user engagement',
          features: ['Hero section', 'Upcoming events', 'Comment system', 'Interactive timeline'],
          content: 'Welcome to FestFlex - where exceptional events come to life',
        },
        about: {
          purpose: 'Information about the platform, team, and mission',
          features: ['Team showcase', 'Mission statement', 'Platform overview'],
          content: 'Learn about our mission to revolutionize event management',
        },
        gallery: {
          purpose: 'Visual showcase of past events and memories',
          features: ['Image gallery', 'Event highlights', 'Photo collections'],
          content: 'Explore memorable moments from our successful events',
        },
        support: {
          purpose: 'User assistance and help center',
          features: ['FAQ section', 'Contact forms', 'Help documentation'],
          content: 'Get help and support for all your event management needs',
        },
      },
      userTypes: {
        students: 'Can browse events, register, participate, and view content',
        admins: 'Can create events, manage registrations, and oversee platform',
      },
      navigation: {
        preLogin: ['Home', 'About', 'Gallery', 'Support'],
        postLogin: ['Dashboard', 'Events', 'Profile', 'Calendar'],
      },
      contact: {
        support: 'Available through contact forms and FAQ section',
        assistance: 'Real-time help through this chatbot system',
      },
    };
  }

  // Toggle chatbot sidebar visibility
  toggleChatbot(): void {
    const isCurrentlyOpen = this.isOpenSubject.value;
    console.log('🤖 ChatbotService.toggleChatbot() called. Current state:', isCurrentlyOpen);

    if (!isCurrentlyOpen) {
      console.log('🤖 Opening chatbot...');
      this.openChatbot();
    } else {
      console.log('🤖 Closing chatbot...');
      this.closeChatbot();
    }
  }

  // Open chatbot and initialize session
  openChatbot(): void {
    this.isOpenSubject.next(true);

    // Create new session if none exists
    if (!this.currentSessionSubject.value) {
      this.createNewSession();
    }
  }

  // Close chatbot
  closeChatbot(): void {
    this.isOpenSubject.next(false);
  }

  // Create new chat session
  private createNewSession(): void {
    const newSession: ChatSession = {
      id: this.generateSessionId(),
      messages: [],
      contextSent: false,
      startTime: new Date(),
    };

    this.currentSessionSubject.next(newSession);
    this.messagesSubject.next([]);

    // Send welcome message immediately without delay
    this.addBotMessageWithStreaming(
      "Hello! I'm your FestFlex assistant. How can I help you today?"
    );
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Send user message and get bot response with real streaming
  async sendMessage(userMessage: string): Promise<void> {
    if (!userMessage.trim()) return;

    const currentSession = this.currentSessionSubject.value;
    if (!currentSession) return;

    // Add user message
    this.addUserMessage(userMessage);

    // Set loading state briefly (shows typing indicator)
    this.isLoadingSubject.next(true);

    try {
      // Prepare context and message for API
      const payload = {
        message: userMessage,
        context: !currentSession.contextSent ? this.siteContext : null,
        sessionId: currentSession.id,
      };

      // Mark context as sent
      if (!currentSession.contextSent) {
        currentSession.contextSent = true;
        this.currentSessionSubject.next(currentSession);
      }

      // INSTANT BUBBLE CREATION: Create response bubble immediately but empty
      const responseMessage: ChatMessage = {
        id: this.generateMessageId(),
        content: '',
        sender: 'bot',
        timestamp: new Date(),
        isLoading: false,
        isStreaming: true,
      };

      // Add bubble to DOM immediately using NgZone - user sees it instantly
      this.ngZone.run(() => {
        console.log('🎯 CREATING INSTANT BUBBLE - should appear immediately');
        this.addMessageToSession(responseMessage);
        console.log(
          '✅ Bubble added to messages. Current count:',
          this.messagesSubject.value.length
        );
      });

      // Hide global loading indicator as we now have a streaming bubble
      this.isLoadingSubject.next(false);

      // Start real streaming from backend
      await this.streamRealResponseFromBackend(payload, responseMessage.id);

      // Mark streaming as complete
      this.updateMessageStreamingState(responseMessage.id, false);
    } catch (error) {
      console.error('Error sending message to chatbot:', error);
      // Handle error with immediate response
      const errorMessage: ChatMessage = {
        id: this.generateMessageId(),
        content:
          "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
        sender: 'bot',
        timestamp: new Date(),
        isLoading: false,
        isStreaming: false,
      };
      this.addMessageToSession(errorMessage);
      this.isLoadingSubject.next(false);
    }
  }

  // Add user message to chat
  private addUserMessage(content: string): void {
    const message: ChatMessage = {
      id: this.generateMessageId(),
      content,
      sender: 'user',
      timestamp: new Date(),
    };

    this.addMessageToSession(message);
  }

  // Add bot message to chat
  private addBotMessage(content: string): void {
    const message: ChatMessage = {
      id: this.generateMessageId(),
      content,
      sender: 'bot',
      timestamp: new Date(),
    };

    this.addMessageToSession(message);
  }

  // Add bot message with streaming effect inside response bubble
  private async addBotMessageWithStreaming(
    content: string,
    isWelcome: boolean = false
  ): Promise<void> {
    const message: ChatMessage = {
      id: this.generateMessageId(),
      content: '',
      sender: 'bot',
      timestamp: new Date(),
      isLoading: false,
      isStreaming: true,
    };

    this.addMessageToSession(message);

    // enqueue the whole content for this new message; queue processor will type it
    const delay = isWelcome ? this.welcomeCharDelay : this.normalCharDelay;
    this.enqueueChunk(message.id, content, delay);

    // don't await here — enqueue is enough; completion will be handled when done flag set or when queue empties.
  }

  // SIMPLIFIED: Use GET request for SSE streaming
  private async streamRealResponseFromBackend(payload: any, messageId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('🚀 Starting SSE word-by-word streaming for message:', messageId);

        // Encode payload as URL parameters for SSE GET request
        const params = new URLSearchParams({
          message: payload.message,
          sessionId: payload.sessionId || 'default',
          context: payload.context ? JSON.stringify(payload.context) : '',
        });

        // Create SSE connection
        const eventSource = new EventSource(
          `${this.baseUrl}/api/chatbot/stream-words-get?${params.toString()}`
        );

        eventSource.onmessage = (event) => {
          const raw = event.data;
          // immediate debug log (optional)
          console.log('📦 SSE raw chunk:', raw);

          // End of stream sentinel
          if (raw === '[DONE]') {
            console.log('🏁 Stream DONE received for', messageId);
            this.doneFlags.set(messageId, true);
            // if no queue pending and not processing, complete immediately
            const q = this.chunkQueues.get(messageId) || [];
            if (q.length === 0 && !this.processingFlags.get(messageId)) {
              this.ngZone.run(() => this.completeMessageStreaming(messageId));
              this.doneFlags.delete(messageId);
              this.chunkQueues.delete(messageId);
            }
            return;
          }

          // Extract the textual portion safely
          const textToAppend = this.extractTextFromEventData(raw);
          if (!textToAppend) return;

          // Enqueue for controlled typing (use normal speed)
          this.enqueueChunk(messageId, textToAppend, this.normalCharDelay);
        };

        eventSource.onopen = () => {
          console.log('✅ SSE connection opened');
        };

        eventSource.onerror = (error) => {
          console.error('❌ SSE error:', error);
          eventSource.close();
          this.ngZone.run(() => {
            this.completeMessageStreaming(messageId);
          });
          resolve(); // Resolve even on error to prevent hanging
        };

        // Auto cleanup after 60 seconds
        setTimeout(() => {
          if (eventSource.readyState !== EventSource.CLOSED) {
            console.log('⏰ SSE timeout, closing connection');
            eventSource.close();
            this.ngZone.run(() => {
              this.completeMessageStreaming(messageId);
            });
            resolve();
          }
        }, 60000);
      } catch (error) {
        console.error('❌ SSE streaming error:', error);
        this.ngZone.run(() => {
          this.updateMessageContent(
            messageId,
            "I'm sorry, I encountered an error while processing your request."
          );
          this.completeMessageStreaming(messageId);
        });
        reject(error);
      }
    });
  }

  // Append chunk to message content in real-time
  private appendChunkToMessageReal(messageId: string, chunk: string): void {
    const currentMessages = this.messagesSubject.value;
    const targetMessage = currentMessages.find((msg) => msg.id === messageId);

    if (targetMessage) {
      // Add chunk to existing content
      const newContent = targetMessage.content + chunk;
      this.updateMessageContent(messageId, newContent);
    }
  }

  // Complete message streaming
  // Complete message streaming - FIXED with NgZone
  private completeMessageStreaming(messageId: string): void {
    this.ngZone.run(() => {
      console.log('🏁 COMPLETING STREAMING for message:', messageId);

      const currentMessages = this.messagesSubject.value;
      const targetMessage = currentMessages.find((msg) => msg.id === messageId);

      if (targetMessage) {
        console.log('✅ Final message content:', targetMessage.content);
        targetMessage.isStreaming = false;
        targetMessage.timestamp = new Date();
        this.messagesSubject.next([...currentMessages]);
        console.log('🎯 STREAMING COMPLETE - Bubble should show final content');
      }
    });
  }

  // Append a chunk to existing message content with word-by-word streaming effect
  private async appendChunkToMessage(messageId: string, chunk: string): Promise<void> {
    const words = chunk.split(' ');

    for (let i = 0; i < words.length; i++) {
      const word = words[i];

      // Get current message content
      const currentMessages = this.messagesSubject.value;
      const targetMessage = currentMessages.find((msg) => msg.id === messageId);

      if (targetMessage) {
        // Add word to existing content
        const newContent = targetMessage.content + (targetMessage.content ? ' ' : '') + word;
        this.updateMessageContent(messageId, newContent);

        // Small delay between words for smooth streaming effect
        await this.delay(30 + Math.random() * 40); // 30-70ms per word
      }
    }
  }

  // Stream message content with ULTRA-FAST word-by-word visual growth
  private async streamMessageContent(messageId: string, fullContent: string): Promise<void> {
    console.log('⚡ ULTRA-FAST STREAMING:', fullContent);
    const words = fullContent.split(' ');
    let currentContent = '';

    for (let i = 0; i < words.length; i++) {
      currentContent += (i > 0 ? ' ' : '') + words[i];

      console.log(`� Word ${i + 1}/${words.length}: "${currentContent}"`);

      // Update the message content - THIS CREATES VISUAL GROWTH
      this.updateMessageContent(messageId, currentContent);

      // ULTRA-FAST DELAY: 20-40ms between words for smooth visual streaming
      const streamDelay = 20 + Math.random() * 20; // 20-40ms
      await this.delay(streamDelay);
    }

    console.log('⚡ ULTRA-FAST STREAMING COMPLETE!');
  }

  // Update specific message content (text grows inside bubble) - FIXED with NgZone
  private updateMessageContent(messageId: string, newContent: string): void {
    this.ngZone.run(() => {
      console.log(
        '🔄 Updating message content:',
        messageId,
        'New content length:',
        newContent.length
      );

      const currentMessages = this.messagesSubject.value;
      const updatedMessages = currentMessages.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              content: newContent,
              // Keep original isLoading and isStreaming states - don't change during streaming
            }
          : msg
      );

      this.messagesSubject.next(updatedMessages);
      console.log('✅ Messages updated, current count:', updatedMessages.length);

      // Update session
      const currentSession = this.currentSessionSubject.value;
      if (currentSession) {
        currentSession.messages = updatedMessages;
        this.currentSessionSubject.next(currentSession);
      }
    });
  }

  // Update message streaming state
  private updateMessageStreamingState(messageId: string, isStreaming: boolean): void {
    const currentMessages = this.messagesSubject.value;
    const updatedMessages = currentMessages.map((msg) =>
      msg.id === messageId
        ? {
            ...msg,
            isStreaming: isStreaming,
          }
        : msg
    );

    this.messagesSubject.next(updatedMessages);

    // Update session
    const currentSession = this.currentSessionSubject.value;
    if (currentSession) {
      currentSession.messages = updatedMessages;
      this.currentSessionSubject.next(currentSession);
    }
  }

  // Delay utility for streaming effect
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Add message to current session
  private addMessageToSession(message: ChatMessage): void {
    console.log(
      '📨 Adding message to session:',
      message.sender,
      message.content || 'EMPTY',
      message.isStreaming ? 'STREAMING' : 'COMPLETE'
    );

    const currentMessages = this.messagesSubject.value;
    const updatedMessages = [...currentMessages, message];

    console.log(
      '📊 Message count before:',
      currentMessages.length,
      'after:',
      updatedMessages.length
    );

    this.messagesSubject.next(updatedMessages);
    console.log('🔄 messagesSubject updated with new array');

    // Update session
    const currentSession = this.currentSessionSubject.value;
    if (currentSession) {
      currentSession.messages = updatedMessages;
      this.currentSessionSubject.next(currentSession);
      console.log('✅ Session updated with new messages');
    }
  }

  // Generate unique message ID
  private generateMessageId(): string {
    return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Call Gemini API through backend proxy
  private async callGeminiAPI(payload: any): Promise<string> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    try {
      const response = await this.http
        .post<any>(`${this.baseUrl}/api/chatbot/message`, payload, { headers })
        .toPromise();
      return response.reply || "I'm sorry, I couldn't process your request right now.";
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }

  // Get current chat state
  isOpen(): boolean {
    return this.isOpenSubject.value;
  }

  isLoading(): boolean {
    return this.isLoadingSubject.value;
  }

  getCurrentMessages(): ChatMessage[] {
    return this.messagesSubject.value;
  }

  // Clear chat history
  clearChat(): void {
    console.log('🧹 Clearing chat messages');
    this.messagesSubject.next([]);

    // Reset session without creating welcome message again
    const currentSession = this.currentSessionSubject.value;
    if (currentSession) {
      currentSession.messages = [];
      currentSession.contextSent = false;
      this.currentSessionSubject.next(currentSession);
    }
  }
}
