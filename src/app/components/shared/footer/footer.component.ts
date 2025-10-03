import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  @Input() currentPage: string = '';
  
  currentYear = new Date().getFullYear();
  
  get quickLinks() {
    const allPages = [
      { name: 'Home', route: '/' },
      { name: 'About Us', route: '/about' },
      { name: 'Gallery', route: '/gallery' },
      { name: 'Support', route: '/support' },
      { name: 'Calendar', route: '/calendar' }
    ];
    
    // Return all pages except the current one
    return allPages.filter(page => 
      (this.currentPage === 'home' && page.route !== '/') ||
      (this.currentPage === 'about' && page.route !== '/about') ||
      (this.currentPage === 'gallery' && page.route !== '/gallery') ||
      (this.currentPage === 'support' && page.route !== '/support') ||
      (this.currentPage === 'calendar' && page.route !== '/calendar') ||
      (!this.currentPage) // Show all if currentPage not specified
    );
  }

  servicesLinks = [
    { name: 'Event Management', route: '/services' },
    { name: 'Registration System', route: '/services' },
    { name: 'Analytics Dashboard', route: '/services' },
    { name: 'Custom Solutions', route: '/services' }
  ];

  supportLinks = [
    { name: 'Help Center', route: '/support' },
    { name: 'Documentation', route: '/docs' },
    { name: 'API Reference', route: '/api-docs' },
    { name: 'Community Forum', route: '/forum' }
  ];

  legalLinks = [
    { name: 'Terms of Service', route: '/legal/terms' },
    { name: 'Privacy Policy', route: '/legal/privacy' },
    { name: 'Cookie Policy', route: '/legal/cookies' },
    { name: 'Licenses', route: '/legal/licenses' }
  ];

  socialLinks = [
    { name: 'Twitter', url: 'https://twitter.com/eventspro', icon: 'twitter' },
    { name: 'LinkedIn', url: 'https://linkedin.com/company/eventspro', icon: 'linkedin' },
    { name: 'GitHub', url: 'https://github.com/eventspro', icon: 'github' },
    { name: 'Discord', url: 'https://discord.gg/eventspro', icon: 'discord' }
  ];
}