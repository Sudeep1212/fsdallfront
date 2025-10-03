import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { FooterComponent } from '../../components/shared/footer/footer.component';

interface TeamMember {
  id: number;
  name: string;
  role: string;
  bio: string;
  skills: string[];
  avatar: string;
  linkedin?: string;
  github?: string;
}

interface Sponsor {
  id: number;
  name: string;
  logo: string;
  description: string;
  website?: string;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule, FooterComponent],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit {
  isDarkMode = false;
  
  // Team members data - showing 4 detailed profiles out of 42 total
  teamMembers: TeamMember[] = [
    {
      id: 1,
      name: 'Alex Chen',
      role: 'Lead Full Stack Developer',
      bio: '5+ years in React, Angular, and Spring Boot. Expert in full-stack development.',
      skills: ['Angular', 'Spring Boot', 'TypeScript', 'Java'],
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
      linkedin: 'https://linkedin.com/in/alexchen',
      github: 'https://github.com/alexchen'
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      role: 'UI/UX Designer & Frontend Developer',
      bio: 'Creative designer specializing in modern web interfaces and user-centered design.',
      skills: ['UI/UX Design', 'React', 'CSS3', 'Figma'],
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b372?w=200&h=200&fit=crop&crop=face',
      linkedin: 'https://linkedin.com/in/sarahjohnson',
      github: 'https://github.com/sarahjohnson'
    },
    {
      id: 3,
      name: 'Michael Rodriguez',
      role: 'Backend Architect & DevOps Engineer',
      bio: 'Expert in microservices architecture and cloud deployment solutions.',
      skills: ['Spring Boot', 'AWS', 'Kubernetes', 'PostgreSQL'],
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
      linkedin: 'https://linkedin.com/in/michaelrodriguez',
      github: 'https://github.com/michaelrodriguez'
    },
    {
      id: 4,
      name: 'Emma Wilson',
      role: 'Product Manager & QA Lead',
      bio: 'Results-driven product manager with expertise in agile methodologies.',
      skills: ['Product Management', 'Agile/Scrum', 'Testing', 'Analytics'],
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
      linkedin: 'https://linkedin.com/in/emmawilson',
      github: 'https://github.com/emmawilson'
    }
  ];
  
  // Sponsors data
  sponsors: Sponsor[] = [
    {
      id: 1,
      name: 'TechCorp',
      logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg',
      description: 'Leading technology solutions provider',
      website: 'https://techcorp.com'
    },
    {
      id: 2,
      name: 'InnovateHub',
      logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/microsoft/microsoft-original.svg',
      description: 'Innovation and startup accelerator',
      website: 'https://innovatehub.com'
    },
    {
      id: 3,
      name: 'EduTech Solutions',
      logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazon/amazon-original.svg',
      description: 'Educational technology platform',
      website: 'https://edutech.com'
    },
    {
      id: 4,
      name: 'CloudVentures',
      logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/apple/apple-original.svg',
      description: 'Cloud infrastructure services',
      website: 'https://cloudventures.com'
    },
    {
      id: 5,
      name: 'DataFlow Inc',
      logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/facebook/facebook-original.svg',
      description: 'Big data and analytics solutions',
      website: 'https://dataflow.com'
    },
    {
      id: 6,
      name: 'NextGen Labs',
      logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg',
      description: 'Research and development lab',
      website: 'https://nextgenlabs.com'
    },
    {
      id: 7,
      name: 'CodeCraft Studios',
      logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
      description: 'Modern web development agency',
      website: 'https://codecraft.studio'
    },
    {
      id: 8,
      name: 'Digital Horizon',
      logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
      description: 'Full-stack development solutions',
      website: 'https://digitalhorizon.net'
    }
  ];
  
  // Event management workflow steps
  workflowSteps = [
    {
      id: 1,
      title: 'Event Creation',
      description: 'Organizers create events with detailed information, schedules, and requirements.',
      icon: 'create'
    },
    {
      id: 2,
      title: 'Registration System',
      description: 'Seamless registration process for participants with automated confirmations.',
      icon: 'register'
    },
    {
      id: 3,
      title: 'Event Management',
      description: 'Real-time event tracking, participant management, and communication tools.',
      icon: 'manage'
    },
    {
      id: 4,
      title: 'Analytics & Feedback',
      description: 'Comprehensive analytics and feedback collection for continuous improvement.',
      icon: 'analytics'
    }
  ];
  
  constructor(
    private themeService: ThemeService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}
  
  ngOnInit(): void {
    // Subscribe to theme changes
    this.themeService.isDarkMode$.subscribe(
      isDark => this.isDarkMode = isDark
    );
  }
  
  // Open sponsor website
  openSponsorWebsite(sponsor: Sponsor): void {
    if (sponsor.website) {
      window.open(sponsor.website, '_blank');
    }
  }
  
  // Helper methods for fallback images
  getTeamMemberFallbackImage(name: string): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3a72ec&color=ffffff&size=200`;
  }
  
  getSponsorFallbackImage(name: string): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=8b5cf6&color=ffffff&size=80`;
  }
  
  // Handle image errors
  onTeamImageError(member: TeamMember): void {
    member.avatar = this.getTeamMemberFallbackImage(member.name);
  }
  
  onSponsorImageError(sponsor: Sponsor): void {
    sponsor.logo = this.getSponsorFallbackImage(sponsor.name);
  }

  // Open team member social links
  openLinkedIn(member: TeamMember): void {
    if (member.linkedin) {
      window.open(member.linkedin, '_blank');
    }
  }
  
  openGitHub(member: TeamMember): void {
    if (member.github) {
      window.open(member.github, '_blank');
    }
  }
}