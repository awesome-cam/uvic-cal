let courseData = {};

async function loadCourses() {
  const response = await fetch("data/courses.json");
  courseData = await response.json();
}

function showTab(tabName) {
  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.add("hidden");
  });

  document.getElementById(tabName).classList.remove("hidden");
}

function searchCourse() {
  const input = document.getElementById("courseInput").value;
  const courseCode = input.replace(/\s+/g, "").toUpperCase();
  const results = document.getElementById("results");

  results.innerHTML = "";

  if (!courseData[courseCode]) {
    results.innerHTML = `<p>No results found for ${courseCode}.</p>`;
    return;
  }

  courseData[courseCode].forEach(section => {
    const card = document.createElement("div");
    card.className = "course-card";

    card.innerHTML = `
      <strong>${courseCode} - ${section.section}</strong><br>
      Term: ${section.term}<br>
      Days: ${section.days}<br>
      Time: ${section.time}<br>
      Location: ${section.location}
    `;

    results.appendChild(card);
  });
}

loadCourses();
