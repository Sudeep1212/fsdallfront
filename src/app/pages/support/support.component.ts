import { Component, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FooterComponent } from '../../components/shared/footer/footer.component';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FooterComponent],
  templateUrl: './support.component.html',
  styleUrl: './support.component.scss'
})
export class SupportComponent implements OnInit, AfterViewInit {
  @ViewChild('supportFormRef') supportFormRef!: NgForm;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Handle fragment navigation
    this.route.fragment.subscribe(fragment => {
      if (fragment) {
        // Use a longer timeout to ensure DOM is ready
        setTimeout(() => this.scrollToElement(fragment), 300);
      }
    });
  }

  ngAfterViewInit(): void {
    // Handle fragment if component is already loaded and DOM is ready
    const currentFragment = this.route.snapshot.fragment;
    if (currentFragment) {
      setTimeout(() => this.scrollToElement(currentFragment), 500);
    }
  }

  private scrollToElement(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest' 
      });
    }
  }

  // Form data
  supportForm = {
    subject: '',
    message: '',
    userEmail: ''
  };

  // Form state
  isSubmitting = false;
  submitMessage = '';

  // Contact information
  contactInfo = {
    address: 'TCET, A-Block, Gate No 5, Thakur Educational Campus, Thakur Rd, Thakur Village, Kandivali East, Mumbai, Maharashtra 400101',
    email: 'festflex.support@outlook.com',
    phone: '+91 000873 3210'
  };

  onSubmitSupportForm() {
    // Validate form before showing popup
    if (this.supportFormRef.form.valid) {
      // Show login-required popup (same as Calendar navigation)
      this.showLoginRequiredPopup();
    } else {
      // Mark all fields as touched to show validation messages
      Object.keys(this.supportFormRef.controls).forEach(key => {
        this.supportFormRef.controls[key].markAsTouched();
      });
    }
  }

  private showLoginRequiredPopup() {
    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(8px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // Create popup
    const popup = document.createElement('div');
    popup.style.cssText = `
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      padding: 2rem;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      max-width: 400px;
      width: 90%;
      text-align: center;
      position: relative;
      animation: fadeInScale 0.3s ease-out forwards;
      color: #1e293b;
    `;

    // Check for dark mode
    if (document.body.classList.contains('dark')) {
      popup.style.background = 'rgba(15, 23, 42, 0.95)';
      popup.style.color = '#f8f9fa';
      popup.style.border = '1px solid rgba(74, 130, 252, 0.3)';
    }

    // Add animation CSS
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInScale {
        from {
          opacity: 0;
          transform: scale(0.9);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
    `;
    document.head.appendChild(style);

    popup.innerHTML = `
      <h3 style="margin: 0 0 1rem 0; color: #3A72EC; font-weight: 700;">Login Required</h3>
      <p style="margin: 0 0 1.5rem 0; color: inherit; line-height: 1.5;">
        You need to log in to submit support requests. Please log in to continue.
      </p>
      <div style="display: flex; gap: 1rem; justify-content: center;">
        <button id="login-btn" style="
          background: linear-gradient(135deg, #3A72EC 0%, #4a82fc 100%);
          color: white;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(58, 114, 236, 0.3);
        ">Login</button>
        <button id="close-btn" style="
          background: rgba(100, 116, 139, 0.1);
          color: #64748b;
          border: 1px solid rgba(100, 116, 139, 0.2);
          padding: 0.75rem 2rem;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        ">Cancel</button>
      </div>
    `;

    backdrop.appendChild(popup);
    document.body.appendChild(backdrop);

    // Add event listeners
    const loginBtn = popup.querySelector('#login-btn') as HTMLElement;
    const closeBtn = popup.querySelector('#close-btn') as HTMLElement;

    loginBtn.addEventListener('click', () => {
      document.body.removeChild(backdrop);
      this.router.navigate(['/auth/signin']);
    });

    closeBtn.addEventListener('click', () => {
      document.body.removeChild(backdrop);
    });

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        document.body.removeChild(backdrop);
      }
    });

    // Cleanup style tag after animation
    setTimeout(() => {
      if (style.parentNode) {
        document.head.removeChild(style);
      }
    }, 500);
  }

  onResetForm() {
    // Reset form data
    this.supportForm = {
      subject: '',
      message: '',
      userEmail: ''
    };
    
    // Reset form validation state
    if (this.supportFormRef) {
      this.supportFormRef.resetForm();
    }
  }
}
