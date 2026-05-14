// Configuration
const COURSES_DATA_URL = "https://raw.githubusercontent.com/awesome-cam/uvic-cal/main/courses.json";

// State Management
let courseData = [];

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  setupTabNavigation();
  setupSearchListener();
  loadCourseData();
});

// ============================================
// DATA LOADING
// ============================================

async function loadCourseData() {
  try {
    const response = await fetch(COURSES_DATA_URL);
    if (!response.ok) throw new Error("Failed to load course data");
    const data = await response.json();
    courseData = data.courses || [];
    console.log("Course data loaded:", courseData);
  } catch (error) {
    console.error("Error loading course data:", error);
    showError("Failed to load course database. Please refresh the page.");
  }
}

// ============================================
// TAB NAVIGATION
// ============================================

function setupTabNavigation() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  
  tabButtons.forEach(button => {
    button.addEventListener("click", () => {
      const tabName = button.getAttribute("data-tab");
      showTab(tabName);
    });
  });
}

function showTab(tabName) {
  // Hide all tabs
  document.querySelectorAll(".tab-content").forEach(tab => {
    tab.classList.remove("active");
  });

  // Remove active state from all buttons
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.remove("active");
  });

  // Show selected tab
  document.getElementById(tabName).classList.add("active");

  // Highlight selected button
  document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================

function setupSearchListener() {
  const input = document.getElementById("courseInput");
  
  // Search on Enter key
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      searchCourse();
    }
  });
}

function searchCourse() {
  const input = document.getElementById("courseInput").value.trim();
  
  // Validate input
  if (!input) {
    showError("Please enter a course code");
    return;
  }

  const courseCode = input.replace(/\s+/g, "").toUpperCase();
  
  // Show loading state
  showLoading(true);
  clearError();
  clearResults();

  try {
    // Search in local course data
    const matches = findCourses(courseCode);
    
    if (!matches || matches.length === 0) {
      showError(`No courses found for: ${courseCode}. Please check the code and try again.`);
    } else {
      displayResults(courseCode, matches);
    }
  } catch (error) {
    console.error("Error searching courses:", error);
    showError(`Error searching for course: ${courseCode}`);
  } finally {
    showLoading(false);
  }
}

function findCourses(courseCode) {
  // Parse course code (e.g., "BIOL186" -> subject="BIOL", number="186")
  const match = courseCode.match(/^([A-Z]+)(\d+)?$/);
  if (!match) return [];

  const subject = match[1];
  const number = match[2] || "";

  // Search in course data
  return courseData.filter(course => {
    const fullCode = course.subject + course.number;
    if (number) {
      return fullCode === courseCode;
    } else {
      return course.subject === subject;
    }
  });
}

// ============================================
// DISPLAY RESULTS
// ============================================

function displayResults(courseCode, courses) {
  const resultsContainer = document.getElementById("results");
  
  let html = "";
  
  courses.forEach(course => {
    course.sections.forEach(section => {
      html += createCourseCard(course, section);
    });
  });

  resultsContainer.innerHTML = html;
}

function createCourseCard(course, section) {
  const days = Array.isArray(section.days) 
    ? section.days.join(", ") 
    : section.days;
  
  const time = `${section.start_time} - ${section.end_time}`;
  
  const courseCode = `${course.subject}${course.number}`;
  
  return `
    <div class="course-card">
      <div class="course-header">
        <span class="course-code">${courseCode}</span>
        <div>
          <span class="course-section">${section.section}</span>
          <span class="course-type" style="margin-left: 0.5rem; padding: 0.25rem 0.5rem; background: #e0e7ff; border-radius: 4px; font-size: 0.85rem;">${section.type}</span>
        </div>
      </div>
      
      <div class="course-title" style="font-size: 0.95rem; color: #666; margin: 0.5rem 0;">${course.title}</div>
      
      <div class="course-term">${course.term_name}</div>
      
      <div class="course-details">
        <div class="detail">
          <span class="detail-label">📅 Days</span>
          <span class="detail-value">${days}</span>
        </div>
        
        <div class="detail">
          <span class="detail-label">⏰ Time</span>
          <span class="detail-value">${time}</span>
        </div>
        
        <div class="detail">
          <span class="detail-label">📍 Location</span>
          <span class="detail-value">${section.location}</span>
        </div>
        
        <div class="detail">
          <span class="detail-label">🎓 Delivery</span>
          <span class="detail-value">${section.delivery}</span>
        </div>
        
        <div class="detail">
          <span class="detail-label">💺 Seats</span>
          <span class="detail-value">${section.seats_available}</span>
        </div>
        
        <div class="detail">
          <span class="detail-label">📋 CRN</span>
          <span class="detail-value">${section.crn}</span>
        </div>
      </div>
    </div>
  `;
}

// ============================================
// UI STATE MANAGEMENT
// ============================================

function showLoading(isLoading) {
  const loadingEl = document.getElementById("loading");
  if (isLoading) {
    loadingEl.classList.remove("hidden");
  } else {
    loadingEl.classList.add("hidden");
  }
}

function showError(message) {
  const errorEl = document.getElementById("error");
  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
}

function clearError() {
  const errorEl = document.getElementById("error");
  errorEl.classList.add("hidden");
  errorEl.textContent = "";
}

function clearResults() {
  document.getElementById("results").innerHTML = "";
}
