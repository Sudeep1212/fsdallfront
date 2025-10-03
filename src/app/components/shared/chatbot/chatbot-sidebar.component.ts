import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatbotService, ChatMessage } from './chatbot.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chatbot-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot-sidebar.component.html',
  styleUrls: ['./chatbot-sidebar.component.scss']
})
export class ChatbotSidebarComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('chatMessages') private chatMessagesElement!: ElementRef;

  isOpen = false;
  messages: ChatMessage[] = [];
  isLoading = false;
  currentMessage = '';
  
  private subscriptions = new Subscription();
  private shouldScrollToBottom = false;

  constructor(private chatbotService: ChatbotService, private cdr: ChangeDetectorRef) {
    // Debug: Log when input changes
    console.log('💬 ChatbotSidebarComponent initialized');
    console.log('💬 Initial currentMessage:', this.currentMessage);
  }

  // Getter to ensure reactive updates
  get messageLength(): number {
    return this.currentMessage?.length || 0;
  }

  get isSendDisabled(): boolean {
    return !this.currentMessage?.trim() || this.isLoading;
  }

  ngOnInit(): void {
    // Subscribe to chatbot state changes
    this.subscriptions.add(
      this.chatbotService.isOpen$.subscribe((isOpen: boolean) => {
        this.isOpen = isOpen;
      })
    );

    this.subscriptions.add(
      this.chatbotService.messages$.subscribe((messages: ChatMessage[]) => {
        console.log('🎭 Component received messages update. Count:', messages.length);
        messages.forEach((msg, index) => {
          console.log(`   ${index + 1}. ${msg.sender}: "${msg.content || 'EMPTY'}" (streaming: ${msg.isStreaming})`);
        });
        this.messages = messages;
        this.shouldScrollToBottom = true;
        
        // FORCE Angular change detection
        this.cdr.detectChanges();
        console.log('🔄 Manual change detection triggered');
      })
    );

    this.subscriptions.add(
      this.chatbotService.isLoading$.subscribe((isLoading: boolean) => {
        this.isLoading = isLoading;
        if (isLoading) {
          this.shouldScrollToBottom = true;
        }
      })
    );
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  closeChatbot(): void {
    this.chatbotService.closeChatbot();
  }

  async sendMessage(): Promise<void> {
    if (!this.currentMessage.trim() || this.isLoading) return;

    const message = this.currentMessage.trim();
    this.currentMessage = '';

    await this.chatbotService.sendMessage(message);
  }

  sendSuggestion(suggestion: string): void {
    this.currentMessage = suggestion;
    this.sendMessage();
  }

  clearChat(): void {
    this.chatbotService.clearChat();
  }

  onInputChange(): void {
    // Debug method to track input changes
    console.log('💬 Input changed:', this.currentMessage);
    console.log('💬 Character count:', this.currentMessage.length);
    console.log('💬 Send button should be enabled:', !!this.currentMessage.trim());
  }

  onMessageInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.currentMessage = target.value;
    console.log('💬 Direct input event:', this.currentMessage);
    console.log('💬 Character count:', this.currentMessage.length);
    console.log('💬 Send button should be enabled:', !!this.currentMessage.trim());
  }

  formatMessage(content: string): string {
    // Basic markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
  }

  formatTime(timestamp: Date): string {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  trackByMessageId(index: number, message: ChatMessage): string {
    return message.id;
  }

  hasStreamingMessage(): boolean {
    return this.messages.some(message => message.isStreaming);
  }

  private scrollToBottom(): void {
    if (this.chatMessagesElement?.nativeElement) {
      const element = this.chatMessagesElement.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }
}