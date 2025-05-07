// adminjs/admin.js
$(document).ready(function() {
    // Cache jQuery Selections
    const $sidebarLinks = $('.sidebar-nav .nav-link');
    const $contentSections = $('.content-section');
    const $pageTitle = $('#page-title');

    const logoutModal = $('#logoutConfirmationModal');
    const alertModal = $('#alertModal');
    
    const addUserModal = $('#add-user-modal');
    const addUserForm = $('#add-user-form');
    const userTableBody = $('#user-table-body');

    const addCoachModal = $('#add-coach-modal');
    const addCoachForm = $('#add-coach-form');
    const coachTableBody = $('#coach-table-body');

    const addGymModal = $('#add-gym-modal');
    const addGymForm = $('#add-gym-form');
    const gymTableBody = $('#gym-table-body');

    const alertModalTitle = $('#alertModalTitle');
    const alertModalMessage = $('#alertModalMessage');
    const alertModalOkButton = $('#alertModalOkButton');
    const alertModalCloseButton = $('#alertModal .alert-modal-close');

    const headerLogoutLink = $('#header-logout-link'); // Cache header logout link

    let trendsChartInstance = null, newUserChartInstance = null, gymPopularityChartInstance = null;

    // --- Recent Activity & Stats ---
    const $recentActivityList = $('#recent-activity-list');
    function addRecentActivity(message) {
        const date = new Date();
        const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const $newActivity = $(`<li>${message} - <small>${time}</small></li>`).hide(); // Hide initially for fade-in
        $recentActivityList.prepend($newActivity);
        $newActivity.fadeIn(); // Fade in the new activity
        if ($recentActivityList.children().length > 5) {
            $recentActivityList.children().last().fadeOut(function() { $(this).remove(); }); // Fade out and remove oldest
        }
    }
    function updateDashboardStats() {
        $('#total-users-stat').text(userTableBody.find('tr').length);
        $('#active-members-stat').text(userTableBody.find('tr td[data-label="Status"]:contains("Active")').length);
        $('#total-gyms-stat').text(gymTableBody.find('tr').length);
        $('#total-coaches-stat').text(coachTableBody.find('tr').length);
    }

    // --- Generic ID Generation ---
    function generateNewId(tableBody, prefix, idDataAttribute = 'id') {
        let maxIdNum = 0;
        tableBody.find('tr').each(function() {
            const id = $(this).data(idDataAttribute);
            if (id && typeof id === 'string' && id.toUpperCase().startsWith(prefix.toUpperCase())) {
                const numPart = id.substring(prefix.length);
                if (/^\d+$/.test(numPart)) {
                    const num = parseInt(numPart, 10);
                    if (!isNaN(num) && num > maxIdNum) { // Check isNaN just in case
                        maxIdNum = num;
                    }
                }
            }
        });
        const newIdNum = maxIdNum + 1;
        return prefix.toUpperCase() + String(newIdNum).padStart(3, '0');
    }

    // --- Form Field Definitions ---
    const userFormFields = [
        { input: $('#user-first-name'), errorId: 'user-first-name-error', name: 'First Name', required: true },
        { input: $('#user-last-name'), errorId: 'user-last-name-error', name: 'Last Name', required: true },
        { input: $('#user-suffix'), errorId: 'user-suffix-error', name: 'Suffix', required: false },
        { input: $('#user-email'), errorId: 'user-email-error', name: 'Email', required: true, isEmail: true },
        { input: $('#user-membership'), errorId: 'user-membership-error', name: 'Membership', required: true },
        { input: $('#user-status'), errorId: 'user-status-error', name: 'Status', required: true },
    ];
    const coachFormFields = [
        { input: $('#coach-first-name'), errorId: 'coach-first-name-error', name: 'First Name', required: true },
        { input: $('#coach-last-name'), errorId: 'coach-last-name-error', name: 'Last Name', required: true },
        { input: $('#coach-suffix'), errorId: 'coach-suffix-error', name: 'Suffix', required: false },
        { input: $('#coach-email'), errorId: 'coach-email-error', name: 'Email', required: true, isEmail: true },
        { input: $('#coach-role'), errorId: 'coach-role-error', name: 'Role', required: true },
        { input: $('#coach-gym-branch'), errorId: 'coach-gym-branch-error', name: 'Gym Branch', required: true },
    ];
    const gymFormFields = [
        { input: $('#gym-name'), errorId: 'gym-name-error', name: 'Gym Name', required: true },
        { input: $('#gym-location'), errorId: 'gym-location-error', name: 'Location', required: true },
        { input: $('#gym-manager'), errorId: 'gym-manager-error', name: 'Manager Name', required: true },
        { input: $('#gym-capacity'), errorId: 'gym-capacity-error', name: 'Capacity', required: true, isNumber: true, min: 1 },
    ];

    // --- Generic Form Reset ---
    function resetForm(formElement, fieldsToValidate) {
        if (formElement && formElement.length) {
            formElement[0].reset();
            fieldsToValidate.forEach(field => {
                field.input.removeClass('is-invalid').attr('aria-invalid', 'false');
                $('#' + field.errorId).text('').hide();
                field.input.attr('aria-describedby', field.errorId); // Re-associate
            });
        }
    }

    // --- Generic Form Validation ---
    function validateForm(fieldsToValidate) {
        let isFormValid = true;
        let firstInvalidField = null;

        fieldsToValidate.forEach(field => {
            const $input = field.input;
            const $errorDiv = $('#' + field.errorId);
            const value = $input.val() ? $input.val().trim() : ""; // Use .val() directly, trim later if needed
            let errorMessage = '';

            if (field.required && value === '') { // Check empty value for selects too
                errorMessage = `${field.name} is required.`;
            } else if (value !== '' && field.isEmail) {
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailPattern.test(value)) {
                    errorMessage = `Please enter a valid ${field.name.toLowerCase()} address.`;
                }
            } else if (value !== '' && field.isNumber) {
                 const numValue = parseFloat(value); // Parse before checking isNaN
                if (isNaN(numValue)) {
                    errorMessage = `${field.name} must be a number.`;
                } else if (field.min !== undefined && numValue < field.min) {
                    errorMessage = `${field.name} must be at least ${field.min}.`;
                }
            }

            if (errorMessage) {
                $input.addClass('is-invalid').attr('aria-invalid', 'true');
                $errorDiv.text(errorMessage).show();
                isFormValid = false;
                if (!firstInvalidField) firstInvalidField = $input;
            } else {
                $input.removeClass('is-invalid').attr('aria-invalid', 'false');
                $errorDiv.text('').hide();
            }
        });

        if (firstInvalidField) firstInvalidField.focus();
        return isFormValid;
    }

    // --- Alert Modal Functions ---
    function showAlert(message, title = 'Notification', isConfirmation = false) {
        if (!alertModal.length || !alertModalMessage.length || !alertModalTitle.length) {
            console.error("Alert modal elements not found! Fallback to native alert/confirm.");
            if (isConfirmation) return confirm(message); // Fallback confirm
            else alert(message); // Fallback alert
            return;
        }
        alertModalTitle.text(title);
        alertModalMessage.text(message);

        // Reset OK button behavior for standard alerts
        alertModalOkButton.off('click').on('click', hideAlert);

        $('.modal.show').not(alertModal).removeClass('show');
        alertModal.addClass('show');
    }
    function hideAlert() { if (alertModal.length) alertModal.removeClass('show'); }


    // --- Modal Show/Hide Functions ---
     function showModal($modal) {
        if ($modal && $modal.length) {
            $('.modal.show').not($modal).removeClass('show'); // Close other modals
            $modal.addClass('show');
            // Focus first focusable element: input, select, button not readonly/disabled
            $modal.find('form input:not([readonly]):not([disabled]):not([type="hidden"]), form select:not([readonly]):not([disabled]), form button:not([disabled])').first().focus();
        } else {
            console.error("Modal element not found to show:", $modal);
            showAlert("Error: Could not open the requested window.", "UI Error");
        }
    }
    function hideModal($modal) { if ($modal && $modal.length) $modal.removeClass('show'); }

    function hideAndResetFormModal($modal, formElement, fieldsToValidate) {
        hideModal($modal);
        resetForm(formElement, fieldsToValidate); // Always reset associated form on hide
    }

    // --- Event Listeners for Modals, Navigation, etc. ---
    if (alertModalOkButton.length) alertModalOkButton.on('click', hideAlert); // Default behavior
    if (alertModalCloseButton.length) alertModalCloseButton.on('click', hideAlert);
    alertModal.on('click', function(event) { if ($(event.target).is(alertModal)) hideAlert(); });

    // Logout logic using header link
    if (headerLogoutLink.length && logoutModal.length) {
        headerLogoutLink.on('click', function(e) {
            e.preventDefault();
            showModal(logoutModal);
        });
        $('#cancelLogoutButton').on('click', () => hideModal(logoutModal));
        $('#closeLogoutModalButton').on('click', () => hideModal(logoutModal));
        logoutModal.on('click', (event) => { if ($(event.target).is(logoutModal)) hideModal(logoutModal); });
        $('#okLogoutButton').on('click', function() {
            hideModal(logoutModal);
            // Simulate logout - clear potential session data? Redirect.
            addRecentActivity("Admin logged out."); // Log before redirect
            // Add a small delay for activity log before redirecting
             setTimeout(() => {
                window.location.href = headerLogoutLink.attr('href');
             }, 100);
        });
    } else {
        console.warn("Header logout link or logout modal not found.");
    }

    // Sidebar Navigation
    $sidebarLinks.on('click', function(e) {
        e.preventDefault(); // Prevent default anchor behavior for all sidebar links now
        const $this = $(this);
        const targetId = $this.data('target');
        const $targetSection = $('#' + targetId);

        if (targetId && $targetSection.length) {
            if (!$this.hasClass('active')) {
                $sidebarLinks.removeClass('active');
                $this.addClass('active');
                $contentSections.removeClass('active');
                $targetSection.addClass('active');
                $pageTitle.text($this.find('.nav-text').text().trim() || 'Admin Dashboard');

                // Initialize charts only when the analytics section becomes active
                if (targetId === 'analytics-content') {
                    setTimeout(initializeAnalyticsCharts, 250); // Delay helps ensure canvas is rendered
                }
            }
        } else {
            console.error(`Navigation target #${targetId} not found.`);
            showAlert(`Content for "${$this.find('.nav-text').text().trim()}" could not be found.`, "Navigation Error");
        }
    });

    // --- Setup Add Buttons ---
    $('.add-btn[data-modal-target="add-user-modal"]').on('click', function() {
        resetForm(addUserForm, userFormFields);
        $('#user-id').val(generateNewId(userTableBody, 'USR'));
        showModal(addUserModal);
    });
    $('.add-btn[data-modal-target="add-coach-modal"]').on('click', function() {
        resetForm(addCoachForm, coachFormFields);
        $('#coach-id').val(generateNewId(coachTableBody, 'STF'));
        showModal(addCoachModal);
    });
    $('.add-btn[data-modal-target="add-gym-modal"]').on('click', function() {
        resetForm(addGymForm, gymFormFields);
        $('#gym-id').val(generateNewId(gymTableBody, 'GYM'));
        showModal(addGymModal);
    });

    // --- Modal Close Buttons ---
    $('.modal .close-btn').not('.alert-modal-close, #closeLogoutModalButton').on('click', function() {
        const $modal = $(this).closest('.modal');
        // Determine which form to reset based on modal ID
        if ($modal.is(addUserModal)) hideAndResetFormModal($modal, addUserForm, userFormFields);
        else if ($modal.is(addCoachModal)) hideAndResetFormModal($modal, addCoachForm, coachFormFields);
        else if ($modal.is(addGymModal)) hideAndResetFormModal($modal, addGymForm, gymFormFields);
        else hideModal($modal); // For non-form modals like logout
    });

    // --- Form Submissions ---
    addUserForm.on('submit', function(e) {
        e.preventDefault();
        if (!validateForm(userFormFields)) return;
        const id = $('#user-id').val(); // Already trimmed by generation/readonly
        const firstName = $('#user-first-name').val().trim();
        const lastName = $('#user-last-name').val().trim();
        const suffix = $('#user-suffix').val().trim();
        const email = $('#user-email').val().trim();
        const membership = $('#user-membership').val(); // No trim needed for select
        const status = $('#user-status').val();       // No trim needed for select

        // Combine name parts for display in table (optional, can keep separate)
        // let fullName = `${firstName} ${lastName}${suffix ? ' ' + suffix : ''}`;

        const newRowHtml = `<tr data-id="${id}">
            <td data-label="ID">${id}</td>
            <td data-label="First Name">${firstName}</td>
            <td data-label="Last Name">${lastName}</td>
            <td data-label="Suffix">${suffix}</td>
            <td data-label="Email">${email}</td>
            <td data-label="Membership">${membership}</td>
            <td data-label="Status">${status}</td>
            <td data-label="Actions"><button class="btn btn-sm btn-danger">Delete</button></td>
        </tr>`;
        userTableBody.append(newRowHtml);
        addResponsiveTableHeaders(); // Update labels for new row
        showAlert(`User "${firstName} ${lastName}" added successfully!`, 'Success');
        addRecentActivity(`New user added: ${firstName} ${lastName} (${id})`);
        updateDashboardStats();
        hideAndResetFormModal(addUserModal, addUserForm, userFormFields); // Hide and reset form
    });

    addCoachForm.on('submit', function(e) {
        e.preventDefault();
        if (!validateForm(coachFormFields)) return;
        const id = $('#coach-id').val();
        const firstName = $('#coach-first-name').val().trim();
        const lastName = $('#coach-last-name').val().trim();
        const suffix = $('#coach-suffix').val().trim();
        const email = $('#coach-email').val().trim();
        const role = $('#coach-role').val();
        const gymBranch = $('#coach-gym-branch').val();

        const newRowHtml = `<tr data-id="${id}">
            <td data-label="ID">${id}</td>
            <td data-label="First Name">${firstName}</td>
            <td data-label="Last Name">${lastName}</td>
            <td data-label="Suffix">${suffix}</td>
            <td data-label="Role">${role}</td>
            <td data-label="Email">${email}</td>
            <td data-label="Gym Branch">${gymBranch}</td>
            <td data-label="Actions"><button class="btn btn-sm btn-danger">Delete</button></td>
        </tr>`;
        coachTableBody.append(newRowHtml);
        addResponsiveTableHeaders();
        showAlert(`Staff "${firstName} ${lastName}" added successfully!`, 'Success');
        addRecentActivity(`New staff added: ${firstName} ${lastName} (${id})`);
        updateDashboardStats();
        hideAndResetFormModal(addCoachModal, addCoachForm, coachFormFields);
    });

    addGymForm.on('submit', function(e) {
        e.preventDefault();
        if (!validateForm(gymFormFields)) return;
        const id = $('#gym-id').val();
        const name = $('#gym-name').val();
        const location = $('#gym-location').val();
        const manager = $('#gym-manager').val().trim();
        const capacity = $('#gym-capacity').val().trim(); // Trim although type number

        const newRowHtml = `<tr data-id="${id}">
            <td data-label="ID">${id}</td>
            <td data-label="Name">${name}</td>
            <td data-label="Location">${location}</td>
            <td data-label="Manager">${manager}</td>
            <td data-label="Capacity">${capacity}</td>
            <td data-label="Actions"><button class="btn btn-sm btn-danger">Delete</button></td>
        </tr>`;
        gymTableBody.append(newRowHtml);
        addResponsiveTableHeaders();
        showAlert(`Gym "${name}" added successfully!`, 'Success');
        addRecentActivity(`New gym added: ${name} (${id})`);
        updateDashboardStats();
        hideAndResetFormModal(addGymModal, addGymForm, gymFormFields);
    });

    // --- Click Outside Modal ---
    $(window).on('click', function(event) {
        const $target = $(event.target);
        // Check if click is on the modal overlay itself
        if ($target.is(addUserModal)) hideAndResetFormModal(addUserModal, addUserForm, userFormFields);
        else if ($target.is(addCoachModal)) hideAndResetFormModal(addCoachModal, addCoachForm, coachFormFields);
        else if ($target.is(addGymModal)) hideAndResetFormModal(addGymModal, addGymForm, gymFormFields);
        else if ($target.is(logoutModal)) hideModal(logoutModal); // Only hide, no reset needed
        else if ($target.is(alertModal)) hideAlert();
    });

    // --- Table Action Handlers ---
    // Delete (using event delegation)
    $('.content-area').on('click', '.btn-danger', function() {
        var $row = $(this).closest('tr');
        var id = $row.data('id');
        var nameCell = $row.find('td[data-label="Name"], td[data-label="First Name"]').first();
        var itemName = nameCell.text().trim() || id || 'this item';

        // Construct full name if applicable
        if (nameCell.data('label') === "First Name") {
            const lastName = $row.find('td[data-label="Last Name"]').text().trim();
            const suffix = $row.find('td[data-label="Suffix"]').text().trim();
            itemName = `${itemName} ${lastName}${suffix ? ' ' + suffix : ''}`;
        }

        // Use showAlert for confirmation - requires user interaction with the modal
        showAlert(`Are you sure you want to delete ${itemName.trim()}? This action cannot be undone.`, 'Confirm Deletion', true); // Pass true for confirmation type

        // Re-bind the OK button specifically for this confirmation
        alertModalOkButton.off('click').on('click', function proceedDelete() {
            hideAlert(); // Hide confirmation modal
            $row.fadeOut(400, function() { // Fade out row before removing
                 $(this).remove();
                 addResponsiveTableHeaders(); // Update labels if needed (though unlikely needed for delete)
                 updateDashboardStats(); // Update counts
                 addRecentActivity(`${itemName.trim()} (ID: ${id}) deleted.`);
                 showAlert(`${itemName.trim()} deleted!`, 'Deletion Complete');
            });
             // Important: Reset OK button to default behavior after action
             alertModalOkButton.off('click', proceedDelete).on('click', hideAlert);
        });
         // Optional: If user clicks cancel/closes confirmation modal, reset OK button too
         alertModalCloseButton.off('click').on('click', function cancelDelete() {
              hideAlert();
              alertModalOkButton.off('click').on('click', hideAlert); // Reset OK button
              alertModalCloseButton.off('click', cancelDelete).on('click', hideAlert); // Reset close button
         });
         alertModal.off('click').on('click', function(event) { // Reset click outside
             if ($(event.target).is(alertModal)) {
                  hideAlert();
                  alertModalOkButton.off('click').on('click', hideAlert);
                  alertModalCloseButton.off('click').on('click', hideAlert);
                  alertModal.off('click').on('click', function(e) {if ($(e.target).is(alertModal)) hideAlert();}); // Re-bind default outside click
             }
         });

    });

    // Placeholder for other actions if needed
    $('.content-area').on('click', '.btn-info', function() {
         var $row = $(this).closest('tr');
         var paymentId = $row.data('id') || $row.find('td[data-label="Payment ID"]').text();
         showAlert(`Initiating refund process for Payment ID: ${paymentId}.`, 'Refund Action');
         // Add actual refund logic here (e.g., API call)
    });
    $('.content-area').on('click', '.btn-success', function() {
         var $button = $(this);
         var $row = $button.closest('tr');
         var paymentId = $row.data('id') || $row.find('td[data-label="Payment ID"]').text();
         showAlert(`Marking payment ${paymentId} as Paid...`, 'Payment Action');
         $row.find('td[data-label="Status"]').text('Completed').css('color', 'var(--success)');
         $button.remove(); // Or disable/change text
         addRecentActivity(`Payment ${paymentId} marked as Paid.`);
    });

    // --- Initialize Analytics Charts ---
    function initializeAnalyticsCharts() {
        if (typeof Chart === 'undefined') { console.error("Chart.js is not loaded."); return; }

        // Destroy existing charts to prevent duplicates or memory leaks
        if (trendsChartInstance) trendsChartInstance.destroy();
        if (newUserChartInstance) newUserChartInstance.destroy();
        if (gymPopularityChartInstance) gymPopularityChartInstance.destroy();
        trendsChartInstance = null; newUserChartInstance = null; gymPopularityChartInstance = null;

        const trendsCtx = document.getElementById('trendsChart')?.getContext('2d');
        const newUserCtx = document.getElementById('newUserChart')?.getContext('2d');
        const gymPopularityCtx = document.getElementById('gymPopularityChart')?.getContext('2d');

        if (!trendsCtx || !newUserCtx || !gymPopularityCtx) { // Check all required contexts
             console.warn("One or more chart canvas elements not found. Analytics may be incomplete.");
             if (!$('#analytics-content').hasClass('active')) {
                console.warn("Analytics section is not active. Charts might not initialize correctly if canvas elements are hidden.");
             }
             return; // Exit if any chart canvas is missing
        }

        // Retrieve CSS variable values safely with fallbacks
        const rootStyles = getComputedStyle(document.documentElement);
        const goldColor = rootStyles.getPropertyValue('--main-color').trim() || '#FFD700';
        const goldLightColor = rootStyles.getPropertyValue('--gold-light').trim() || '#FFEC8B';
        const textColor = rootStyles.getPropertyValue('--primary-text').trim() || '#ecf0f1';
        const gridBorderColor = rootStyles.getPropertyValue('--border-color').trim() || '#444';
        const doughnutBorderColor = rootStyles.getPropertyValue('--dark-gray').trim() || '#333333';
        const fontFamily = 'Poppins, sans-serif'; // Ensure font is loaded

        // Common options generators for consistency
        const commonChartOptions = (type = 'bar') => ({
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: gridBorderColor }, ticks: { color: textColor, font: { family: fontFamily } } },
                x: { grid: { display: type === 'line', color: gridBorderColor }, ticks: { color: textColor, font: { family: fontFamily } } } // Show grid for line, not bar
            },
            plugins: {
                legend: { labels: { color: textColor, font: { family: fontFamily } } },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)', titleColor: goldColor, bodyColor: textColor,
                    displayColors: false, bodyFont: { family: fontFamily }, titleFont: { family: fontFamily }
                }
            },
            animation: { duration: 800, easing: 'easeInOutQuad' }
        });
        const doughnutOptions = {
            responsive: true, maintainAspectRatio: false, cutout: '60%',
            plugins: {
                legend: { position: 'bottom', labels: { color: textColor, font: { family: fontFamily } } },
                tooltip: {
                     backgroundColor: 'rgba(0,0,0,0.8)', titleColor: goldColor, bodyColor: textColor,
                     displayColors: true, // Usually helpful for doughnut
                      callbacks: { // Example: Add percentage to tooltip
                        label: function(context) {
                            let label = context.label || '';
                            if (label) { label += ': '; }
                            if (context.parsed !== null) {
                                const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) + '%' : '0%';
                                label += `${context.formattedValue} (${percentage})`;
                            }
                            return label;
                        }
                    },
                     bodyFont: { family: fontFamily }, titleFont: { family: fontFamily }
                }
            },
            animation: { animateRotate: true, animateScale: true, duration: 1000 }
        };

        // --- Chart Instantiation ---
        // Membership Trends (Line) - Example Data
        trendsChartInstance = new Chart(trendsCtx, {
            type: 'line',
            data: {
                // Example: Monthly labels for last 6 months
                labels: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                datasets: [{
                    label: 'Premium Members',
                    data: [45, 50, 55, 65, 70, 75], // Replace with actual data
                    borderColor: goldColor, backgroundColor: 'rgba(255, 215, 0, 0.2)', tension: 0.3, fill: true
                }, {
                    label: 'Basic Members',
                    data: [80, 81, 85, 90, 98, 105], // Replace with actual data
                    borderColor: goldLightColor, backgroundColor: 'rgba(255, 236, 139, 0.2)', tension: 0.3, fill: true
                }]
            },
            options: commonChartOptions('line')
        });

        // New User Registrations (Bar) - Example Data
        newUserChartInstance = new Chart(newUserCtx, {
            type: 'bar',
            data: {
                labels: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                datasets: [{
                    label: 'New Users',
                    data: [30, 25, 40, 35, 50, 48], // Replace with actual data
                    backgroundColor: goldColor, borderColor: goldColor, borderWidth: 1, borderRadius: 4
                }]
            },
            options: commonChartOptions('bar')
        });

        // Gym Popularity (Doughnut) - Data from current table state
        const gymData = {}; // Use an object to count users per gym name
         userTableBody.find('tr').each(function() {
              // This assumes users can be assigned to a gym branch directly or indirectly.
              // We'll use the *coach's* gym branch assignment for this example,
              // assuming users don't have a direct gym branch field in their table row.
              // A better approach would be to have gym assignment data for users.
              // For now, let's count coaches per gym instead as a placeholder.
              const gymBranch = $(this).closest('section#users-content') // Find users section first
                                  .siblings('section#staff-content') // Go to staff section
                                  .find('#coach-table-body tr') // Find coach rows
                                  .first() // Just take the first coach's branch for this example
                                  .find('td[data-label="Gym Branch"]')
                                  .text();

             // A more realistic example: Count gyms directly from the gym table
             // const gymName = $(this).find('td[data-label="Name"]').text(); // This won't work as 'this' is user row
         });

         // Let's count gyms listed in the gym table instead (simpler example)
          $('#gym-table-body tr').each(function() {
             const name = $(this).find('td[data-label="Name"]').text();
             gymData[name] = (gymData[name] || 0) + 1; // Count occurrences of each gym name
         });

         const gymNames = Object.keys(gymData);
         const gymCounts = Object.values(gymData);

        if (gymNames.length === 0) { // Handle empty gyms table
             gymNames.push("No Gym Data");
             gymCounts.push(1);
        }

        gymPopularityChartInstance = new Chart(gymPopularityCtx, {
            type: 'doughnut',
            data: {
                labels: gymNames,
                datasets: [{
                    label: 'Gym Locations Added', // Changed label to reflect data source
                    data: gymCounts,
                    backgroundColor: [goldColor, goldLightColor, '#E6BE8A', '#D4AC0D', '#C0A062'], // Add more colors if needed
                    borderColor: doughnutBorderColor,
                    borderWidth: 2,
                    hoverOffset: 8
                }]
            },
            options: doughnutOptions
        });
    }


    // --- Search Functionality ---
    function handleContentSearch(inputId, tableBodySelector, searchColumns) {
        const $searchInput = $(inputId);
        const $tableBody = $(tableBodySelector);
        if (!$searchInput.length || !$tableBody.length) {
             console.warn(`Search setup failed: Input (${inputId}) or Table Body (${tableBodySelector}) not found.`);
             return;
        }

        $searchInput.on('keyup', function() {
            const searchTerm = $(this).val().trim().toLowerCase();
            $tableBody.find('tr').each(function() {
                const $row = $(this);
                let match = false;
                if (searchTerm === '') {
                    match = true; // Show all if search is empty
                } else {
                    // Search within specified columns
                    for (const col of searchColumns) {
                        const cellText = $row.find(`td[data-label="${col}"]`).text().trim().toLowerCase();
                        if (cellText.includes(searchTerm)) {
                            match = true;
                            break; // Stop checking columns for this row once a match is found
                        }
                    }
                }
                // Show or hide row based on match status
                if (match) {
                    $row.show();
                } else {
                    $row.hide();
                }
            });
        });
    }

    // --- Responsive Table Headers ---
    function addResponsiveTableHeaders() {
        $('table').each(function() {
            var $table = $(this);
            var $headerCells = $table.find('thead th');
            if ($headerCells.length === 0) return;
            $table.find('tbody tr').each(function() {
                const $row = $(this);
                $row.find('td').each(function(index) {
                    // Ensure we don't go out of bounds if row has fewer cells than header
                    if ($headerCells.eq(index).length) {
                         // Check if data-label already exists and matches, avoids unnecessary updates
                         const newLabel = $headerCells.eq(index).text();
                         if ($(this).attr('data-label') !== newLabel) {
                            $(this).attr('data-label', newLabel);
                         }
                    }
                });
            });
        });
    }

    // --- Initial Page Load Setup ---
    addResponsiveTableHeaders(); // Add labels initially
    updateDashboardStats(); // Set initial stats
    addRecentActivity("Admin dashboard loaded."); // Log loading

    // Setup search handlers
    handleContentSearch('#user-search-input', '#user-table-body', ['First Name', 'Last Name', 'Email', 'ID']);
    handleContentSearch('#staff-search-input', '#coach-table-body', ['First Name', 'Last Name', 'Email', 'ID', 'Role', 'Gym Branch']);
    handleContentSearch('#gym-search-input', '#gym-table-body', ['Name', 'Location', 'Manager', 'ID']);
    handleContentSearch('#payment-search-input', '#payment-table-body', ['User Name', 'User ID', 'Payment ID', 'Method', 'Status']); // Added more payment fields

    // Activate initial content section
    const initialActiveLink = $('.sidebar-nav .nav-link.active').first();
    let initialTargetId = (initialActiveLink.length && initialActiveLink.data('target')) ? initialActiveLink.data('target') : 'dashboard-content';
    const $initialTargetSection = $('#' + initialTargetId);

    if ($initialTargetSection.length) {
        $('.sidebar-nav .nav-link').removeClass('active');
        $contentSections.removeClass('active');
        $initialTargetSection.addClass('active');
        $(`.sidebar-nav .nav-link[data-target="${initialTargetId}"]`).addClass('active');
        $pageTitle.text($(`.sidebar-nav .nav-link[data-target="${initialTargetId}"]`).find('.nav-text').text().trim() || 'Dashboard');
        if (initialTargetId === 'analytics-content') {
            setTimeout(initializeAnalyticsCharts, 250); // Delay chart init
        }
    } else {
        // Fallback to dashboard if initial target not found
        $('#dashboard-content').addClass('active');
        $('.sidebar-nav .nav-link[data-target="dashboard-content"]').addClass('active');
        $pageTitle.text('Dashboard');
    }

}); // End document ready