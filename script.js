// GitHub API Configuration
const GITHUB_USERNAME = '1NF1N172';
// Using public API (no authentication needed for public repos)
// Note: Rate limit is 60 requests/hour for unauthenticated requests

// State
let allProjects = [];
let filteredProjects = [];
let currentFilter = 'all';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    setupFilters();
});

// Smooth scroll to projects section
function scrollToProjects() {
    const projectsSection = document.getElementById('projects-section');
    if (projectsSection) {
        projectsSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Load projects from GitHub API
async function loadProjects() {
    const loading = document.getElementById('loading');
    const projectsGrid = document.getElementById('projects-grid');
    
    loading.classList.add('show');
    projectsGrid.innerHTML = '';

    try {
        const response = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100&type=all`, {
            headers: {
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const repos = await response.json();
        allProjects = repos.map(repo => ({
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description || 'No description available',
            url: repo.html_url,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            language: repo.language || 'Other',
            updated: new Date(repo.updated_at),
            topics: repo.topics || [],
            isPrivate: repo.private
        }));

        // Filter out private repos if needed
        allProjects = allProjects.filter(p => !p.isPrivate);

        updateStats();
        applyFilter();
        loading.classList.remove('show');

    } catch (error) {
        console.error('Error loading projects:', error);
        loading.classList.remove('show');
        projectsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Projects</h3>
                <p>${error.message}</p>
                <p style="margin-top: 1rem;">Please check your internet connection and try again.</p>
            </div>
        `;
    }
}

// Update statistics
function updateStats() {
    const repoCount = document.getElementById('repo-count');
    const starCount = document.getElementById('star-count');
    const languageCount = document.getElementById('language-count');

    const totalStars = allProjects.reduce((sum, p) => sum + p.stars, 0);
    const languages = new Set(allProjects.map(p => p.language).filter(l => l));

    repoCount.textContent = allProjects.length;
    starCount.textContent = totalStars;
    languageCount.textContent = languages.size;
}

// Setup filter buttons
function setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            // Update current filter
            currentFilter = btn.dataset.filter;
            // Apply filter
            applyFilter();
        });
    });
}

// Apply filter
function applyFilter() {
    if (currentFilter === 'all') {
        filteredProjects = allProjects;
    } else {
        filteredProjects = allProjects.filter(p => p.language === currentFilter);
    }

    renderProjects();
}

// Render projects
function renderProjects() {
    const projectsGrid = document.getElementById('projects-grid');

    if (filteredProjects.length === 0) {
        projectsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <h3>No Projects Found</h3>
                <p>No projects match the selected filter.</p>
            </div>
        `;
        return;
    }

    projectsGrid.innerHTML = filteredProjects.map(project => `
        <div class="project-card" onclick="window.open('${project.url}', '_blank')">
            <div class="project-header">
                <div>
                    <h3 class="project-name">
                        <a href="${project.url}" target="_blank" onclick="event.stopPropagation()">
                            ${escapeHtml(project.name)}
                        </a>
                    </h3>
                    <div class="project-stats">
                        <span><i class="fas fa-star"></i> ${project.stars}</span>
                        <span><i class="fas fa-code-branch"></i> ${project.forks}</span>
                    </div>
                </div>
            </div>
            <p class="project-description">${escapeHtml(project.description)}</p>
            <div class="project-footer">
                <div class="project-language">
                    <span class="language-dot" style="background-color: ${getLanguageColor(project.language)}"></span>
                    <span>${project.language}</span>
                </div>
                <div class="project-date">
                    Updated ${formatDate(project.updated)}
                </div>
            </div>
        </div>
    `).join('');
}

// Get language color
function getLanguageColor(language) {
    const colors = {
        'Python': '#3572A5',
        'JavaScript': '#F7DF1E',
        'TypeScript': '#3178C6',
        'HTML': '#E34C26',
        'CSS': '#1572B6',
        'Java': '#ED8B00',
        'C++': '#00599C',
        'C': '#A8B9CC',
        'C#': '#239120',
        'PHP': '#777BB4',
        'Ruby': '#CC342D',
        'Go': '#00ADD8',
        'Rust': '#000000',
        'Swift': '#FA7343',
        'Kotlin': '#7F52FF',
        'Other': '#00d4ff'
    };
    return colors[language] || colors['Other'];
}

// Format date
function formatDate(date) {
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

