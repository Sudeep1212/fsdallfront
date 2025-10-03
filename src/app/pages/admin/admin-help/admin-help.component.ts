import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface HelpSection {
  id: string;
  title: string;
  icon: string;
  expanded: boolean;
  items: HelpItem[];
}

interface HelpItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-admin-help',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-help.component.html',
  styleUrl: './admin-help.component.scss'
})
export class AdminHelpComponent implements OnInit {
  searchTerm: string = '';
  filteredSections: HelpSection[] = [];
  
  helpSections: HelpSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: 'rocket',
      expanded: true,
      items: [
        {
          question: 'How do I navigate the admin panel?',
          answer: 'Use the sidebar on the left to access different modules. The dashboard provides an overview of all entities. Each module has its own dedicated page for managing that entity type.'
        },
        {
          question: 'What is the Dashboard?',
          answer: 'The Dashboard is your command center showing real-time statistics, recent activities, and quick access to all modules. It displays total counts for Events, Clubs, Participants, Registrations, and more.'
        },
        {
          question: 'How do I create a new event?',
          answer: 'Navigate to Modules → Events, click the "Create Event" button, fill in all required fields (name, description, date, venue, club), and click "Create Event". The event will appear in the table immediately.'
        },
        {
          question: 'Can I edit existing records?',
          answer: 'Yes! Most modules (Events, Clubs, Venues, etc.) have an Edit button (pencil icon) next to each record. Click it, modify the fields, and save your changes.'
        }
      ]
    },
    {
      id: 'managing-modules',
      title: 'Managing Modules',
      icon: 'grid',
      expanded: false,
      items: [
        {
          question: 'What are the different modules?',
          answer: 'There are 15 modules: Events, Clubs, Venues, Judges, Sponsors, Volunteers, Budgets, Departments, Results, Participations, Registrations, Feedbacks, Users, Admins, and Comments. Each manages a specific entity type.'
        },
        {
          question: 'Which modules support full CRUD operations?',
          answer: 'Full CRUD (Create, Read, Update, Delete): Events, Clubs, Venues, Judges, Sponsors, Volunteers, Budgets, Departments, Results, and Admins. View-Delete only: Participations, Registrations, Feedbacks, Users, and Comments.'
        },
        {
          question: 'How do I delete a record?',
          answer: 'Click the red trash icon next to any record. A confirmation modal will appear. Confirm deletion to permanently remove the record. Note: Deleting certain records (like Clubs) may cascade delete related records.'
        },
        {
          question: 'What is the difference between Users and Admins?',
          answer: 'Users are students who register for events. Admins are platform administrators (you!) who manage all data. User passwords are always hidden for privacy. Admin passwords are bcrypt-hashed for security.'
        },
        {
          question: 'Can I export data?',
          answer: 'Yes! The Feedbacks module has an "Export to Excel" button that downloads all feedback data as a formatted .xlsx file with proper column widths.'
        }
      ]
    },
    {
      id: 'search-filter',
      title: 'Search & Filter',
      icon: 'search',
      expanded: false,
      items: [
        {
          question: 'How do I search for records?',
          answer: 'Every module has a search bar at the top. Type any keyword to filter records in real-time. Search works across multiple fields (name, email, description, etc.).'
        },
        {
          question: 'How do I clear a search?',
          answer: 'Click the "X" button that appears in the search bar when you have typed something. This will reset the view to show all records.'
        },
        {
          question: 'Does search work with partial matches?',
          answer: 'Yes! Search is case-insensitive and matches partial text. For example, searching "tech" will find "TechFest", "technical", and "TechClub".'
        }
      ]
    },
    {
      id: 'activity-tracking',
      title: 'Activity Tracking',
      icon: 'activity',
      expanded: false,
      items: [
        {
          question: 'What is the Recents page?',
          answer: 'The Recents page shows all admin activities in chronological order. It displays who created, updated, or deleted which entity and when. This helps track changes and monitor admin actions.'
        },
        {
          question: 'What appears in Dashboard Recent Activity?',
          answer: 'The Dashboard shows the last 5-10 recent admin activities with the activity description and timestamp. This gives you a quick overview of recent changes without navigating to the Recents page.'
        },
        {
          question: 'How long is activity history stored?',
          answer: 'All activity logs are stored permanently in the database. You can view the complete history anytime on the Recents page.'
        }
      ]
    },
    {
      id: 'security',
      title: 'Security & Permissions',
      icon: 'shield',
      expanded: false,
      items: [
        {
          question: 'Are passwords secure?',
          answer: 'Absolutely! User and Admin passwords are never displayed in the interface. Admin passwords are hashed using bcrypt (industry-standard one-way encryption) before storage. Nobody, including admins, can view plain-text passwords.'
        },
        {
          question: 'Can I delete my own admin account?',
          answer: 'No, the system prevents self-deletion. The delete button is disabled for your own account to prevent accidental lockouts. You can edit your account but not delete it.'
        },
        {
          question: 'Who can access the admin panel?',
          answer: 'Only users with admin role can access the admin panel. Admin authentication is separate from student authentication. Admins must log in via the admin login page.'
        },
        {
          question: 'Does my session persist?',
          answer: 'Yes! When you log in, your session is saved in localStorage. If you close the browser and return later, you\'ll be automatically redirected to the admin dashboard without needing to log in again.'
        }
      ]
    },
    {
      id: 'tips-tricks',
      title: 'Tips & Best Practices',
      icon: 'lightbulb',
      expanded: false,
      items: [
        {
          question: 'How do I quickly refresh data?',
          answer: 'Use the "Sync" button on the Dashboard (rotating arrows icon) to refresh all statistics. Individual modules reload data automatically after Create, Update, or Delete operations.'
        },
        {
          question: 'What if I accidentally delete something?',
          answer: 'Deletion is permanent and cannot be undone. Always double-check before confirming deletion. The confirmation modal shows exactly what will be deleted and warns about cascade deletes.'
        },
        {
          question: 'How do I create an event with all relationships?',
          answer: 'Before creating an event, ensure the required entities exist: Venue, Club, and Judge. Create these first in their respective modules, then they\'ll appear in the Event creation form dropdowns.'
        },
        {
          question: 'Can I view user-submitted data?',
          answer: 'Yes! Registrations show who registered for events, Participations show who participated, Feedbacks show user feedback with ratings, and Comments show user comments. All these are View-Delete only to preserve data integrity.'
        }
      ]
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: 'tool',
      expanded: false,
      items: [
        {
          question: 'The delete success message is not showing',
          answer: 'This has been fixed! Toast notifications now use the YOKATTA pattern (no *ngIf on toast elements, only [class.show] binding). If you still don\'t see toasts, check browser console for errors.'
        },
        {
          question: 'Dropdown lists are empty in forms',
          answer: 'Empty dropdowns mean the related entities haven\'t been created yet. For example, if Event venue dropdown is empty, go to Venues module and create venues first.'
        },
        {
          question: 'Search is not working',
          answer: 'Ensure you\'re typing in the search field and that records exist. Search filters in real-time as you type. If no matches are found, you\'ll see a "No results" message.'
        },
        {
          question: 'How do I log out?',
          answer: 'Click your admin name/icon at the bottom of the sidebar. This will open account options where you can log out. Logging out clears your session and redirects to the login page.'
        }
      ]
    },
    {
      id: 'keyboard-shortcuts',
      title: 'Keyboard Shortcuts',
      icon: 'keyboard',
      expanded: false,
      items: [
        {
          question: 'Are there keyboard shortcuts?',
          answer: 'While dedicated keyboard shortcuts are not yet implemented, you can use standard browser shortcuts: Ctrl+F to search within a page, Tab to navigate form fields, Enter to submit forms, and Esc to close modals.'
        },
        {
          question: 'How do I quickly navigate between modules?',
          answer: 'Use the sidebar navigation. Click on any module name to navigate instantly. The active module is highlighted in the sidebar so you always know where you are.'
        }
      ]
    }
  ];

  ngOnInit() {
    this.filteredSections = [...this.helpSections];
  }

  toggleSection(sectionId: string) {
    const section = this.helpSections.find(s => s.id === sectionId);
    if (section) {
      section.expanded = !section.expanded;
    }
  }

  filterHelp() {
    const term = this.searchTerm.toLowerCase().trim();
    
    if (!term) {
      this.filteredSections = [...this.helpSections];
      // Reset all expanded states
      this.filteredSections.forEach(section => section.expanded = false);
      this.filteredSections[0].expanded = true; // Expand first section by default
      return;
    }

    // Filter sections and items based on search term
    this.filteredSections = this.helpSections
      .map(section => ({
        ...section,
        expanded: true, // Expand all matching sections
        items: section.items.filter(item =>
          item.question.toLowerCase().includes(term) ||
          item.answer.toLowerCase().includes(term)
        )
      }))
      .filter(section => section.items.length > 0);
  }

  clearSearch() {
    this.searchTerm = '';
    this.filterHelp();
  }

  get totalQuestions(): number {
    return this.helpSections.reduce((total, section) => total + section.items.length, 0);
  }

  get visibleQuestions(): number {
    return this.filteredSections.reduce((total, section) => total + section.items.length, 0);
  }
}
