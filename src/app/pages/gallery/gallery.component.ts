import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FooterComponent } from '../../components/shared/footer/footer.component';

export interface GalleryImage {
  id: number;
  src: string;
  alt: string;
  eventName: string;
  eventDescription: string;
  eventDate: string;
  fileName: string;
}

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, RouterModule, FooterComponent],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss']
  // Removed animations completely for instant modal display
})
export class GalleryComponent implements OnInit, OnDestroy {
  
  // Gallery data properties
  allImages: GalleryImage[] = [];
  currentPageImages: GalleryImage[] = [];
  currentPage = 1;
  totalPages = 3;
  imagesPerPage = 17;
  
  // Modal properties
  selectedImage: GalleryImage | null = null;
  showModal = false;
  
  // Loading state
  isLoading = true;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    this.loadImages();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  private loadImages(): void {
    // Get all 51 images using the new PNG naming structure (gallery-image-1.png to gallery-image-51.png)
    const imageFileNames: string[] = [];
    
    // Generate file names for all 51 images with new PNG structure
    for (let i = 1; i <= 51; i++) {
      imageFileNames.push(`gallery-image-${i}.png`);
    }

    // Create GalleryImage objects with proper event structure
    this.allImages = imageFileNames.map((fileName, index) => ({
      id: index + 1,
      src: `assets/images/Image-Gallery/${fileName}`,
      alt: this.generateAltText(fileName),
      eventName: this.generateEventName(index + 1),
      eventDescription: this.generateBeautifulEventDescription(index + 1),
      eventDate: this.generateEventDate(index + 1),
      fileName: fileName
    }));

    // Shuffle the images for random display
    this.shuffleArray(this.allImages);
    
    // Load first page
    this.loadCurrentPage();
    this.isLoading = false;
  }

