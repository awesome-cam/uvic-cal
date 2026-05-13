// Configuration
const API_BASE_URL = "https://api.example.com"; // Update with actual backend URL

// State Management
let courseData = {};

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  setupTabNavigation();
  setupSearchListener();
});

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

async function searchCourse() {
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
    // Fetch from backend API
    const response = await fetch(`${API_BASE_URL}/api/course/${courseCode}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Handle successful response
    displayResults(courseCode, data);
  } catch (error) {
    console.error("Error fetching course:", error);
    showError(`Could not find course: ${courseCode}. Please check the code and try again.`);
  } finally {
    showLoading(false);
  }
}

// ============================================
// DISPLAY RESULTS
// ============================================

function displayResults(courseCode, data) {
  const resultsContainer = document.getElementById("results");
  
  // Check if offerings exist
  if (!data.offerings || data.offerings.length === 0) {
    resultsContainer.innerHTML = `
      <div class="no-results">
        <p>No offerings found for:</p>
        <p class="no-results-code">${courseCode}</p>
      </div>
    `;
    return;
  }

  // Group offerings by term for better organization
  const offeringsByTerm = groupOfferingsByTerm(data.offerings);
  
  let html = "";
  
  Object.entries(offeringsByTerm).forEach(([termName, offerings]) => {
    offerings.forEach(section => {
      html += createCourseCard(courseCode, termName, section);
    });
  });

  resultsContainer.innerHTML = html;
}

function groupOfferingsByTerm(offerings) {
  const grouped = {};
  
  offerings.forEach(offering => {
    const term = offering.term_name || offering.term;
    if (!grouped[term]) {
      grouped[term] = [];
    }
    grouped[term].push(offering);
  });
  
  return grouped;
}

function createCourseCard(courseCode, termName, section) {
  const days = Array.isArray(section.days) 
    ? section.days.join(", ") 
    : section.days;
  
  const time = `${section.start_time} - ${section.end_time}`;
  
  const delivery = section.delivery || "Not specified";
  
  return `
    <div class="course-card">
      <div class="course-header">
        <span class="course-code">${courseCode}</span>
        <div>
          <span class="course-section">${section.section || "N/A"}</span>
        </div>
      </div>
      
      <div class="course-term">${termName}</div>
      
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
          <span class="detail-value">${section.location || "TBD"}</span>
        </div>
        
        <div class="detail">
          <span class="detail-label">👨‍🏫 Instructor</span>
          <span class="detail-value">${section.instructor || "TBD"}</span>
        </div>
        
        <div class="detail">
          <span class="detail-label">🎓 Delivery</span>
          <span class="detail-value">${delivery}</span>
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
