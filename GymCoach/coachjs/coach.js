// gymcoachjs/coach_script.js
$(document).ready(function() {
    // Cache jQuery Selections (similar to owner script, but add new ones)
    const $sidebarLinks = $('.sidebar-nav .nav-link');
    const $contentSections = $('.content-section');
    const $pageTitle = $('#page-title');

    const logoutModal = $('#logoutConfirmationModal');
    const alertModal = $('#alertModal');
    const alertModalTitle = $('#alertModalTitle');
    const alertModalMessage = $('#alertModalMessage');
    const alertModalOkButton = $('#alertModalOkButton');
    const alertModalCloseButton = $('#alertModal .alert-modal-close');
    const headerLogoutLink = $('#header-logout-link');

    // New Modals & Forms for Coach
    const addClientModal = $('#add-client-modal');
    const addClientForm = $('#add-client-form');
    const clientTableBody = $('#client-table-body');

    const addWorkoutPlanModal = $('#add-workout-plan-modal');
    const addWorkoutPlanForm = $('#add-workout-plan-form');
    const workoutPlanTableBody = $('#workout-plan-table-body');

    const addMealPlanModal = $('#add-meal-plan-modal');
    const addMealPlanForm = $('#add-meal-plan-form');
    const mealPlanTableBody = $('#meal-plan-table-body');

    const addAppointmentModal = $('#add-appointment-modal');
    const addAppointmentForm = $('#add-appointment-form');
    const appointmentTableBody = $('#appointment-table-body');
    const appointmentClientSelect = $('#appointment-client'); // For populating clients

    const logProgressModal = $('#log-progress-modal');
    const logProgressForm = $('#log-progress-form');
    const logProgressModalTitle = $('#log-progress-modal-title');
    const logProgressClientIdHidden = $('#log-progress-client-id');
    const progressLogTableBody = $('#progress-log-table-body');

    const selectClientProgress = $('#select-client-progress');
    const clientProgressDisplay = $('#client-progress-display');
    const selectClientPrompt = $('#select-client-prompt');
    const logProgressBtn = $('#log-progress-btn');
    const progressClientNameDisplay = $('#progress-client-name');
    
    const assignPlanModal = $('#assign-plan-modal');
    const assignPlanForm = $('#assign-plan-form');
    const assignPlanClientName = $('#assign-plan-client-name');
    const assignPlanClientIdHidden = $('#assign-plan-client-id-hidden');
    const assignWorkoutPlanSelect = $('#assign-workout-plan');
    const assignMealPlanSelect = $('#assign-meal-plan');

    const viewDetailsModal = $('#view-details-modal');
    const viewDetailsTitle = $('#view-details-title');
    const viewDetailsBody = $('#view-details-body');
    const viewDetailsOkButton = $('#viewDetailsOkButton');


    let weightChartInstance = null, strengthChartInstance = null, cardioChartInstance = null;
    
    // --- Mock Client Progress Data Store (replace with backend in real app) ---
    let clientProgressData = {
        "CLT001": {
            name: "Johnathan Doe",
            logs: [
                { date: "2023-10-01", weight: 75.5, strength: 70, cardio: 20, notes: "Started program" },
                { date: "2023-10-15", weight: 74.8, strength: 72.5, cardio: 25, notes: "Feeling good" },
                { date: "2023-10-28", weight: 74.0, strength: 75, cardio: 30, notes: "New PB on bench!" },
            ]
        },
        "CLT002": {
            name: "Jane Smith",
            logs: [
                { date: "2023-09-20", weight: 62.0, strength: 40, cardio: 15, notes: "First session" },
                { date: "2023-10-05", weight: 61.5, strength: 42.5, cardio: 18, notes: "Improving stamina" },
                { date: "2023-10-20", weight: 60.8, strength: 45, cardio: 22, notes: "Consistent effort" },
            ]
        }
    };


    // --- Recent Activity & Stats (Adapted from owner script) ---
    const $recentActivityList = $('#recent-activity-list');
    function addRecentActivity(message) {
        const date = new Date();
        const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const $newActivity = $(`<li>${message} - <small>${time}</small></li>`).hide();
        $recentActivityList.prepend($newActivity);
        $newActivity.fadeIn();
        if ($recentActivityList.children().length > 5) {
            $recentActivityList.children().last().fadeOut(function() { $(this).remove(); });
        }
    }

    function updateDashboardStats() {
        $('#total-clients-stat').text(clientTableBody.find('tr').length);
        $('#upcoming-appointments-stat').text(appointmentTableBody.find('tr td[data-label="Status"]:not(:contains("Completed")):not(:contains("Cancelled"))').length);
        $('#active-workout-plans-stat').text(workoutPlanTableBody.find('tr').length); // Simple count
        
        let pendingProgressCount = 0;
        clientTableBody.find('tr').each(function() {
            const clientId = $(this).data('id');
            const lastCheckinDate = $(this).find('td[data-label="Last Check-in"]').text();
            if (lastCheckinDate) {
                const daysSinceCheckin = moment().diff(moment(lastCheckinDate), 'days');
                if (daysSinceCheckin > 7) { // Example: flag if no check-in for > 7 days
                    pendingProgressCount++;
                }
            } else {
                 pendingProgressCount++; // No check-in date means pending
            }
        });
        $('#pending-progress-stat').text(pendingProgressCount);
    }

    // --- Generic ID Generation (Reused) ---
    function generateNewId(tableBody, prefix, idDataAttribute = 'id') {
        let maxIdNum = 0;
        tableBody.find('tr').each(function() {
            const id = $(this).data(idDataAttribute);
            if (id && typeof id === 'string' && id.toUpperCase().startsWith(prefix.toUpperCase())) {
                const numPart = id.substring(prefix.length);
                if (/^\d+$/.test(numPart)) {
                    const num = parseInt(numPart, 10);
                    if (!isNaN(num) && num > maxIdNum) {
                        maxIdNum = num;
                    }
                }
            }
        });
        const newIdNum = maxIdNum + 1;
        return prefix.toUpperCase() + String(newIdNum).padStart(3, '0');
    }

    // --- Form Field Definitions (New ones for Coach) ---
    const clientFormFields = [
        { input: $('#client-full-name'), errorId: 'client-full-name-error', name: 'Full Name', required: true },
        { input: $('#client-email'), errorId: 'client-email-error', name: 'Email', required: true, isEmail: true },
        { input: $('#client-phone'), errorId: 'client-phone-error', name: 'Phone Number', required: true },
        { input: $('#client-last-checkin'), errorId: 'client-last-checkin-error', name: 'Last Check-in Date', required: true },
    ];
    const workoutPlanFormFields = [
        { input: $('#workout-plan-name'), errorId: 'workout-plan-name-error', name: 'Plan Name', required: true },
        { input: $('#workout-plan-type'), errorId: 'workout-plan-type-error', name: 'Type', required: true },
        { input: $('#workout-plan-duration'), errorId: 'workout-plan-duration-error', name: 'Duration', required: true },
        { input: $('#workout-plan-focus'), errorId: 'workout-plan-focus-error', name: 'Focus/Details', required: false }, // Optional
    ];
    const mealPlanFormFields = [
        { input: $('#meal-plan-name'), errorId: 'meal-plan-name-error', name: 'Plan Name', required: true },
        { input: $('#meal-plan-type'), errorId: 'meal-plan-type-error', name: 'Type', required: true },
        { input: $('#meal-plan-calories'), errorId: 'meal-plan-calories-error', name: 'Daily Calories', required: true, isNumber: true },
        { input: $('#meal-plan-focus'), errorId: 'meal-plan-focus-error', name: 'Primary Focus', required: false }, // Optional
    ];
     const appointmentFormFields = [
        { input: $('#appointment-client'), errorId: 'appointment-client-error', name: 'Client', required: true },
        { input: $('#appointment-date'), errorId: 'appointment-date-error', name: 'Date', required: true },
        { input: $('#appointment-time'), errorId: 'appointment-time-error', name: 'Time', required: true },
        { input: $('#appointment-purpose'), errorId: 'appointment-purpose-error', name: 'Purpose', required: true },
        { input: $('#appointment-status'), errorId: 'appointment-status-error', name: 'Status', required: true },
    ];
    const logProgressFormFields = [
        { input: $('#log-progress-date'), errorId: 'log-progress-date-error', name: 'Date', required: true },
        { input: $('#log-progress-weight'), errorId: 'log-progress-weight-error', name: 'Weight', required: false, isNumber: true }, // Optional
        { input: $('#log-progress-strength-exercise'), errorId: 'log-progress-strength-exercise-error', name: 'Strength Exc', required: false, isNumber: true },
        { input: $('#log-progress-cardio-metric'), errorId: 'log-progress-cardio-metric-error', name: 'Cardio Metric', required: false, isNumber: true },
    ];

    // --- Generic Form Reset & Validation (Reused from owner script) ---
    function resetForm(formElement, fieldsToValidate) {
        if (formElement && formElement.length) {
            formElement[0].reset();
            fieldsToValidate.forEach(field => {
                field.input.removeClass('is-invalid').attr('aria-invalid', 'false');
                $('#' + field.errorId).text('').hide();
                field.input.attr('aria-describedby', field.errorId);
            });
        }
    }

    function validateForm(fieldsToValidate) {
        let isFormValid = true;
        let firstInvalidField = null;

        fieldsToValidate.forEach(field => {
            const $input = field.input;
            const $errorDiv = $('#' + field.errorId);
            const value = $input.val() ? (($input.attr('type') === 'password' || $input.attr('type') === 'date' || $input.attr('type') === 'time' || $input.attr('type') === 'number' || $input.attr('type') === 'tel') ? $input.val() : $input.val().trim()) : "";
            let errorMessage = '';

            if (field.required && value === '') {
                errorMessage = `${field.name} is required.`;
            } else if (value !== '' && field.minLength && value.length < field.minLength) {
                errorMessage = `${field.name} must be at least ${field.minLength} characters long.`;
            } else if (value !== '' && field.isEmail) {
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailPattern.test(value)) {
                    errorMessage = `Please enter a valid ${field.name.toLowerCase()} address.`;
                }
            } else if (value !== '' && field.isNumber) {
                const numValue = parseFloat(value);
                 if (isNaN(numValue) || !/^\d*\.?\d*$/.test(value)) { // Allow decimals
                    errorMessage = `${field.name} must be a valid number.`;
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
    
    // --- Alert & Modal Show/Hide Functions (Reused) ---
    function showAlert(message, title = 'Notification', isConfirmation = false) {
        if (!alertModal.length || !alertModalMessage.length || !alertModalTitle.length) {
            if (isConfirmation) return confirm(message);
            else alert(message);
            return;
        }
        alertModalTitle.text(title);
        alertModalMessage.html(message); // Use .html() to allow simple formatting if needed
        alertModalOkButton.off('click').on('click', hideAlert);
        $('.modal.show').not(alertModal).removeClass('show');
        alertModal.addClass('show');
    }
    function hideAlert() { if (alertModal.length) alertModal.removeClass('show'); }

    function showModal($modal) {
        if ($modal && $modal.length) {
            $('.modal.show').not($modal).removeClass('show');
            $modal.addClass('show');
            $modal.find('form input:not([readonly]):not([disabled]):not([type="hidden"]), form select:not([readonly]):not([disabled]), form textarea:not([readonly]):not([disabled]), form button:not([disabled])').first().focus();
        } else {
            showAlert("Error: Could not open the requested window.", "UI Error");
        }
    }
    function hideModal($modal) { if ($modal && $modal.length) $modal.removeClass('show'); }

    function hideAndResetFormModal($modal, formElement, fieldsToValidate) {
        hideModal($modal);
        resetForm(formElement, fieldsToValidate);
    }

    // --- Populate Client Select Dropdowns ---
    function populateClientSelects() {
        const $selects = $('#appointment-client, #select-client-progress');
        $selects.each(function() {
            const $currentSelect = $(this);
            const currentValue = $currentSelect.val(); // Preserve selection if any
            $currentSelect.find('option:not(:first-child)').remove(); // Remove old options
            clientTableBody.find('tr').each(function() {
                const clientId = $(this).data('id');
                const clientName = $(this).find('td[data-label="Full Name"]').text();
                $currentSelect.append(`<option value="${clientId}">${clientName}</option>`);
            });
            if(currentValue) $currentSelect.val(currentValue);
        });
    }
    
    // --- Populate Plan Select Dropdowns (for Assign Plan Modal) ---
    function populatePlanSelects() {
        assignWorkoutPlanSelect.find('option:not(:first-child)').remove();
        workoutPlanTableBody.find('tr').each(function() {
            const planId = $(this).data('id');
            const planName = $(this).find('td[data-label="Plan Name"]').text();
            assignWorkoutPlanSelect.append(`<option value="${planId}">${planName}</option>`);
        });

        assignMealPlanSelect.find('option:not(:first-child)').remove();
        mealPlanTableBody.find('tr').each(function() {
            const planId = $(this).data('id');
            const planName = $(this).find('td[data-label="Plan Name"]').text();
            assignMealPlanSelect.append(`<option value="${planId}">${planName}</option>`);
        });
    }


    // --- Event Listeners for Modals, Navigation, etc. (Adapted) ---
    if (alertModalOkButton.length) alertModalOkButton.on('click', hideAlert);
    if (alertModalCloseButton.length) alertModalCloseButton.on('click', hideAlert);
    alertModal.on('click', function(event) { if ($(event.target).is(alertModal)) hideAlert(); });

    if (headerLogoutLink.length && logoutModal.length) {
        headerLogoutLink.on('click', function(e) {
            e.preventDefault();
            showModal(logoutModal);
        });
        $('#cancelLogoutButton, #closeLogoutModalButton').on('click', () => hideModal(logoutModal));
        logoutModal.on('click', (event) => { if ($(event.target).is(logoutModal)) hideModal(logoutModal); });
        $('#okLogoutButton').on('click', function() {
            hideModal(logoutModal);
            addRecentActivity("Coach logged out.");
             setTimeout(() => { window.location.href = headerLogoutLink.attr('href'); }, 100);
        });
    }

    $sidebarLinks.on('click', function(e) {
        e.preventDefault();
        const $this = $(this);
        const targetId = $this.data('target');
        const $targetSection = $('#' + targetId);

        if (targetId && $targetSection.length) {
            if (!$this.hasClass('active')) {
                $sidebarLinks.removeClass('active');
                $this.addClass('active');
                $contentSections.removeClass('active');
                $targetSection.addClass('active');
                $pageTitle.text($this.find('.nav-text').text().trim() || 'Coach Dashboard');
                if (targetId === 'progress-content') {
                    // populateClientSelects(); // Ensure client list is up-to-date
                    // No automatic chart initialization here, depends on client selection
                } else if (targetId === 'appointments-content') {
                    populateClientSelects(); // For "Add Appointment" modal
                }
            }
        } else {
            showAlert(`Content for "${$this.find('.nav-text').text().trim()}" could not be found.`, "Navigation Error");
        }
    });

    // --- Setup Add Buttons for Coach Modals ---
    $('.add-btn[data-modal-target="add-client-modal"]').on('click', function() {
        resetForm(addClientForm, clientFormFields);
        $('#client-id').val(generateNewId(clientTableBody, 'CLT'));
        showModal(addClientModal);
    });
    $('.add-btn[data-modal-target="add-workout-plan-modal"]').on('click', function() {
        resetForm(addWorkoutPlanForm, workoutPlanFormFields);
        $('#workout-plan-id').val(generateNewId(workoutPlanTableBody, 'WOP'));
        showModal(addWorkoutPlanModal);
    });
    $('.add-btn[data-modal-target="add-meal-plan-modal"]').on('click', function() {
        resetForm(addMealPlanForm, mealPlanFormFields);
        $('#meal-plan-id').val(generateNewId(mealPlanTableBody, 'MPL'));
        showModal(addMealPlanModal);
    });
    $('.add-btn[data-modal-target="add-appointment-modal"]').on('click', function() {
        resetForm(addAppointmentForm, appointmentFormFields);
        $('#appointment-id').val(generateNewId(appointmentTableBody, 'APT'));
        populateClientSelects(); // Ensure client list is fresh
        showModal(addAppointmentModal);
    });
     logProgressBtn.on('click', function() {
        const selectedClientId = selectClientProgress.val();
        if (!selectedClientId) {
            showAlert("Please select a client first.", "Action Required");
            return;
        }
        resetForm(logProgressForm, logProgressFormFields);
        const clientName = selectClientProgress.find('option:selected').text();
        logProgressModalTitle.text(`Log Progress for ${clientName}`);
        logProgressClientIdHidden.val(selectedClientId);
        $('#log-progress-date').val(moment().format('YYYY-MM-DD')); // Pre-fill current date
        showModal(logProgressModal);
    });


    // --- Modal Close Buttons (Adapted for new modals) ---
    $('.modal .close-btn').not('.alert-modal-close, #closeLogoutModalButton').on('click', function() {
        const $modal = $(this).closest('.modal');
        if ($modal.is(addClientModal)) hideAndResetFormModal($modal, addClientForm, clientFormFields);
        else if ($modal.is(addWorkoutPlanModal)) hideAndResetFormModal($modal, addWorkoutPlanForm, workoutPlanFormFields);
        else if ($modal.is(addMealPlanModal)) hideAndResetFormModal($modal, addMealPlanForm, mealPlanFormFields);
        else if ($modal.is(addAppointmentModal)) hideAndResetFormModal($modal, addAppointmentForm, appointmentFormFields);
        else if ($modal.is(logProgressModal)) hideAndResetFormModal($modal, logProgressForm, logProgressFormFields);
        else if ($modal.is(assignPlanModal)) hideModal($modal); // Just hide, reset handled on open
        else if ($modal.is(viewDetailsModal)) hideModal($modal);
        else hideModal($modal);
    });
    
    viewDetailsOkButton.on('click', function() {
        hideModal(viewDetailsModal);
    });


    // --- Form Submissions (New forms for Coach) ---
    addClientForm.on('submit', function(e) {
        e.preventDefault();
        if (!validateForm(clientFormFields)) return;
        
        const id = $('#client-id').val();
        const fullName = $('#client-full-name').val().trim();
        const email = $('#client-email').val().trim();
        const phone = $('#client-phone').val().trim();
        const lastCheckin = $('#client-last-checkin').val();

        const newRowHtml = `<tr data-id="${id}">
            <td data-label="ID">${id}</td>
            <td data-label="Full Name">${fullName}</td>
            <td data-label="Email">${email}</td>
            <td data-label="Phone">${phone}</td>
            <td data-label="Assigned Workout">N/A</td>
            <td data-label="Assigned Meal Plan">N/A</td>
            <td data-label="Last Check-in">${lastCheckin}</td>
            <td data-label="Actions">
                <button class="btn btn-sm btn-info view-progress-btn">Progress</button>
                <button class="btn btn-sm btn-primary assign-plan-btn">Assign</button>
                <button class="btn btn-sm btn-danger">Delete</button>
            </td>
        </tr>`;
        clientTableBody.append(newRowHtml);
        clientProgressData[id] = { name: fullName, logs: [] }; // Initialize progress data store
        addResponsiveTableHeaders(); 
        populateClientSelects(); // Update dropdowns
        showAlert(`Client "${fullName}" added successfully!`, 'Success');
        addRecentActivity(`New client added: ${fullName} (${id})`);
        updateDashboardStats();
        hideAndResetFormModal(addClientModal, addClientForm, clientFormFields);
    });

    addWorkoutPlanForm.on('submit', function(e) {
        e.preventDefault();
        if (!validateForm(workoutPlanFormFields)) return;

        const id = $('#workout-plan-id').val();
        const planName = $('#workout-plan-name').val().trim();
        const type = $('#workout-plan-type').val();
        const duration = $('#workout-plan-duration').val().trim();
        const focus = $('#workout-plan-focus').val().trim();

        const newRowHtml = `<tr data-id="${id}">
            <td data-label="ID">${id}</td>
            <td data-label="Plan Name">${planName}</td>
            <td data-label="Type">${type}</td>
            <td data-label="Duration">${duration}</td>
            <td data-label="Focus">${focus.substring(0,50) + (focus.length > 50 ? '...' : '')}</td>
            <td data-label="Actions"><button class="btn btn-sm btn-info view-details-btn" data-details="${encodeURIComponent(focus)}">View</button> <button class="btn btn-sm btn-danger">Delete</button></td>
        </tr>`;
        workoutPlanTableBody.append(newRowHtml);
        addResponsiveTableHeaders();
        showAlert(`Workout Plan "${planName}" added successfully!`, 'Success');
        updateDashboardStats();
        hideAndResetFormModal(addWorkoutPlanModal, addWorkoutPlanForm, workoutPlanFormFields);
    });
    
    addMealPlanForm.on('submit', function(e) {
        e.preventDefault();
        if (!validateForm(mealPlanFormFields)) return;

        const id = $('#meal-plan-id').val();
        const planName = $('#meal-plan-name').val().trim();
        const type = $('#meal-plan-type').val();
        const calories = $('#meal-plan-calories').val().trim();
        const focus = $('#meal-plan-focus').val().trim();

        const newRowHtml = `<tr data-id="${id}">
            <td data-label="ID">${id}</td>
            <td data-label="Plan Name">${planName}</td>
            <td data-label="Type">${type}</td>
            <td data-label="Daily Calories">${calories} kcal</td>
            <td data-label="Primary Focus">${focus.substring(0,50) + (focus.length > 50 ? '...' : '')}</td>
            <td data-label="Actions"><button class="btn btn-sm btn-info view-details-btn" data-details="${encodeURIComponent(focus)}">View</button> <button class="btn btn-sm btn-danger">Delete</button></td>
        </tr>`;
        mealPlanTableBody.append(newRowHtml);
        addResponsiveTableHeaders();
        showAlert(`Meal Plan "${planName}" added successfully!`, 'Success');
        // updateDashboardStats(); // If you add a stat for meal plans
        hideAndResetFormModal(addMealPlanModal, addMealPlanForm, mealPlanFormFields);
    });

    addAppointmentForm.on('submit', function(e) {
        e.preventDefault();
        if (!validateForm(appointmentFormFields)) return;

        const id = $('#appointment-id').val();
        const clientId = $('#appointment-client').val();
        const clientName = $('#appointment-client option:selected').text();
        const date = $('#appointment-date').val();
        const time = $('#appointment-time').val();
        const formattedTime = moment(time, "HH:mm").format("hh:mm A");
        const purpose = $('#appointment-purpose').val();
        const status = $('#appointment-status').val();

        const newRowHtml = `<tr data-id="${id}">
            <td data-label="ID">${id}</td>
            <td data-label="Client Name" data-client-id="${clientId}">${clientName}</td>
            <td data-label="Date">${date}</td>
            <td data-label="Time">${formattedTime}</td>
            <td data-label="Purpose">${purpose}</td>
            <td data-label="Status">${status}</td>
            <td data-label="Actions">
                ${status === 'Pending' ? '<button class="btn btn-sm btn-primary confirm-appointment-btn">Confirm</button> ' : ''}
                ${status !== 'Completed' && status !== 'Cancelled' ? '<button class="btn btn-sm btn-success mark-done-btn">Mark Done</button> ' : ''}
                ${status !== 'Cancelled' ? '<button class="btn btn-sm btn-danger cancel-appointment-btn">Cancel</button>' : ''}
            </td>
        </tr>`;
        appointmentTableBody.append(newRowHtml);
        addResponsiveTableHeaders();
        showAlert(`Appointment for "${clientName}" on ${date} at ${formattedTime} scheduled!`, 'Success');
        addRecentActivity(`Appointment scheduled: ${clientName} - ${purpose}`);
        updateDashboardStats();
        hideAndResetFormModal(addAppointmentModal, addAppointmentForm, appointmentFormFields);
    });

    logProgressForm.on('submit', function(e) {
        e.preventDefault();
        if (!validateForm(logProgressFormFields)) return;

        const clientId = logProgressClientIdHidden.val();
        const date = $('#log-progress-date').val();
        const weight = parseFloat($('#log-progress-weight').val()) || null;
        const strength = parseFloat($('#log-progress-strength-exercise').val()) || null;
        const cardio = parseFloat($('#log-progress-cardio-metric').val()) || null;
        const notes = $('#log-progress-notes').val().trim();

        if (!clientProgressData[clientId]) {
            showAlert("Error: Client data not found for progress logging.", "Error");
            return;
        }
        
        // Add to in-memory store
        clientProgressData[clientId].logs.push({ date, weight, strength, cardio, notes });
        clientProgressData[clientId].logs.sort((a, b) => new Date(a.date) - new Date(b.date)); // Keep sorted by date

        // Update client's last check-in date on the client table
        clientTableBody.find(`tr[data-id="${clientId}"] td[data-label="Last Check-in"]`).text(date);

        showAlert("Progress logged successfully!", "Success");
        addRecentActivity(`Progress logged for ${clientProgressData[clientId].name}`);
        loadClientProgress(clientId); // Reload charts and table for this client
        updateDashboardStats();
        hideAndResetFormModal(logProgressModal, logProgressForm, logProgressFormFields);
    });
    
    assignPlanForm.on('submit', function(e) {
        e.preventDefault();
        const clientId = assignPlanClientIdHidden.val();
        const workoutPlanId = assignWorkoutPlanSelect.val();
        const mealPlanId = assignMealPlanSelect.val();

        const workoutPlanName = workoutPlanId ? $(`#workout-plan-table-body tr[data-id="${workoutPlanId}"] td[data-label="Plan Name"]`).text() : "N/A";
        const mealPlanName = mealPlanId ? $(`#meal-plan-table-body tr[data-id="${mealPlanId}"] td[data-label="Plan Name"]`).text() : "N/A";

        const $clientRow = $(`#client-table-body tr[data-id="${clientId}"]`);
        $clientRow.find('td[data-label="Assigned Workout"]').text(workoutPlanName);
        $clientRow.find('td[data-label="Assigned Meal Plan"]').text(mealPlanName);
        
        showAlert(`Plans assigned to ${$clientRow.find('td[data-label="Full Name"]').text()}.`, "Success");
        addRecentActivity(`Plans assigned to client ${clientId}.`);
        hideModal(assignPlanModal);
    });


    // --- Click Outside Modal (Adapted) ---
    $(window).on('click', function(event) {
        const $target = $(event.target);
        if ($target.is(addClientModal)) hideAndResetFormModal(addClientModal, addClientForm, clientFormFields);
        else if ($target.is(addWorkoutPlanModal)) hideAndResetFormModal(addWorkoutPlanModal, addWorkoutPlanForm, workoutPlanFormFields);
        else if ($target.is(addMealPlanModal)) hideAndResetFormModal(addMealPlanModal, addMealPlanForm, mealPlanFormFields);
        else if ($target.is(addAppointmentModal)) hideAndResetFormModal(addAppointmentModal, addAppointmentForm, appointmentFormFields);
        else if ($target.is(logProgressModal)) hideAndResetFormModal(logProgressModal, logProgressForm, logProgressFormFields);
        else if ($target.is(assignPlanModal)) hideModal(assignPlanModal);
        else if ($target.is(viewDetailsModal)) hideModal(viewDetailsModal);
        else if ($target.is(logoutModal)) hideModal(logoutModal);
        else if ($target.is(alertModal)) hideAlert();
    });

    // --- Table Action Handlers (Adapted for Coach specific actions) ---
    // Generic Delete Button
    $('.content-area').on('click', '.btn-danger', function() {
        var $button = $(this);
        if ($button.closest('#appointment-table-body').length && !$button.hasClass('cancel-appointment-btn')) {
             // This is a delete button in appointment table, but not the "Cancel" button
             // This logic handles generic delete like for clients, workout plans, meal plans
        } else if ($button.hasClass('cancel-appointment-btn')) {
            return; // Handled by specific appointment cancel logic
        }


        var $row = $(this).closest('tr');
        var id = $row.data('id');
        var itemName = $row.find('td:nth-child(2)').text().trim() || id || 'this item'; // Usually name is 2nd column
        
        let itemType = 'item';
        if ($row.closest('#client-table-body').length) itemType = 'client';
        else if ($row.closest('#workout-plan-table-body').length) itemType = 'workout plan';
        else if ($row.closest('#meal-plan-table-body').length) itemType = 'meal plan';
        else if ($row.closest('#progress-log-table-body').length) itemType = 'progress log entry';


        showAlert(`Are you sure you want to delete this ${itemType}: ${itemName}? This action cannot be undone.`, 'Confirm Deletion', true);

        alertModalOkButton.off('click').on('click', function proceedDelete() {
            hideAlert();
            const isClientRow = $row.closest('#client-table-body').length > 0;
            const isProgressLog = $row.closest('#progress-log-table-body').length > 0;
            const currentClientIdForProgress = selectClientProgress.val();

            $row.fadeOut(400, function() {
                 $(this).remove();
                 addResponsiveTableHeaders(); 
                 updateDashboardStats();
                 if (isClientRow) {
                    delete clientProgressData[id]; // Remove from progress store
                    populateClientSelects(); // Update dropdowns
                    if (selectClientProgress.val() === id) { // If deleted client was selected for progress
                        clientProgressDisplay.hide();
                        selectClientPrompt.show();
                        logProgressBtn.prop('disabled', true);
                    }
                 } else if (isProgressLog && currentClientIdForProgress) {
                     // Find and remove the log from clientProgressData
                     const logDate = $row.data('log-date'); // Assuming you add data-log-date to the row
                     if (clientProgressData[currentClientIdForProgress] && clientProgressData[currentClientIdForProgress].logs) {
                        clientProgressData[currentClientIdForProgress].logs = clientProgressData[currentClientIdForProgress].logs.filter(log => log.date !== logDate);
                        loadClientProgress(currentClientIdForProgress); // Refresh display
                     }
                 }
                 addRecentActivity(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} "${itemName}" (ID: ${id}) deleted.`);
                 showAlert(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} "${itemName}" deleted!`, 'Deletion Complete');
            });
            alertModalOkButton.off('click', proceedDelete).on('click', hideAlert); // Reset OK button
        });
        // Ensure cancel button on alert modal also resets the OK button's specific handler
        alertModalCloseButton.off('click').on('click', function cancelDelete() {
            hideAlert();
            alertModalOkButton.off('click').on('click', hideAlert); // Reset OK
            alertModalCloseButton.off('click', cancelDelete).on('click', hideAlert); // Reset Close itself
        });
        alertModal.off('click').on('click', function(event) { // Click outside alert
             if ($(event.target).is(alertModal)) {
                  hideAlert();
                  alertModalOkButton.off('click').on('click', hideAlert);
                  alertModalCloseButton.off('click').on('click', hideAlert);
                  alertModal.off('click').on('click', function(e) {if ($(e.target).is(alertModal)) hideAlert();});
             }
         });
    });
    
    // Client Table Specific Buttons
    clientTableBody.on('click', '.view-progress-btn', function() {
        const $row = $(this).closest('tr');
        const clientId = $row.data('id');
        // Navigate to progress tab and select this client
        $('.sidebar-nav .nav-link[data-target="progress-content"]').click();
        selectClientProgress.val(clientId).trigger('change');
    });

    clientTableBody.on('click', '.assign-plan-btn', function() {
        const $row = $(this).closest('tr');
        const clientId = $row.data('id');
        const clientName = $row.find('td[data-label="Full Name"]').text();

        assignPlanClientIdHidden.val(clientId);
        assignPlanClientName.text(clientName);
        
        // Populate and set current assigned plans
        populatePlanSelects();
        const currentWorkout = $row.find('td[data-label="Assigned Workout"]').text();
        const currentMeal = $row.find('td[data-label="Assigned Meal Plan"]').text();

        assignWorkoutPlanSelect.find('option').filter(function() {
            return $(this).text() === currentWorkout;
        }).prop('selected', true);
        
        assignMealPlanSelect.find('option').filter(function() {
            return $(this).text() === currentMeal;
        }).prop('selected', true);

        showModal(assignPlanModal);
    });

    // Workout/Meal Plan Table View Details
    $('#workouts-content, #meals-content').on('click', '.view-details-btn', function() {
        const $row = $(this).closest('tr');
        const planName = $row.find('td[data-label="Plan Name"]').text();
        let details = decodeURIComponent($(this).data('details') || "No additional details provided.");
        
        // Basic formatting for newlines
        details = details.replace(/\n/g, '<br>');

        viewDetailsTitle.text(`Details for: ${planName}`);
        viewDetailsBody.html(`<p>${details}</p>`);
        showModal(viewDetailsModal);
    });


    // Appointment Table Specific Buttons
    appointmentTableBody.on('click', '.confirm-appointment-btn', function() {
        const $button = $(this);
        const $row = $button.closest('tr');
        $row.find('td[data-label="Status"]').text('Confirmed').css('color', 'var(--success)');
        $button.replaceWith('<button class="btn btn-sm btn-success mark-done-btn">Mark Done</button>');
        addRecentActivity(`Appointment ID ${$row.data('id')} confirmed.`);
        updateDashboardStats();
    });
    appointmentTableBody.on('click', '.mark-done-btn', function() {
        const $button = $(this);
        const $row = $button.closest('tr');
        $row.find('td[data-label="Status"]').text('Completed').css('color', 'var(--secondary-text)'); // A more neutral color for completed
        $row.find('td[data-label="Actions"]').html('<span style="color: var(--secondary-text);">Done</span>');
        addRecentActivity(`Appointment ID ${$row.data('id')} marked as done.`);
        updateDashboardStats();
    });
    appointmentTableBody.on('click', '.cancel-appointment-btn', function() {
        var $row = $(this).closest('tr');
        var appointmentId = $row.data('id');
        var clientName = $row.find('td[data-label="Client Name"]').text();

        showAlert(`Are you sure you want to cancel the appointment for ${clientName} (ID: ${appointmentId})?`, 'Confirm Cancellation', true);
        
        alertModalOkButton.off('click').on('click', function() {
            hideAlert();
            $row.find('td[data-label="Status"]').text('Cancelled').css('color', 'var(--danger)');
            $row.find('td[data-label="Actions"]').html('<span style="color: var(--danger);">Cancelled</span>');
            addRecentActivity(`Appointment ID ${appointmentId} cancelled.`);
            updateDashboardStats();
            alertModalOkButton.off('click').on('click', hideAlert); // Reset
        });
         alertModalCloseButton.off('click').on('click', function() {
            hideAlert();
            alertModalOkButton.off('click').on('click', hideAlert);
            alertModalCloseButton.off('click').on('click', hideAlert);
        });
        alertModal.off('click').on('click', function(event) {
             if ($(event.target).is(alertModal)) {
                  hideAlert();
                  alertModalOkButton.off('click').on('click', hideAlert);
                  alertModalCloseButton.off('click').on('click', hideAlert);
                  alertModal.off('click').on('click', function(e) {if ($(e.target).is(alertModal)) hideAlert();});
             }
         });
    });


    // --- Progress Tracking Section Logic ---
    selectClientProgress.on('change', function() {
        const clientId = $(this).val();
        if (clientId) {
            loadClientProgress(clientId);
            logProgressBtn.prop('disabled', false);
            clientProgressDisplay.fadeIn();
            selectClientPrompt.hide();
        } else {
            logProgressBtn.prop('disabled', true);
            clientProgressDisplay.hide();
            selectClientPrompt.show();
            if (weightChartInstance) weightChartInstance.destroy();
            if (strengthChartInstance) strengthChartInstance.destroy();
            if (cardioChartInstance) cardioChartInstance.destroy();
        }
    });

    function loadClientProgress(clientId) {
        const data = clientProgressData[clientId];
        if (!data) {
            progressClientNameDisplay.text("No data for this client.");
            progressLogTableBody.empty().append('<tr><td colspan="4" style="text-align:center;">No logs found.</td></tr>');
            if (weightChartInstance) weightChartInstance.destroy();
            if (strengthChartInstance) strengthChartInstance.destroy();
            if (cardioChartInstance) cardioChartInstance.destroy();
            return;
        }

        progressClientNameDisplay.text(`Progress for: ${data.name}`);
        
        // Populate log table
        progressLogTableBody.empty();
        if (data.logs && data.logs.length > 0) {
            data.logs.forEach(log => {
                const rowHtml = `<tr data-id="log-${clientId}-${log.date}" data-log-date="${log.date}">
                    <td data-label="Date">${log.date}</td>
                    <td data-label="Weight (kg)">${log.weight !== null ? log.weight : 'N/A'}</td>
                    <td data-label="Notes">${log.notes || 'N/A'}</td>
                    <td data-label="Actions"><button class="btn btn-sm btn-danger">Delete</button></td>
                </tr>`;
                progressLogTableBody.append(rowHtml);
            });
        } else {
            progressLogTableBody.append('<tr><td colspan="4" style="text-align:center;">No logs found for this client.</td></tr>');
        }
        addResponsiveTableHeaders();

        // Prepare chart data
        const labels = data.logs.map(log => log.date);
        const weightData = data.logs.map(log => log.weight);
        const strengthData = data.logs.map(log => log.strength); // Assuming 'strength' is bench press kg
        const cardioData = data.logs.map(log => log.cardio); // Assuming 'cardio' is run duration min

        initializeProgressCharts(labels, weightData, strengthData, cardioData);
    }

    function initializeProgressCharts(labels, weightSet, strengthSet, cardioSet) {
        if (typeof Chart === 'undefined') { console.error("Chart.js is not loaded."); return; }

        if (weightChartInstance) weightChartInstance.destroy();
        if (strengthChartInstance) strengthChartInstance.destroy();
        if (cardioChartInstance) cardioChartInstance.destroy();

        const weightCtx = document.getElementById('weightTrendChart')?.getContext('2d');
        const strengthCtx = document.getElementById('strengthChart')?.getContext('2d');
        const cardioCtx = document.getElementById('cardioChart')?.getContext('2d');

        if (!weightCtx || !strengthCtx || !cardioCtx) {
             console.warn("One or more progress chart canvas elements not found.");
             return;
        }

        const rootStyles = getComputedStyle(document.documentElement);
        const goldColor = rootStyles.getPropertyValue('--main-color').trim() || '#FFD700';
        const goldLightColor = rootStyles.getPropertyValue('--gold-light').trim() || '#FFEC8B';
        const infoColor = rootStyles.getPropertyValue('--info').trim() || '#16a085';
        const textColor = rootStyles.getPropertyValue('--primary-text').trim() || '#ecf0f1';
        const gridBorderColor = rootStyles.getPropertyValue('--border-color').trim() || '#444';
        const fontFamily = 'Poppins, sans-serif';

        const commonLineChartOptions = (titleText) => ({
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: false, grid: { color: gridBorderColor }, ticks: { color: textColor, font: { family: fontFamily } } },
                x: { 
                    type: 'time', 
                    time: { unit: 'day', tooltipFormat: 'MMM D, YYYY', displayFormats: { day: 'MMM D'}},
                    grid: { display: true, color: gridBorderColor }, 
                    ticks: { color: textColor, font: { family: fontFamily }, autoSkip: true, maxTicksLimit: 7 } 
                }
            },
            plugins: {
                legend: { display: false },
                title: { display: false, text: titleText, color: textColor, font: { family: fontFamily, size: 14 }},
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)', titleColor: goldColor, bodyColor: textColor,
                    displayColors: false, bodyFont: { family: fontFamily }, titleFont: { family: fontFamily }
                }
            },
            animation: { duration: 800, easing: 'easeInOutQuad' }
        });

        if (labels.length > 0) {
            weightChartInstance = new Chart(weightCtx, {
                type: 'line',
                data: { labels: labels, datasets: [{ label: 'Weight (kg)', data: weightSet, borderColor: goldColor, backgroundColor: 'rgba(255, 215, 0, 0.2)', tension: 0.1, fill: false, pointRadius: 4, pointHoverRadius: 6 }] },
                options: commonLineChartOptions('Weight Trend (kg)')
            });
            strengthChartInstance = new Chart(strengthCtx, {
                type: 'line',
                data: { labels: labels, datasets: [{ label: 'Bench Press (kg)', data: strengthSet, borderColor: goldLightColor, backgroundColor: 'rgba(255, 236, 139, 0.2)', tension: 0.1, fill: false, pointRadius: 4, pointHoverRadius: 6 }] },
                options: commonLineChartOptions('Strength: Bench Press (kg)')
            });
            cardioChartInstance = new Chart(cardioCtx, {
                type: 'line',
                data: { labels: labels, datasets: [{ label: 'Run Duration (min)', data: cardioSet, borderColor: infoColor, backgroundColor: 'rgba(22, 160, 133, 0.2)', tension: 0.1, fill: false, pointRadius: 4, pointHoverRadius: 6 }] },
                options: commonLineChartOptions('Cardio: Run Duration (min)')
            });
        } else {
            // Optionally display a message on canvas if no data
            [weightCtx, strengthCtx, cardioCtx].forEach(ctx => {
                if (ctx) {
                    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                    ctx.fillStyle = textColor;
                    ctx.textAlign = 'center';
                    ctx.font = `14px ${fontFamily}`;
                    ctx.fillText('No data to display.', ctx.canvas.width / 2, ctx.canvas.height / 2);
                }
            });
        }
    }

    // --- Search Functionality (Reused) ---
    function handleContentSearch(inputId, tableBodySelector, searchColumns) {
        const $searchInput = $(inputId);
        const $tableBody = $(tableBodySelector);
        if (!$searchInput.length || !$tableBody.length) return;

        $searchInput.on('keyup', function() {
            const searchTerm = $(this).val().trim().toLowerCase();
            $tableBody.find('tr').each(function() {
                const $row = $(this);
                let match = false;
                if (searchTerm === '') match = true;
                else {
                    for (const col of searchColumns) {
                        const cellText = $row.find(`td[data-label="${col}"]`).text().trim().toLowerCase();
                        if (cellText.includes(searchTerm)) { match = true; break; }
                    }
                }
                $row.toggle(match);
            });
        });
    }

    // --- Responsive Table Headers (Reused) ---
    function addResponsiveTableHeaders() {
        $('table').each(function() {
            var $table = $(this);
            var $headerCells = $table.find('thead th');
            if ($headerCells.length === 0) return;
            $table.find('tbody tr').each(function() {
                const $row = $(this);
                $row.find('td').each(function(index) {
                    if ($headerCells.eq(index).length) {
                         const newLabel = $headerCells.eq(index).text().trim();
                         if ($(this).attr('data-label') !== newLabel) $(this).attr('data-label', newLabel);
                    }
                });
            });
        });
    }

    // --- Initial Page Load Setup ---
    addResponsiveTableHeaders();
    populateClientSelects(); // Populate client dropdowns on load
    updateDashboardStats(); 
    addRecentActivity("Coach dashboard loaded.");

    handleContentSearch('#client-search-input', '#client-table-body', ['Full Name', 'Email', 'Phone', 'ID']);
    handleContentSearch('#workout-search-input', '#workout-plan-table-body', ['Plan Name', 'Type', 'Focus']);
    handleContentSearch('#meal-plan-search-input', '#meal-plan-table-body', ['Plan Name', 'Type', 'Primary Focus']);
    handleContentSearch('#appointment-search-input', '#appointment-table-body', ['Client Name', 'Date', 'Purpose', 'Status']);

    const initialActiveLink = $('.sidebar-nav .nav-link.active').first();
    let initialTargetId = (initialActiveLink.length && initialActiveLink.data('target')) ? initialActiveLink.data('target') : 'dashboard-content';
    const $initialTargetSection = $('#' + initialTargetId);

    if ($initialTargetSection.length) {
        $('.sidebar-nav .nav-link').removeClass('active');
        $contentSections.removeClass('active');
        $initialTargetSection.addClass('active');
        $(`.sidebar-nav .nav-link[data-target="${initialTargetId}"]`).addClass('active');
        $pageTitle.text($(`.sidebar-nav .nav-link[data-target="${initialTargetId}"]`).find('.nav-text').text().trim() || 'Dashboard');
        if (initialTargetId === 'progress-content') {
            // Client selection will trigger chart load
        }
    } else {
        $('#dashboard-content').addClass('active');
        $('.sidebar-nav .nav-link[data-target="dashboard-content"]').addClass('active');
        $pageTitle.text('Dashboard');
    }
});