  private generateAltText(fileName: string): string {
    // Convert filename to readable alt text
    return fileName
      .replace(/\.(jpeg|jpg|png|avif)$/i, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  private generateEventName(imageNumber: number): string {
    // Event names for each image (diversified events)
    const eventNames = [
      "TechFest 2024 - Innovation Summit",
      "Annual Cultural Carnival",
      "CodeStorm Hackathon Championship",
      "Creative Arts Showcase",
      "Literary Festival - Expressions",
      "Photography Exhibition Gala",
      "Music Harmony Festival",
      "Drama Championship Series",
      "Startup Pitch Competition",
      "Academic Excellence Awards",
      "Science Innovation Fair",
      "Digital Marketing Workshop",
      "Leadership Development Conference",
      "Cultural Heritage Celebration",
      "Sports Excellence Championship",
      "Art & Design Exhibition",
      "Entrepreneurship Summit",
      "Technical Symposium 2024",
      "Creative Writing Competition",
      "Innovation Challenge Series",
      "Academic Research Conference",
      "Cultural Unity Festival",
      "Tech Innovation Expo",
      "Literary Arts Competition",
      "Photography Workshop Series",
      "Music & Dance Extravaganza",
      "Drama & Theatre Festival",
      "Student Leadership Summit",
      "Academic Achievement Gala",
      "Creative Expression Workshop",
      "Technology & Future Conference",
      "Cultural Diversity Celebration",
      "Innovation & Design Thinking",
      "Academic Excellence Forum",
      "Arts & Culture Festival",
      "Leadership Excellence Awards",
      "Creative Innovation Summit",
      "Academic Research Symposium",
      "Cultural Arts Appreciation",
      "Technology Innovation Fair",
      "Academic Leadership Conference",
      "Creative Arts Workshop",
      "Innovation Excellence Awards",
      "Cultural Heritage Festival",
      "Academic Innovation Summit",
      "Creative Expression Festival",
      "Technology & Innovation Expo",
      "Academic Excellence Conference",
      "Cultural Arts Celebration",
      "Innovation & Leadership Summit",
      "Academic Achievement Festival"
    ];
    
    return eventNames[imageNumber - 1] || "Campus Cultural Event";
  }

  private generateEventDate(imageNumber: number): string {
    // Generate realistic dates between January 2023 and August 2024
    // Group similar events within 4-5 day ranges
    const eventDates = [
      "March 15-16, 2024",    // TechFest 2024
      "March 22-24, 2024",    // Cultural Carnival
      "April 5-6, 2024",      // CodeStorm Hackathon
      "April 12-14, 2024",    // Creative Arts Showcase
      "May 8-10, 2024",       // Literary Festival
      "May 15-17, 2024",      // Photography Exhibition
      "June 3-5, 2024",       // Music Festival
      "June 10-12, 2024",     // Drama Championship
      "July 8-9, 2024",       // Startup Pitch
      "July 15-16, 2024",     // Academic Awards
      "August 5-7, 2024",     // Science Fair
      "February 12-14, 2024", // Digital Marketing
      "February 20-22, 2024", // Leadership Conference
      "January 15-17, 2024",  // Cultural Heritage
      "January 25-27, 2024",  // Sports Championship
      "March 5-7, 2024",      // Art & Design
      "March 28-30, 2024",    // Entrepreneurship
      "April 18-20, 2024",    // Technical Symposium
      "April 25-27, 2024",    // Creative Writing
      "May 22-24, 2024",      // Innovation Challenge
      "June 18-20, 2024",     // Research Conference
      "June 25-27, 2024",     // Cultural Unity
      "July 22-24, 2024",     // Tech Innovation
      "August 12-14, 2024",   // Literary Arts
      "September 8-10, 2023", // Photography Workshop
      "September 15-17, 2023", // Music & Dance
      "October 5-7, 2023",    // Drama & Theatre
      "October 12-14, 2023",  // Student Leadership
      "November 8-10, 2023",  // Academic Achievement
      "November 15-17, 2023", // Creative Expression
      "December 5-7, 2023",   // Technology & Future
      "December 12-14, 2023", // Cultural Diversity
      "January 8-10, 2024",   // Innovation & Design
      "February 5-7, 2024",   // Academic Excellence
      "February 25-27, 2024", // Arts & Culture
      "March 12-14, 2024",    // Leadership Excellence
      "April 2-4, 2024",      // Creative Innovation
      "April 22-24, 2024",    // Academic Research
      "May 2-4, 2024",        // Cultural Arts
      "May 28-30, 2024",      // Technology Innovation
      "June 5-7, 2024",       // Academic Leadership
      "June 22-24, 2024",     // Creative Arts Workshop
      "July 5-7, 2024",       // Innovation Excellence
      "July 25-27, 2024",     // Cultural Heritage
      "August 8-10, 2024",    // Academic Innovation
      "August 18-20, 2024",   // Creative Expression
      "September 2-4, 2023",  // Technology & Innovation
      "September 22-24, 2023", // Academic Excellence
      "October 18-20, 2023",  // Cultural Arts
      "November 22-24, 2023", // Innovation & Leadership
      "December 18-20, 2023"  // Academic Achievement
    ];
    
    return eventDates[imageNumber - 1] || "March 15-16, 2024";
  }

  private generateBeautifulEventDescription(imageNumber: number): string {
    // Beautiful event-related sentences for each image
    const descriptions = [
      "Where innovation meets creativity in perfect harmony",
      "Capturing moments that define our academic journey",
      "Technology and talent unite in spectacular fashion",
      "Students showcasing their limitless potential",
      "The spirit of learning comes alive in celebration",
      "Excellence achieved through passionate collaboration",
      "Where dreams take flight and visions become reality",
      "Inspiring minds creating tomorrow's innovations",
      "Cultural richness expressed through artistic brilliance",
      "Academic excellence celebrated with joyous pride",
      "Knowledge transforms into extraordinary achievements",
      "Creative minds painting the canvas of success",
      "Where passion meets purpose in perfect synchrony",
      "Innovation blooms in the garden of education",
      "Students writing their legacy with golden memories",
      "Excellence echoed through halls of achievement",
      "Talent flourishing in the spotlight of recognition",
      "Where dedication meets celebration in triumph",
      "Dreams manifesting into remarkable accomplishments",
      "Academic pursuits crowned with festive glory",
      "Creativity unleashed in its most vibrant form",
      "Knowledge celebrated through spectacular displays",
      "Where learning transcends into artistic expression",
      "Students crafting masterpieces of achievement",
      "Excellence illuminated in moments of glory",
      "Innovation and tradition dancing in harmony",
      "Where academic prowess meets cultural celebration",
      "Minds united in the pursuit of excellence",
      "Creativity blossoming in educational paradise",
      "Where knowledge meets artistry in perfect blend",
      "Students scripting stories of inspirational success",
      "Academic milestones celebrated with grand festivities",
      "Where innovation echoes through corridors of learning",
      "Excellence personified in moments of achievement",
      "Creative spirits soaring to unprecedented heights",
      "Knowledge transformed into spectacular celebrations",
      "Where dedication blooms into remarkable success",
      "Students painting their dreams with colors of victory",
      "Academic excellence crowned with cultural magnificence",
      "Where learning becomes a joyous celebration",
      "Innovation and creativity in perfect symphony",
      "Dreams taking shape through educational excellence",
      "Where knowledge meets passion in spectacular fashion",
      "Students creating memories that last a lifetime",
      "Excellence celebrated through artistic brilliance",
      "Where academic pursuits meet festive grandeur",
      "Innovation flourishing in the realm of education",
      "Students weaving tales of inspirational triumph",
      "Where creativity meets knowledge in perfect harmony",
      "Excellence radiating through halls of achievement",
      "The culmination of dreams in spectacular celebration"
    ];
    
    // Return description based on image number (1-indexed)
    return descriptions[imageNumber - 1] || "A moment of academic and cultural excellence";
  }

  private shuffleArray(array: any[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  private loadCurrentPage(): void {
    const startIndex = (this.currentPage - 1) * this.imagesPerPage;
    const endIndex = startIndex + this.imagesPerPage;
    this.currentPageImages = this.allImages.slice(startIndex, endIndex);
  }

  // Pagination methods - Completely rewritten for reliability
  goToPage(page: number): void {
    // Simple validation and immediate page switch
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      console.log(`Switching from page ${this.currentPage} to page ${page}`);
      
      // Immediate page change without any animation state blocking
      this.currentPage = page;
      this.loadCurrentPage();
      
      console.log(`Successfully switched to page ${this.currentPage}`);
      console.log(`Loaded ${this.currentPageImages.length} images for page ${page}`);
    }
  }

  // Modal methods - Rewritten for instant display
  openImageModal(image: GalleryImage): void {
    console.log('Opening modal for image:', image.fileName);
    
    // Immediate state changes
    this.selectedImage = image;
    this.showModal = true;
    
    if (isPlatformBrowser(this.platformId)) {
      // Immediate DOM changes
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '15px'; // Prevent layout shift
      
      console.log('Modal opened successfully');
    }
  }

  closeImageModal(): void {
    console.log('Closing modal');
    
    // Immediate state changes
    this.showModal = false;
    this.selectedImage = null;
    
    if (isPlatformBrowser(this.platformId)) {
      // Restore body scroll
      document.body.style.overflow = 'auto';
      document.body.style.paddingRight = '0';
      
      console.log('Modal closed successfully');
    }
  }

  // Utility methods
  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  trackByImageId(index: number, image: GalleryImage): number {
    return image.id;
  }

  scrollToGallery(): void {
    if (isPlatformBrowser(this.platformId)) {
      const galleryElement = document.getElementById('gallery-grid');
      if (galleryElement) {
        // Enhanced smooth scrolling with offset for better positioning
        const elementPosition = galleryElement.offsetTop;
        const offsetPosition = elementPosition - 80; // Account for navbar height
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
  }
}