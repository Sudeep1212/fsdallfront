import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatbotService } from './chatbot.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chatbot-icon',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chatbot-icon.component.html',
  styleUrls: ['./chatbot-icon.component.scss']
})
export class ChatbotIconComponent implements OnInit, OnDestroy {
  isOpen = false;
  hasNewMessage = false;
  
  private subscriptions = new Subscription();

  constructor(private chatbotService: ChatbotService) {}

  ngOnInit(): void {
    console.log('🔵 Chatbot Icon Component Initialized');
    
    // Subscribe to chatbot state
    this.subscriptions.add(
      this.chatbotService.isOpen$.subscribe((isOpen: boolean) => {
        this.isOpen = isOpen;
        console.log('🔵 Chatbot state changed:', isOpen);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  toggleChatbot(): void {
    console.log('🔵 Chatbot icon clicked! Toggling sidebar...');
    this.chatbotService.toggleChatbot();
  }
}