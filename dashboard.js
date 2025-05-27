const API_BASE_URL = 'http://localhost:5001/api'; // Adjust if your backend port is different

document.addEventListener('DOMContentLoaded', async function() {
    // --- Initial Authentication Check ---
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        window.location.href = 'index.html'; // Redirect if no token
        return; // Stop further execution of dashboard.js
    }

    // --- Global Variables & Element References (from your original code, adjusted) ---
    const welcomeUserEl = document.getElementById('welcomeUser');
    const mainViewHeadingEl = document.getElementById('mainViewHeading');

    const dashboardNav = document.getElementById('dashboardNav');
    const newContentBtnNav = document.getElementById('newContentBtnNav');
    const calendarNav = document.getElementById('calendarNav');
    const analyticsNav = document.getElementById('analyticsNav');
    const settingsNav = document.getElementById('settingsNav');
    const logoutBtn = document.getElementById('logoutBtn');

    // Section Elements
    const ALL_SECTIONS_DOM = {
        dashboard: document.getElementById('contentCardsSection'), // Main content cards view
        newContent: document.getElementById('newContentSection'),
        calendar: document.getElementById('calendarSection'),
        analytics: document.getElementById('analyticsSection'),
        settings: document.getElementById('settingsSection')
    };
    let activeSectionElement = ALL_SECTIONS_DOM.dashboard; // Default

    // Dashboard Stats & Filters (to show/hide them)
    const dashboardStatsRowEl = document.getElementById('dashboardStatsRow');
    const dashboardFiltersRowEl = document.getElementById('dashboardFiltersRow');

    // Content Form Elements
    const contentForm = document.getElementById('contentForm');
    const contentIdInput = document.getElementById('contentId');
    const contentTitleInput = document.getElementById('contentTitle');
    const contentTypeSelect = document.getElementById('contentType');
    const contentPlatformSelect = document.getElementById('contentPlatform');
    const publishDateInput = document.getElementById('publishDate');
    const contentStatusSelect = document.getElementById('contentStatus');
    const contentTagsInput = document.getElementById('contentTags');
    const contentNotesInput = document.getElementById('contentNotes');
    const saveContentBtn = document.getElementById('saveContentBtn');
    const cancelContentBtn = document.getElementById('cancelContentBtn');

    // Filter Elements
    const platformFilterEl = document.getElementById('platformFilter');
    const statusFilterEl = document.getElementById('statusFilter');
    const tagFilterInputEl = document.getElementById('tagFilter');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');

    // Stat Card Elements
    const statTotalPostsEl = document.getElementById('statTotalPosts');
    const statTotalBlogsEl = document.getElementById('statTotalBlogs');
    const statTotalVideosEl = document.getElementById('statTotalVideos');
    const statTotalStoriesEl = document.getElementById('statTotalStories');

    // Settings Form Elements
    const profileNameInput = document.getElementById('profileName');
    const profileEmailInput = document.getElementById('profileEmail');
    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmNewPasswordInput = document.getElementById('confirmNewPassword');
    const saveProfileSettingsBtn = document.getElementById('saveProfileSettingsBtn');

    const platformPreferencesForm = document.getElementById('platformPreferencesForm');
    const defaultPlatformSelect = document.getElementById('defaultPlatform');
    const savePlatformPreferencesBtn = document.getElementById('savePlatformPreferencesBtn');

    const emailNotificationsToggle = document.getElementById('emailNotifications');
    const inAppNotificationsToggle = document.getElementById('inAppNotifications');
    const postReminderSelect = document.getElementById('postReminder');
    const saveNotificationSettingsBtn = document.getElementById('saveNotificationSettingsBtn');

    const themeToggle = document.getElementById('themeToggle');
    const fontSizePreferenceSelect = document.getElementById('fontSizePreference');
    const saveThemeAppearanceBtn = document.getElementById('saveThemeAppearanceBtn');

    let calendarInstance = null;
    let currentEditingOrigin = 'dashboard'; // 'dashboard', 'calendar', 'new_content_source'

    const ANIMATION_OUT_DURATION = 300; // From your original CSS
    const ANIMATION_IN_DURATION = 400;  // From your original CSS

    // Chart instances (to destroy them before re-initializing)
    window.platformChartInstance = null;
    window.statusChartInstance = null;
    window.timelineChartInstance = null;

    // --- Alert Function (from your original provided code, ensure it works) ---
    function showAlert(message, type = 'info') {
        const alertContainer = document.querySelector('.alert-container');
        if (!alertContainer) {
            console.warn('Alert container not found. Message:', message);
            alert(`${type.toUpperCase()}: ${message}`); // Fallback
            return;
        }
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} show`; // Bootstrap classes for showing
        alertDiv.setAttribute('role', 'alert');

        // Simple icon mapping (can be extended with BoxIcons if you prefer)
        let iconHtml = '';
        if (type === 'success') iconHtml = "<i class='bx bx-check-circle me-2'></i>";
        if (type === 'error') iconHtml = "<i class='bx bx-error-circle me-2'></i>";
        if (type === 'warning') iconHtml = "<i class='bx bx-error me-2'></i>"; // Or bx-alarm-exclamation
        if (type === 'info') iconHtml = "<i class='bx bx-info-circle me-2'></i>";


        alertDiv.innerHTML = `
            ${iconHtml}
            <span>${message}</span>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `; // Using Bootstrap alert structure
        alertContainer.appendChild(alertDiv);

        // Auto-remove alert after 5 seconds using Bootstrap's dismiss logic (or fallback)
        setTimeout(() => {
            const bsAlert = bootstrap.Alert.getInstance(alertDiv);
            if (bsAlert) {
                bsAlert.close();
            } else if (alertDiv) {
                alertDiv.remove();
            }
        }, 5000);
    }
    // --- End Alert Function ---

    // --- API Helper Functions ---
    function getAuthHeaders() {
        const token = localStorage.getItem('authToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    async function handleApiResponse(response, expectNoContent = false) {
        if (expectNoContent && response.ok && response.status === 204) { // 204 No Content
            return null;
        }
        const responseData = await response.json().catch(() => ({ // Try to parse JSON, fallback if error or no body
            message: response.statusText || "An unknown error occurred",
            status: response.status
        }));

        if (!response.ok) {
            console.error('API Error Full Response:', response);
            console.error('API Error Data:', responseData);
            if (response.status === 401) { // Unauthorized
                showAlert('Session expired or invalid. Please login again.', 'error');
                logout(); // Call logout to clear storage and redirect
            }
            // Try to get a more specific message from backend
            let errorMessage = "An error occurred.";
            if (responseData && responseData.message) {
                errorMessage = responseData.message;
                if (responseData.errors && Array.isArray(responseData.errors)) { // For validation errors
                    errorMessage += ": " + responseData.errors.join(", ");
                }
            } else if (response.statusText) {
                errorMessage = response.statusText;
            }
            throw new Error(errorMessage);
        }
        return responseData;
    }
    // --- End API Helper Functions ---

    // --- Initial Setup ---
    function initializeDashboard() {
        const storedProfileName = localStorage.getItem('profileName') || localStorage.getItem('username') || 'User';
        if (welcomeUserEl) welcomeUserEl.textContent = `Welcome, ${storedProfileName}`;

        // Set initial theme and font size from localStorage or defaults
        const savedTheme = localStorage.getItem('theme') || 'light';
        applyTheme(savedTheme);
        if (themeToggle) themeToggle.checked = savedTheme === 'dark';

        const savedFontSize = localStorage.getItem('fontSize') || 'medium';
        applyFontSize(savedFontSize);
        if (fontSizePreferenceSelect) fontSizePreferenceSelect.value = savedFontSize;

        // Initial data load for the default dashboard view
        renderContentCards();
        updateDashboardStats(); // Fetches from /api/analytics/dashboard-stats
        loadAllSettings(); // Fetches user settings for the settings page

        setupEventListeners();
        initializeFullCalendar();

        // Show default section (dashboard) with animation
        if (activeSectionElement && activeSectionElement.classList.contains('d-none')) {
             activeSectionElement.classList.remove('d-none');
        }
        if (activeSectionElement && !activeSectionElement.classList.contains('section-fade-in-slide-up') && !activeSectionElement.classList.contains('section-fade-out')) {
            void activeSectionElement.offsetWidth; // Trigger reflow
            activeSectionElement.classList.add('section-fade-in-slide-up');
        }
    }
    // --- End Initial Setup ---


    // --- Navigation & Section Visibility ---
    function setActiveNav(link) {
        document.querySelectorAll('#sidebar .nav-link').forEach(nav => nav.classList.remove('active'));
        if (link) link.classList.add('active');
    }

    function showSection(sectionKeyToShow, newHeadingText, activeNavLink) {
        const sectionToShowElement = ALL_SECTIONS_DOM[sectionKeyToShow];
        if (!sectionToShowElement) {
            console.error("Section to show not found:", sectionKeyToShow);
            return;
        }

        if (mainViewHeadingEl) mainViewHeadingEl.textContent = newHeadingText;
        setActiveNav(activeNavLink);

        const _actuallyShowNewSection = () => {
            sectionToShowElement.classList.remove('d-none', 'section-fade-out');
            void sectionToShowElement.offsetWidth; // Trigger reflow for animation
            sectionToShowElement.classList.add('section-fade-in-slide-up');
            activeSectionElement = sectionToShowElement;

            // Show/hide dashboard-specific elements (stats, filters)
            const isDashboardView = sectionKeyToShow === 'dashboard';
            if(dashboardStatsRowEl) dashboardStatsRowEl.style.display = isDashboardView ? '' : 'none';
            if(dashboardFiltersRowEl) dashboardFiltersRowEl.style.display = isDashboardView ? '' : 'none';
        };

        if (activeSectionElement && activeSectionElement !== sectionToShowElement && !activeSectionElement.classList.contains('d-none')) {
            activeSectionElement.classList.remove('section-fade-in-slide-up');
            activeSectionElement.classList.add('section-fade-out');
            setTimeout(() => {
                activeSectionElement.classList.add('d-none');
                activeSectionElement.classList.remove('section-fade-out');
                _actuallyShowNewSection();
            }, ANIMATION_OUT_DURATION);
        } else {
            Object.values(ALL_SECTIONS_DOM).forEach(sec => {
                if (sec !== sectionToShowElement) sec.classList.add('d-none');
            });
            _actuallyShowNewSection();
        }
    }
    // --- End Navigation ---

    // --- Event Listeners Setup ---
    function setupEventListeners() {
        if (dashboardNav) dashboardNav.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('dashboard', "Dashboard", dashboardNav);
            renderContentCards(); // Re-fetch content for dashboard view
            updateDashboardStats();
        });
        if (newContentBtnNav) newContentBtnNav.addEventListener('click', (e) => {
            e.preventDefault();
            currentEditingOrigin = 'new_content_source';
            showSection('newContent', 'Add New Content', newContentBtnNav);
            if (contentForm) contentForm.reset();
            if (contentIdInput) contentIdInput.value = ''; // Clear ID for new content
            // Set default platform if configured
            const defaultPlatform = localStorage.getItem('defaultPlatformSetting'); // Assuming you save it like this
            if (defaultPlatform && contentPlatformSelect) contentPlatformSelect.value = defaultPlatform;
        });
        if (calendarNav) calendarNav.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('calendar', "Calendar", calendarNav);
            if (calendarInstance) {
                calendarInstance.render(); // Re-render calendar
                fetchAndPopulateCalendar(); // Fetch fresh data for calendar
            }
        });
        if (analyticsNav) analyticsNav.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('analytics', "Analytics", analyticsNav);
            initializeCharts(); // Fetch data and create/update charts
        });
        if (settingsNav) settingsNav.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('settings', "Settings", settingsNav);
            loadAllSettings(); // Re-load settings from API into the form
        });

        if (logoutBtn) logoutBtn.addEventListener('click', logout);
        if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', renderContentCards);
        if (saveContentBtn) saveContentBtn.addEventListener('click', handleSaveContent);
        if (cancelContentBtn) cancelContentBtn.addEventListener('click', handleCancelContent);

        // Settings Save Buttons
        if(saveProfileSettingsBtn) saveProfileSettingsBtn.addEventListener('click', handleSaveProfileSettings);
        if(savePlatformPreferencesBtn) savePlatformPreferencesBtn.addEventListener('click', handleSavePlatformPreferences);
        if(saveNotificationSettingsBtn) saveNotificationSettingsBtn.addEventListener('click', handleSaveNotificationSettings);
        if(saveThemeAppearanceBtn) saveThemeAppearanceBtn.addEventListener('click', handleSaveThemeAppearance);
    }
    // --- End Event Listeners Setup ---


    // --- Content Management Functions ---
    async function renderContentCards() {
        const platformFilter = platformFilterEl ? platformFilterEl.value : '';
        const statusFilter = statusFilterEl ? statusFilterEl.value : '';
        const tagFilter = tagFilterInputEl ? tagFilterInputEl.value.trim() : '';

        let queryParams = new URLSearchParams();
        if (platformFilter) queryParams.append('platformFilter', platformFilter);
        if (statusFilter) queryParams.append('statusFilter', statusFilter);
        if (tagFilter) queryParams.append('tagFilter', tagFilter);

        const contentCardsContainer = ALL_SECTIONS_DOM.dashboard;
        if (contentCardsContainer) contentCardsContainer.innerHTML = '<div class="col-12 text-center p-5"><i class="bx bx-loader-alt bx-spin bx-lg"></i> Loading content...</div>';


        try {
            const response = await fetch(`${API_BASE_URL}/content?${queryParams.toString()}`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });
            const fetchedContentItems = await handleApiResponse(response);

            if (contentCardsContainer) contentCardsContainer.innerHTML = ''; // Clear loading/previous

            if (fetchedContentItems.length === 0) {
                if (contentCardsContainer) contentCardsContainer.innerHTML = '<div class="col-12"><div class="alert alert-info text-center">No content items found. Try adjusting filters or creating new content.</div></div>';
            } else {
                fetchedContentItems.forEach(item => {
                    const card = createContentCard(item); // createContentCard expects item._id as item.id
                    if (contentCardsContainer) contentCardsContainer.appendChild(card);
                });
            }
            // If calendar is visible or just to keep it updated in background (optional)
            // fetchAndPopulateCalendar();
        } catch (error) {
            showAlert(`Error fetching content: ${error.message}`, 'error');
            if (contentCardsContainer) contentCardsContainer.innerHTML = '<div class="col-12"><div class="alert alert-danger">Could not load content. Please try again later.</div></div>';
        }
    }

    function createContentCard(item) { // item now has item._id from backend
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4 mb-4'; // Added mb-4 for spacing
        const card = document.createElement('div');
        card.className = 'card content-card h-100'; // Added h-100 for consistent card height
        const statusClass = `badge-${item.status ? item.status.toLowerCase() : 'unknown'}`;
        const platformCleaned = item.platform ? item.platform.toLowerCase().replace(/\s+/g, '-') : 'unknown';
        const platformClass = `badge badge-${platformCleaned}`;

        card.innerHTML = `
            <div class="card-header d-flex justify-content-between align-items-center">
                <span class="fw-bold">${item.title || 'Untitled'}</span>
                <span class="badge ${statusClass}">${item.status || 'N/A'}</span>
            </div>
            <div class="card-body">
                <p class="mb-1"><strong>Platform:</strong> <span class="${platformClass}">${item.platform || 'N/A'}</span></p>
                <p class="mb-1"><strong>Type:</strong> ${item.contentType || 'N/A'}</p>
                <p class="mb-1"><strong>Publish:</strong> ${formatDateTime(item.publishDate)}</p>
                <p class="mb-1"><strong>Tags:</strong> ${item.tags && item.tags.length > 0 ? item.tags.join(', ') : 'None'}</p>
                ${item.notes ? `<p class="mb-1"><strong>Notes:</strong> <small>${item.notes.substring(0,100)}${item.notes.length > 100 ? '...' : ''}</small></p>` : ''}
            </div>
            <div class="card-footer d-flex justify-content-end">
                <button class="btn btn-sm btn-outline-primary me-2 edit-btn" data-id="${item._id}">Edit</button>
                <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${item._id}">Delete</button>
            </div>`;
        col.appendChild(card);

        const editBtn = col.querySelector('.edit-btn');
        if (editBtn) editBtn.addEventListener('click', () => {
            currentEditingOrigin = 'dashboard';
            handleEditContent(item._id); // Use item._id
        });
        const deleteBtn = col.querySelector('.delete-btn');
        if (deleteBtn) deleteBtn.addEventListener('click', () => handleDeleteContent(item._id)); // Use item._id
        return col;
    }

    async function handleEditContent(itemId) { // itemId is _id from MongoDB
        showSection('newContent', 'Edit Content', newContentBtnNav); // Switch to form
        contentForm.reset(); // Clear form first
        contentIdInput.value = itemId; // Set the ID for update operation

        try {
            const response = await fetch(`${API_BASE_URL}/content/${itemId}`, { headers: getAuthHeaders() });
            const item = await handleApiResponse(response);

            contentTitleInput.value = item.title;
            contentTypeSelect.value = item.contentType;
            contentPlatformSelect.value = item.platform;
            publishDateInput.value = formatDateTimeForInput(item.publishDate);
            contentStatusSelect.value = item.status;
            contentTagsInput.value = item.tags ? item.tags.join(', ') : '';
            contentNotesInput.value = item.notes;
        } catch (error) {
            showAlert(`Error fetching content for editing: ${error.message}`, 'error');
            returnToOriginView(); // Go back if error
        }
    }

    async function handleSaveContent() {
        const contentId = contentIdInput.value;
        const isNew = !contentId;

        const tagsArray = contentTagsInput.value.split(',')
            .map(tag => tag.trim())
            .filter(tag => tag !== ''); // Ensure non-empty tags

        const itemData = {
            title: contentTitleInput.value.trim(),
            contentType: contentTypeSelect.value,
            platform: contentPlatformSelect.value,
            publishDate: publishDateInput.value,
            status: contentStatusSelect.value,
            tags: tagsArray,
            notes: contentNotesInput.value.trim()
        };

        // Basic frontend validation
        if (!itemData.title || !itemData.contentType || !itemData.platform || !itemData.publishDate) {
            showAlert('Please fill in all required fields: Title, Content Type, Platform, and Publish Date.', 'warning');
            return;
        }
        if (new Date(itemData.publishDate) < new Date() && itemData.status === 'Scheduled') {
            if (!confirm("The scheduled date is in the past. Do you want to save it as 'Draft' instead?")) {
                 showAlert("Save cancelled. Please choose a future date for 'Scheduled' status or change status to 'Draft'.", "info");
                 return;
            }
            itemData.status = 'Draft';
            contentStatusSelect.value = 'Draft'; // Update UI
        }


        const originalButtonText = saveContentBtn.textContent;
        saveContentBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Saving...';
        saveContentBtn.disabled = true;
        cancelContentBtn.disabled = true;

        try {
            const url = isNew ? `${API_BASE_URL}/content` : `${API_BASE_URL}/content/${contentId}`;
            const method = isNew ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method: method,
                headers: getAuthHeaders(),
                body: JSON.stringify(itemData),
            });
            await handleApiResponse(response); // We don't strictly need the returned item here for just a success message

            showAlert(isNew ? 'New content added successfully!' : 'Content updated successfully!', 'success');
            returnToOriginView();
            renderContentCards();
            updateDashboardStats();
            fetchAndPopulateCalendar(); // Update calendar
        } catch (error) {
            showAlert(`Error saving content: ${error.message}`, 'error');
        } finally {
            saveContentBtn.innerHTML = originalButtonText;
            saveContentBtn.disabled = false;
            cancelContentBtn.disabled = false;
        }
    }

    function handleCancelContent() {
        contentForm.reset();
        contentIdInput.value = '';
        returnToOriginView();
    }

    function returnToOriginView() {
        if (currentEditingOrigin === 'calendar') {
            showSection('calendar', 'Calendar', calendarNav);
        } else { // 'dashboard' or 'new_content_source'
            showSection('dashboard', 'Dashboard', dashboardNav);
        }
        currentEditingOrigin = 'dashboard'; // Reset origin
    }

    async function handleDeleteContent(itemId) { // itemId is _id
        if (confirm('Are you sure you want to delete this content item? This action cannot be undone.')) {
            try {
                const response = await fetch(`${API_BASE_URL}/content/${itemId}`, {
                    method: 'DELETE',
                    headers: getAuthHeaders(),
                });
                const data = await handleApiResponse(response); // Backend sends a message

                showAlert(data.message || 'Content item deleted.', 'success');
                renderContentCards(); // Refresh list
                updateDashboardStats();
                fetchAndPopulateCalendar(); // Update calendar
            } catch (error) {
                showAlert(`Error deleting content: ${error.message}`, 'error');
            }
        }
    }
    // --- End Content Management ---

    // --- Calendar Functions ---
    function initializeFullCalendar() {
        const calendarEl = document.getElementById('calendar');
        if (calendarEl && !calendarInstance) { // Initialize only once
             calendarInstance = new FullCalendar.Calendar(calendarEl, {
                initialView: localStorage.getItem('calendarPreferredView') || 'dayGridMonth',
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek,listYear' // listYear is available
                },
                events: [], // Will be populated by fetchAndPopulateCalendar
                eventClick: function(info) {
                    currentEditingOrigin = 'calendar';
                    handleEditContent(info.event.extendedProps.contentId); // contentId is _id
                },
                datesSet: function(dateInfo) {
                    if (dateInfo.view && dateInfo.view.type) {
                        localStorage.setItem('calendarPreferredView', dateInfo.view.type);
                    }
                },
                editable: false, // For simplicity, disable drag-and-drop editing for now
                height: 'auto', // Adjust as needed
            });
            calendarInstance.render();
            fetchAndPopulateCalendar(); // Initial data load
        }
    }

    async function fetchAndPopulateCalendar() {
        if (!calendarInstance) return;
        try {
            // Fetch Scheduled, Published, and Draft items for the calendar
            const response = await fetch(`${API_BASE_URL}/content?statusFilter=Scheduled,Published,Draft`, { 
                headers: getAuthHeaders()
            });
            const items = await handleApiResponse(response);
            const events = items.map(item => {
                // Only add items with a valid publishDate to the calendar
                if (!item.publishDate) return null; 
                
                return {
                    title: item.title, // This is the content title
                    start: item.publishDate, // FullCalendar handles ISO strings
                    extendedProps: { contentId: item._id }, // Store MongoDB _id
                    // Add a class based on status for styling
                    className: `fc-event-${item.status ? item.status.toLowerCase() : 'unknown'} platform-${item.platform ? item.platform.toLowerCase() : 'unknown'}`
                };
            }).filter(event => event !== null); // Remove null entries (items without publishDate)

            calendarInstance.removeAllEvents();
            calendarInstance.addEventSource(events);
        } catch (error) {
            console.error("Error fetching calendar events:", error);
            showAlert("Could not load calendar events.", "error");
        }
    }
    // --- End Calendar Functions ---

    // --- Analytics Functions ---
    async function updateDashboardStats() {
        try {
            const response = await fetch(`${API_BASE_URL}/analytics/dashboard-stats`, { headers: getAuthHeaders() });
            const stats = await handleApiResponse(response);
            if (statTotalPostsEl) statTotalPostsEl.textContent = stats.Post || 0;
            if (statTotalBlogsEl) statTotalBlogsEl.textContent = stats.Blog || 0;
            if (statTotalVideosEl) statTotalVideosEl.textContent = stats.Video || 0;
            if (statTotalStoriesEl) statTotalStoriesEl.textContent = stats.Story || 0;
        } catch (error) {
            showAlert(`Error updating dashboard stats: ${error.message}`, 'error');
             // Set to 'N/A' on error
            if (statTotalPostsEl) statTotalPostsEl.textContent = 'N/A';
            if (statTotalBlogsEl) statTotalBlogsEl.textContent = 'N/A';
            if (statTotalVideosEl) statTotalVideosEl.textContent = 'N/A';
            if (statTotalStoriesEl) statTotalStoriesEl.textContent = 'N/A';
        }
    }

    async function initializeCharts() {
        const platformCtx = document.getElementById('platformChart')?.getContext('2d');
        const statusCtx = document.getElementById('statusChart')?.getContext('2d');
        const timelineCtx = document.getElementById('timelineChart')?.getContext('2d');

        if (window.platformChartInstance) window.platformChartInstance.destroy();
        if (window.statusChartInstance) window.statusChartInstance.destroy();
        if (window.timelineChartInstance) window.timelineChartInstance.destroy();

        if (!platformCtx || !statusCtx || !timelineCtx) {
            console.warn("One or more chart canvas elements not found. Analytics charts will not be initialized.");
            return;
        }

        const chartTextColor = document.body.classList.contains('dark-mode') ? '#e0e0e0' : '#333';
        const chartBorderColor = document.body.classList.contains('dark-mode') ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
        Chart.defaults.color = chartTextColor; // Set default text color for charts
        Chart.defaults.borderColor = chartBorderColor;


        try {
            // Platform Distribution
            const platformResponse = await fetch(`${API_BASE_URL}/analytics/platform-distribution`, { headers: getAuthHeaders() });
            const platformAPIData = await handleApiResponse(platformResponse); // [{platform: "Instagram", count: 2}, ...]
            const platformLabels = platformAPIData.map(d => d.platform);
            const platformData = platformAPIData.map(d => d.count);
            const platformColors = ['#E1306C', '#1DA1F2', '#4267B2', '#FF0000', '#6f42c1', '#fd7e14', '#20c997']; // Example colors

            window.platformChartInstance = new Chart(platformCtx, {
                type: 'doughnut',
                data: { labels: platformLabels, datasets: [{ data: platformData, backgroundColor: platformColors.slice(0, platformData.length) }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: chartTextColor } } } }
            });

            // Content Status
            const statusResponse = await fetch(`${API_BASE_URL}/analytics/status-counts`, { headers: getAuthHeaders() });
            const statusAPIData = await handleApiResponse(statusResponse); // [{status: "Draft", count: 1}, ...]
            const statusLabels = statusAPIData.map(d => d.status);
            const statusData = statusAPIData.map(d => d.count);
            const statusColors = { 'Draft': '#6c757d', 'Scheduled': '#0d6efd', 'Published': '#198754', 'Unknown': '#cccccc' };

            window.statusChartInstance = new Chart(statusCtx, {
                type: 'pie',
                data: { labels: statusLabels, datasets: [{ data: statusData, backgroundColor: statusLabels.map(l => statusColors[l] || statusColors['Unknown']) }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: chartTextColor } } } }
            });

            // Publishing Timeline (Last 7 days by default from backend)
            const timelineResponse = await fetch(`${API_BASE_URL}/analytics/publishing-timeline`, { headers: getAuthHeaders() });
            const timelineAPIData = await handleApiResponse(timelineResponse); // [{date: "ISO_DATE", published: X, scheduled: Y}, ...]
            const timelineLabels = timelineAPIData.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            const publishedData = timelineAPIData.map(d => d.published);
            const scheduledData = timelineAPIData.map(d => d.scheduled);

            window.timelineChartInstance = new Chart(timelineCtx, {
                type: 'bar',
                data: {
                    labels: timelineLabels,
                    datasets: [
                        { label: 'Published', data: publishedData, backgroundColor: '#198754', borderRadius: 4 },
                        { label: 'Scheduled', data: scheduledData, backgroundColor: '#0d6efd', borderRadius: 4 }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } }, plugins: { legend: { labels: { color: chartTextColor } } } }
            });

        } catch (error) {
            showAlert(`Error initializing charts: ${error.message}`, 'error');
        }
    }
    // --- End Analytics ---

    // --- Settings Functions ---
    async function loadAllSettings() {
        try {
            const [settingsRes, profileRes] = await Promise.all([
                fetch(`${API_BASE_URL}/user/settings`, { headers: getAuthHeaders() }),
                fetch(`${API_BASE_URL}/user/details`, { headers: getAuthHeaders() })
            ]);
            const settingsData = await handleApiResponse(settingsRes);
            const profileData = await handleApiResponse(profileRes);

            // Profile
            if (profileNameInput) profileNameInput.value = profileData.profileName || '';
            if (profileEmailInput) profileEmailInput.value = profileData.email || '';
            // Update welcome message if it changed through settings
            const currentProfileName = localStorage.getItem('profileName');
            if (profileData.profileName && profileData.profileName !== currentProfileName) {
                localStorage.setItem('profileName', profileData.profileName);
                if (welcomeUserEl) welcomeUserEl.textContent = `Welcome, ${profileData.profileName}`;
            }


            // Platform Preferences
            if (platformPreferencesForm && settingsData.platformPreferences) {
                const prefs = settingsData.platformPreferences;
                platformPreferencesForm.querySelectorAll('input[type="checkbox"][data-platform]').forEach(cb => {
                    cb.checked = prefs[cb.dataset.platform] === true; // Explicitly check for true
                });
                if (defaultPlatformSelect) defaultPlatformSelect.value = prefs.defaultPlatform || '';
                 localStorage.setItem('defaultPlatformSetting', prefs.defaultPlatform || ''); // Store for new content form
            }

            // Notification Settings
            if (settingsData.notificationSettings) {
                const notif = settingsData.notificationSettings;
                if (emailNotificationsToggle) emailNotificationsToggle.checked = notif.emailEnabled || false;
                if (inAppNotificationsToggle) inAppNotificationsToggle.checked = notif.inAppEnabled || false;
                if (postReminderSelect) postReminderSelect.value = notif.postReminder || 'none';
            }

            // Theme & Appearance (load from API, but apply from localStorage first for instant effect)
            const apiTheme = settingsData.themeAppearanceSettings?.mode || localStorage.getItem('theme') || 'light';
            const apiFontSize = settingsData.themeAppearanceSettings?.fontSize || localStorage.getItem('fontSize') || 'medium';

            if (themeToggle) themeToggle.checked = apiTheme === 'dark';
            applyTheme(apiTheme);
            localStorage.setItem('theme', apiTheme);

            if (fontSizePreferenceSelect) fontSizePreferenceSelect.value = apiFontSize;
            applyFontSize(apiFontSize);
            localStorage.setItem('fontSize', apiFontSize);

        } catch (error) {
            showAlert(`Error loading settings: ${error.message}`, 'error');
        }
    }

    async function handleSaveProfileSettings() {
        const payload = {
            profileName: profileNameInput.value.trim(),
            email: profileEmailInput.value.trim()
        };
        const currentPass = currentPasswordInput.value;
        const newPass = newPasswordInput.value;
        const confirmPass = confirmNewPasswordInput.value;

        const btn = saveProfileSettingsBtn;
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Saving...';

        try {
            // Update profile name/email
            if (payload.profileName || payload.email) {
                 if (!payload.profileName) delete payload.profileName; // Don't send empty if not changed by user
                 if (!payload.email) delete payload.email; // Don't send empty if not changed by user
                 if (Object.keys(payload).length > 0) { // Only send if there's something to update
                    const profileResponse = await fetch(`${API_BASE_URL}/user/profile/update`, {
                        method: 'PUT',
                        headers: getAuthHeaders(),
                        body: JSON.stringify(payload)
                    });
                    const profileData = await handleApiResponse(profileResponse);
                    showAlert(profileData.message || 'Profile updated!', 'success');
                    // Update local storage and UI for profile name
                    if (profileData.profileName) { // Use returned name if available
                       localStorage.setItem('profileName', profileData.profileName);
                       if (welcomeUserEl) welcomeUserEl.textContent = `Welcome, ${profileData.profileName}`;
                    } else if (payload.profileName) {
                       localStorage.setItem('profileName', payload.profileName);
                       if (welcomeUserEl) welcomeUserEl.textContent = `Welcome, ${payload.profileName}`;
                    }
                 }
            }

            // Update password if fields are filled
            if (newPass) {
                if (!currentPass) {
                    throw new Error('Current password is required to set a new password.');
                }
                if (newPass !== confirmPass) {
                    throw new Error('New passwords do not match.');
                }
                if (newPass.length < 6) {
                    throw new Error('New password must be at least 6 characters long.');
                }
                const passwordResponse = await fetch(`${API_BASE_URL}/user/password/update`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass, confirmNewPassword: confirmPass })
                });
                const passData = await handleApiResponse(passwordResponse);
                showAlert(passData.message || 'Password updated!', 'success');
                currentPasswordInput.value = '';
                newPasswordInput.value = '';
                confirmNewPasswordInput.value = '';
            } else if (currentPass && !newPass) { // User entered current pass but not new one
                 showAlert('Please enter a new password if you wish to change it.', 'info');
            }

            // If only current password was entered and no new password, don't consider it an error for the whole form
            // but no password change will happen. The profile name/email update (if any) would have proceeded.
            if (!newPass && !payload.profileName && !payload.email) {
                 showAlert('No changes to save.', 'info');
            }

            loadAllSettings(); // Refresh all settings from server
        } catch (error) {
            showAlert(`Error saving profile settings: ${error.message}`, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }

    async function handleSavePlatformPreferences() {
        const preferences = { platformPreferences: { defaultPlatform: defaultPlatformSelect.value } };
        platformPreferencesForm.querySelectorAll('input[type="checkbox"][data-platform]').forEach(cb => {
            preferences.platformPreferences[cb.dataset.platform] = cb.checked;
        });
        await updateSettings(preferences, savePlatformPreferencesBtn, "Platform preferences saved!");
    }

    async function handleSaveNotificationSettings() {
        const settings = {
            notificationSettings: {
                emailEnabled: emailNotificationsToggle.checked,
                inAppEnabled: inAppNotificationsToggle.checked,
                postReminder: postReminderSelect.value
            }
        };
        await updateSettings(settings, saveNotificationSettingsBtn, "Notification settings saved!");
    }

    async function handleSaveThemeAppearance() {
        const settings = {
            themeAppearanceSettings: {
                mode: themeToggle.checked ? 'dark' : 'light',
                fontSize: fontSizePreferenceSelect.value
            }
        };
        // Update UI immediately for theme and font, then save
        applyTheme(settings.themeAppearanceSettings.mode);
        applyFontSize(settings.themeAppearanceSettings.fontSize);
        localStorage.setItem('theme', settings.themeAppearanceSettings.mode); // Persist for next load
        localStorage.setItem('fontSize', settings.themeAppearanceSettings.fontSize);

        await updateSettings(settings, saveThemeAppearanceBtn, "Appearance settings applied!");
    }

    async function updateSettings(payload, buttonElement, successMessage) {
        const originalText = buttonElement.textContent;
        buttonElement.disabled = true;
        buttonElement.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Saving...';
        try {
            const response = await fetch(`${API_BASE_URL}/user/settings`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });
            const data = await handleApiResponse(response);
            showAlert(data.message || successMessage, 'success');
            loadAllSettings(); // Re-fetch to confirm and get any server-side defaults/changes
        } catch (error) {
            showAlert(`Error saving settings: ${error.message}`, 'error');
        } finally {
            buttonElement.disabled = false;
            buttonElement.innerHTML = originalText;
        }
    }

    function applyTheme(themeName) {
        document.body.classList.toggle('dark-mode', themeName === 'dark');
        document.documentElement.setAttribute('data-theme', themeName); // For CSS variables
        // If charts are visible, re-initialize to apply new colors
        if (ALL_SECTIONS_DOM.analytics && !ALL_SECTIONS_DOM.analytics.classList.contains('d-none')) {
            initializeCharts();
        }
        // If calendar is visible, re-render (FullCalendar might need specific theme options for dark mode)
        if (calendarInstance && ALL_SECTIONS_DOM.calendar && !ALL_SECTIONS_DOM.calendar.classList.contains('d-none')) {
            // Forcing a re-render and re-fetch of events ensures theme consistency if FullCalendar's internal
            // themeing doesn't pick up all CSS var changes immediately for event colors etc.
            calendarInstance.render(); // This re-renders the structure.
            fetchAndPopulateCalendar(); // Re-fetch events which might have class-based styling.
        }
    }

    function applyFontSize(size) {
        document.body.classList.remove('font-small', 'font-medium', 'font-large');
        document.body.classList.add(`font-${size}`);
    }
    // --- End Settings ---

    // --- Helper Functions ---
    function formatDateTime(dateTimeString) {
        if (!dateTimeString) return 'N/A';
        try { return new Date(dateTimeString).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); }
        catch (e) { return 'Invalid Date'; }
    }

    function formatDateTimeForInput(dateTimeString) {
        if (!dateTimeString) return '';
        try {
            const date = new Date(dateTimeString);
            // Adjust for timezone offset to display correctly in datetime-local input
            const timezoneOffset = date.getTimezoneOffset() * 60000; //offset in milliseconds
            const localISOTime = new Date(date.getTime() - timezoneOffset).toISOString().slice(0,16);
            return localISOTime;
        } catch (e) { return ''; }
    }
    // --- End Helper Functions ---

    // --- Logout ---
    function logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('profileName');
        // Optionally clear other settings from local storage
        localStorage.removeItem('theme');
        localStorage.removeItem('fontSize');
        localStorage.removeItem('calendarPreferredView');
        localStorage.removeItem('defaultPlatformSetting');

        // No backend call needed for basic JWT logout unless implementing token blacklisting
        window.location.href = 'index.html';
    }
    // --- End Logout ---

    // --- Start the dashboard ---
    initializeDashboard();
});