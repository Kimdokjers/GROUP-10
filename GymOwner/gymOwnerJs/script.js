$(document).ready(function() {

    // --- Element Caching & Initial Checks ---
    const $sidebarLinks = $('.sidebar-nav .nav-link');
    const $contentSections = $('.content-section');
    const $pageTitle = $('#page-title');

    // Modals
    const logoutModal = $('#logoutConfirmationModal');
    const alertModal = $('#alertModal'); // General Alert Modal
    const addUserModal = $('#add-user-modal');
    const addCoachModal = $('#add-coach-modal');

    // Modal Content Elements
    const logoutLink = $('#logout-link');
    const closeLogoutModalButton = $('#closeLogoutModalButton');
    const cancelLogoutButton = $('#cancelLogoutButton');
    const okLogoutButton = $('#okLogoutButton');

    const alertModalTitle = $('#alertModalTitle');
    const alertModalMessage = $('#alertModalMessage');
    const alertModalOkButton = $('#alertModalOkButton');
    const alertModalCloseButton = $('#alertModal .alert-modal-close');

    // Add Forms & Tables
    const addUserForm = $('#add-user-form');
    const userTableBody = $('#users-content table tbody');
    const addCoachForm = $('#add-coach-form');
    const coachTableBody = $('#staff-content table tbody');
    const paymentTableBody = $('#payments-content table tbody'); // Added Payment Table Body

    // Add Buttons
    const addUserBtnInSection = $('#users-content').find('.add-btn');
    const addCoachBtnInSection = $('#staff-content').find('.add-btn');

    // Search/Filter Elements
    const userSearchInput = $('#user-search-id');
    const userSearchBtn = $('#user-search-btn');
    const staffSearchInput = $('#staff-search-id');
    const staffSearchBtn = $('#staff-search-btn');
    const paymentSearchPidInput = $('#payment-search-pid'); // New
    const paymentSearchYearInput = $('#payment-search-year'); // New
    const paymentFilterBtn = $('#payment-filter-btn'); // New

    // Chart Instances
    let trendsChartInstance = null, newUserChartInstance = null, membershipTypeChartInstance = null;

    // --- Helper Functions ---
    function showAlert(message, title = 'Notification') {
        if (!alertModal.length || !alertModalMessage.length || !alertModalTitle.length) {
            console.error("Alert modal elements not found! Fallback to native alert.");
            alert(message); return;
        }
        alertModalTitle.text(title);
        alertModalMessage.text(message);
        $('.modal.show').not(alertModal).removeClass('show');
        alertModal.addClass('show');
    }
    function hideAlert() { if (alertModal.length) alertModal.removeClass('show'); }
    function showModal($modal) { /* ... (same as before) ... */
        if ($modal && $modal.length) {
            $('.modal.show').not($modal).removeClass('show');
            $modal.addClass('show');
            $modal.find('form input:not([type="hidden"])').first().focus();
        } else {
            console.error("Modal element not found to show.");
            showAlert("Error: Could not open the requested window.", "UI Error");
        }
    }
    function hideModal($modal) { /* ... (same as before) ... */
        if ($modal && $modal.length) $modal.removeClass('show');
    }
    function hideAndResetFormModal($modal, $form) { /* ... (same as before) ... */
        hideModal($modal);
        if ($form && $form.length) {
            try { $form[0].reset(); }
            catch (e) { console.error("Error resetting form:", $modal.attr('id'), e); }
        }
    }
    function applyDataLabels($rows) { /* ... (same as before) ... */
        $rows.each(function() {
            var $row = $(this);
            var $table = $row.closest('table');
            var $headerCells = $table.find('thead th');
            if ($headerCells.length === 0) return;

            $row.find('td').each(function(index) {
                if ($headerCells.eq(index).length) {
                    $(this).attr('data-label', $headerCells.eq(index).text());
                }
            });
            if (!$row.attr('data-id') && $row.find('td').first().length) {
               $row.attr('data-id', $row.find('td').first().text().trim());
            }
        });
    }


    // --- Event Handlers ---

    // General Alert Modal Closing
    if (alertModalOkButton.length) alertModalOkButton.on('click', hideAlert);
    if (alertModalCloseButton.length) alertModalCloseButton.on('click', hideAlert);
    if (alertModal.length) alertModal.on('click', (event) => { if ($(event.target).is(alertModal)) hideAlert(); });

    // Logout Modal Handling
    if (logoutLink.length && logoutModal.length) { /* ... (same as before) ... */
        logoutLink.on('click', function(e) { e.preventDefault(); showModal(logoutModal); });
        if (cancelLogoutButton.length) cancelLogoutButton.on('click', () => hideModal(logoutModal));
        if (closeLogoutModalButton.length) closeLogoutModalButton.on('click', () => hideModal(logoutModal));
        logoutModal.on('click', (event) => { if ($(event.target).is(logoutModal)) hideModal(logoutModal); });
        if (okLogoutButton.length) okLogoutButton.on('click', function() {
            const originalHref = logoutLink.attr('href'); hideModal(logoutModal);
            if (originalHref) { window.location.href = originalHref; }
            else { showAlert("Error: Logout destination missing.", "Logout Error"); }
        });
    } else { console.warn("Logout elements missing."); }

    // Sidebar Navigation
    if ($sidebarLinks.length && $contentSections.length && $pageTitle.length) { /* ... (same as before) ... */
        $sidebarLinks.on('click', function(e) {
            const $this = $(this); if ($this.is('#logout-link')) return;
            e.preventDefault(); const targetId = $this.data('target'); const $targetSection = $('#' + targetId);
            if (targetId && $targetSection.length) {
                if (!$this.hasClass('active')) {
                    $sidebarLinks.removeClass('active'); $this.addClass('active');
                    $contentSections.removeClass('active'); $targetSection.addClass('active');
                    const titleText = $this.find('.nav-text').text().trim();
                    $pageTitle.text(titleText || 'Gym Owner Dashboard');
                    if (targetId === 'analytics-content') { setTimeout(initializeAnalyticsCharts, 50); }
                }
            } else {
                const linkText = $this.find('.nav-text').text().trim();
                showAlert(`Content for "${linkText}" could not be found.`, "Navigation Error");
            }
        });
    } else { console.error("Core navigation elements missing!"); }

    // --- "Add" Button Click Handlers ---
    function setupAddButtonHandler(buttonSelector, modalElement) { /* ... (same as before) ... */
        if (buttonSelector.length && modalElement.length) {
             buttonSelector.off('click').on('click', function() { showModal(modalElement); });
        } else {
             console.warn(`Add button or modal not found for selector targeting ${modalElement.attr('id') || 'unknown modal'}.`);
        }
    }
    setupAddButtonHandler(addUserBtnInSection, addUserModal);
    setupAddButtonHandler(addCoachBtnInSection, addCoachModal);

    // Add/Edit Modal Close Buttons
    $('.modal .close-btn').not('.alert-modal-close, #closeLogoutModalButton').on('click', function() { /* ... (same as before) ... */
        const $modal = $(this).closest('.modal'); const $form = $modal.find('form');
        hideAndResetFormModal($modal, $form);
    });

    // --- Form Submissions ---
    // Add User Form
    if (addUserForm.length && userTableBody.length) { /* ... (same as before, uses showAlert) ... */
        addUserForm.on('submit', function(e) {
            e.preventDefault();
            if (this.checkValidity() === false) { showAlert('Please fill out all required user fields correctly.', 'Validation Error'); $(this).find(':invalid').first().focus(); return; }
            var userId = $('#member-id').val().trim(); var userName = $('#member-name').val().trim(); var userEmail = $('#email').val().trim(); var membership = $('#membership').val().trim(); var status = $('#status').val().trim();
            if (userTableBody.find(`tr[data-id="${userId}"]`).length > 0) { showAlert(`User with ID "${userId}" already exists.`, 'Duplicate Entry'); return; }
            var newRowHtml = `<tr data-id="${userId}"><td data-label="ID">${userId}</td><td data-label="Name">${userName}</td><td data-label="Email">${userEmail}</td><td data-label="Membership">${membership}</td><td data-label="Status">${status}</td><td data-label="Actions"><button class="btn btn-sm btn-danger">Delete</button></td></tr>`;
            const $newRow = $(newRowHtml); userTableBody.append($newRow); applyDataLabels($newRow);
            showAlert(`User "${userName}" added successfully!`, 'Success');
            hideAndResetFormModal(addUserModal, addUserForm);
        });
    }
    // Add Coach Form
    if (addCoachForm.length && coachTableBody.length) { /* ... (same as before, uses showAlert) ... */
        addCoachForm.on('submit', function(e) {
            e.preventDefault();
            if (this.checkValidity() === false) { showAlert('Please fill out all required staff fields correctly.', 'Validation Error'); $(this).find(':invalid').first().focus(); return; }
            var coachId = $('#coach-id').val().trim(); var coachName = $('#coach-name').val().trim(); var coachRole = $('#coach-role').val().trim(); var coachEmail = $('#coach-email').val().trim();
            if (coachTableBody.find(`tr[data-id="${coachId}"]`).length > 0) { showAlert(`Staff with ID "${coachId}" already exists.`, 'Duplicate Entry'); return; }
            var newRowHtml = `<tr data-id="${coachId}"><td data-label="ID">${coachId}</td><td data-label="Name">${coachName}</td><td data-label="Role">${coachRole}</td><td data-label="Email">${coachEmail}</td><td data-label="Actions"><button class="btn btn-sm btn-danger">Delete</button></td></tr>`;
            const $newRow = $(newRowHtml); coachTableBody.append($newRow); applyDataLabels($newRow);
            showAlert(`Staff "${coachName}" added successfully!`, 'Success');
            hideAndResetFormModal(addCoachModal, addCoachForm);
        });
    }

    // Window Click for Modal Closing (Background Click)
    $(window).on('click', function(event) { /* ... (same as before) ... */
        const $target = $(event.target);
        if ($target.is(addUserModal)) hideAndResetFormModal(addUserModal, addUserForm);
        else if ($target.is(addCoachModal)) hideAndResetFormModal(addCoachModal, addCoachForm);
        else if ($target.is(logoutModal)) hideModal(logoutModal);
        else if ($target.is(alertModal)) hideAlert();
    });

    // --- Table & Activity Action Buttons (Using Event Delegation) ---
    // Delete Button (User or Staff)
    $('.content-area').on('click', '.btn-danger', function() { /* ... (same as before, uses showAlert) ... */
        var $row = $(this).closest('tr'); var itemName = $row.find('td[data-label="Name"]').text().trim() || 'this item';
        showAlert(`Simulating deletion of ${itemName}...`);
        setTimeout(() => { $row.fadeOut(300, function() { $(this).remove(); }); showAlert(`${itemName} deleted (Simulation)!`, 'Deletion Complete'); }, 800);
    });
    // Refund Button (Payments Table)
    $('.content-area').on('click', '#payments-content .btn-info', function() { /* ... (same as before, uses showAlert) ... */
        var $row = $(this).closest('tr'); var userName = $row.find('td[data-label="User Name"]').text().trim() || 'selected payment';
        showAlert(`Refund action triggered for ${userName} (Simulation).`, 'Payment Action');
    });
    // Accept Payment Button (Payments Table)
    $('.content-area').on('click', '#payments-content .accept-payment-btn', function() { /* ... (same as before, uses showAlert) ... */
        var $button = $(this); var $row = $button.closest('tr'); var paymentId = $row.data('id'); var userName = $button.data('user-name') || 'selected payment';
        showAlert(`Accepting payment for ${userName} (Simulation)...`, 'Payment Action');
        $row.find('td[data-label="Status"]').text('Completed').css('color', 'var(--success)'); $button.replaceWith('<span class="text-muted">Accepted</span>');
        $(`.recent-activity .accept-payment-btn[data-payment-id="${paymentId}"]`).text('Accepted').prop('disabled', true).removeClass('btn-success').addClass('btn-secondary disabled');
    });
    // Accept Payment Button (Recent Activity)
    $('.recent-activity').on('click', '.accept-payment-btn:not(:disabled)', function() { /* ... (same as before, uses showAlert) ... */
        var $button = $(this); var paymentId = $button.data('payment-id'); var userName = $button.data('user-name') || 'selected payment';
        showAlert(`Payment ${paymentId} for ${userName} accepted from Recent Activity (Simulation)!`, 'Payment Accepted');
        $button.text('Accepted').prop('disabled', true).removeClass('btn-success').addClass('btn-secondary disabled');
        const $paymentRow = $(`#payments-content table tbody tr[data-id="${paymentId}"]`);
        if ($paymentRow.length && $paymentRow.find('td[data-label="Status"]').text().trim() === 'Pending') {
            $paymentRow.find('td[data-label="Status"]').text('Completed').css('color', 'var(--success)');
            $paymentRow.find('.accept-payment-btn').replaceWith('<span class="text-muted">Accepted</span>');
        }
    });

    // --- Search/Filter Functionality ---

    // Generic Table Filter (ID Column)
     function filterTableById(inputId, tableBodySelector) {
        var searchTerm = $(inputId).val().toLowerCase().trim();
        var $tableBody = $(tableBodySelector);
        var $rows = $tableBody.find('tr');
        var $noResultsRow = $tableBody.find('.no-results-row');
        var matchFound = false;

        if ($noResultsRow.length > 0) $noResultsRow.hide();

        $rows.each(function() {
            var $row = $(this);
            if ($row.hasClass('no-results-row')) return;
            // Assumes first column is ID
            var cellText = $row.find('td:first-child').text().toLowerCase();
            if (cellText.includes(searchTerm)) {
                $row.show();
                matchFound = true;
            } else {
                $row.hide();
            }
        });

        if (!matchFound && searchTerm !== '') {
            if ($noResultsRow.length === 0) {
                var colspan = $tableBody.closest('table').find('thead th').length;
                 $tableBody.append('<tr class="no-results-row"><td colspan="' + colspan + '" style="text-align:center; padding: 20px; color: #888;">No matching IDs found.</td></tr>');
            } else {
                $noResultsRow.show();
            }
        } else if ($noResultsRow.length > 0) {
             $noResultsRow.hide();
        }
    }

    // User Search
    if(userSearchBtn.length && userSearchInput.length) {
        userSearchBtn.on('click', () => filterTableById('#user-search-id', '#users-content table tbody'));
        userSearchInput.on('keyup', (e) => { // Trigger on Enter or clear
            if (e.key === 'Enter' || userSearchInput.val().trim() === '') {
                filterTableById('#user-search-id', '#users-content table tbody');
            }
        });
    }

    // Staff Search
    if(staffSearchBtn.length && staffSearchInput.length) {
        staffSearchBtn.on('click', () => filterTableById('#staff-search-id', '#staff-content table tbody'));
        staffSearchInput.on('keyup', (e) => { // Trigger on Enter or clear
             if (e.key === 'Enter' || staffSearchInput.val().trim() === '') {
                filterTableById('#staff-search-id', '#staff-content table tbody');
            }
        });
    }

    // --- NEW: Payment Filter Logic ---
    function filterPaymentTable() {
        const pidSearchTerm = paymentSearchPidInput.val().toLowerCase().trim();
        const yearSearchTerm = paymentSearchYearInput.val().trim(); // Get year as string
        var $rows = paymentTableBody.find('tr');
        var $noResultsRow = paymentTableBody.find('.no-results-row');
        var matchFound = false;

        if ($noResultsRow.length > 0) $noResultsRow.hide();

        $rows.each(function() {
            var $row = $(this);
            if ($row.hasClass('no-results-row')) return; // Skip no results row

            const paymentId = $row.find('td[data-label="Payment ID"]').text().toLowerCase();
            const dateText = $row.find('td[data-label="Date"]').text(); // e.g., "2023-10-26"
            const paymentYear = dateText.substring(0, 4); // Extract year part

            let pidMatch = true; // Assume match initially
            let yearMatch = true; // Assume match initially

            // Check Payment ID if search term exists
            if (pidSearchTerm !== '' && !paymentId.includes(pidSearchTerm)) {
                pidMatch = false;
            }

            // Check Year if search term exists and is a valid 4-digit year
            if (yearSearchTerm !== '' && /^\d{4}$/.test(yearSearchTerm) && paymentYear !== yearSearchTerm) {
                yearMatch = false;
            } else if (yearSearchTerm !== '' && !/^\d{4}$/.test(yearSearchTerm)) {
                // If year input is invalid but not empty, treat as no match
                yearMatch = false;
            }


            // Show row only if *both* conditions (if active) are met
            if (pidMatch && yearMatch) {
                $row.show();
                matchFound = true;
            } else {
                $row.hide();
            }
        });

        // Handle "No results" message for payments
        if (!matchFound && (pidSearchTerm !== '' || yearSearchTerm !== '')) {
             if ($noResultsRow.length === 0) {
                var colspan = paymentTableBody.closest('table').find('thead th').length;
                 paymentTableBody.append('<tr class="no-results-row"><td colspan="' + colspan + '" style="text-align:center; padding: 20px; color: #888;">No matching payments found.</td></tr>');
            } else {
                $noResultsRow.show();
            }
        } else if ($noResultsRow.length > 0) {
             $noResultsRow.hide();
        }
    }

    // Payment Filter Event Listener
    if(paymentFilterBtn.length) {
        paymentFilterBtn.on('click', filterPaymentTable);
        // Optional: Trigger filter on Enter key press in either input
        paymentSearchPidInput.add(paymentSearchYearInput).on('keyup', function(e) {
            if (e.key === 'Enter') {
                filterPaymentTable();
            }
        });
    }


    // --- Analytics Charts ---
    function initializeAnalyticsCharts() { /* ... (same chart code as before) ... */
         if (typeof Chart === 'undefined') { console.error("Chart.js is not loaded."); return; }
         if (trendsChartInstance) trendsChartInstance.destroy(); if (newUserChartInstance) newUserChartInstance.destroy(); if (membershipTypeChartInstance) membershipTypeChartInstance.destroy();
         trendsChartInstance = null; newUserChartInstance = null; membershipTypeChartInstance = null;
         const trendsCtx = document.getElementById('trendsChart')?.getContext('2d'); const newUserCtx = document.getElementById('newUserChart')?.getContext('2d'); const membershipTypeCtx = document.getElementById('membershipTypeChart')?.getContext('2d');
         if (!trendsCtx && !newUserCtx && !membershipTypeCtx) { console.warn("No chart canvas elements found."); return; }
        try {
            const goldColor = getComputedStyle(document.documentElement).getPropertyValue('--gold', '#f0c44c').trim(); const goldLightColor = getComputedStyle(document.documentElement).getPropertyValue('--gold-light', '#febd14').trim(); const goldLighterColor = getComputedStyle(document.documentElement).getPropertyValue('--gold-lighter', '#fece43').trim(); const goldLightestColor = getComputedStyle(document.documentElement).getPropertyValue('--gold-lightest', '#feda75').trim(); const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color', '#555').trim(); const textColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-text', '#ecf0f1').trim(); const darkGrayColor = getComputedStyle(document.documentElement).getPropertyValue('--dark-gray', '#333').trim(); const fontFamily = 'Poppins, sans-serif';
            const commonChartOptions = { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, grid: { color: borderColor }, ticks: { color: textColor, padding: 10, font: { family: fontFamily} } }, x: { grid: { display: false }, ticks: { color: textColor, padding: 10, font: { family: fontFamily} } } }, plugins: { legend: { labels: { color: textColor, padding: 20, font: { family: fontFamily} } }, tooltip: { backgroundColor: 'rgba(0, 0, 0, 0.8)', titleColor: goldColor, bodyColor: textColor, padding: 10, displayColors: false, bodyFont: { family: fontFamily }, titleFont: { family: fontFamily } } }, animation: { duration: 800, easing: 'easeInOutQuad' }};
            const doughnutOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: textColor, padding: 15, font: { family: fontFamily} } }, tooltip: { backgroundColor: 'rgba(0, 0, 0, 0.8)', titleColor: goldColor, bodyColor: textColor, padding: 10, displayColors: true, bodyFont: { family: fontFamily }, titleFont: { family: fontFamily } } }, animation: { animateRotate: true, animateScale: true, duration: 1000 }};
            if (trendsCtx) { trendsChartInstance = new Chart(trendsCtx, { type: 'line', data: { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'], datasets: [{ label: 'Active Members', data: [650, 700, 800, 810, 850, 900, 980], borderColor: goldColor, backgroundColor: goldLightColor, tension: 0.3, pointRadius: 3, pointHoverRadius: 6, pointBackgroundColor: goldColor }] }, options: commonChartOptions }); }
            if (newUserCtx) { newUserChartInstance = new Chart(newUserCtx, { type: 'bar', data: { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'], datasets: [{ label: 'New Users', data: [15, 20, 30, 25, 40, 35, 50], backgroundColor: goldLighterColor, borderColor: goldColor, borderWidth: 1, borderRadius: 4 }] }, options: { ...commonChartOptions, plugins: { legend: { display: false }, tooltip: { ...commonChartOptions.plugins.tooltip } } } }); }
            if (membershipTypeCtx) { membershipTypeChartInstance = new Chart(membershipTypeCtx, { type: 'doughnut', data: { labels: ['Premium', 'Basic', 'Student', 'Corporate'], datasets: [{ label: 'Membership Distribution', data: [450, 300, 150, 80], backgroundColor: [ goldColor, goldLightColor, goldLighterColor, goldLightestColor ], borderColor: darkGrayColor, borderWidth: 2, hoverOffset: 8 }] }, options: doughnutOptions }); }
        } catch (error) { console.error("Error initializing charts:", error); showAlert("Error displaying charts.", "Chart Error"); }
    }

    // --- Initial Setup Calls ---
    applyDataLabels($('table tbody tr')); // Apply labels on load

    // Set initial active state
    const initialActiveLink = $('.sidebar-nav .nav-link.active').first();
    let initialTargetId = 'dashboard-content'; if (initialActiveLink.length) initialTargetId = initialActiveLink.data('target') || 'dashboard-content'; const $initialTargetSection = $('#' + initialTargetId);
    if ($initialTargetSection.length) {
         $('.sidebar-nav .nav-link').removeClass('active'); $contentSections.removeClass('active'); $initialTargetSection.addClass('active');
         $(`.sidebar-nav .nav-link[data-target="${initialTargetId}"]`).addClass('active');
         const initialTitle = $(`.sidebar-nav .nav-link[data-target="${initialTargetId}"]`).find('.nav-text').text().trim();
         $pageTitle.text(initialTitle || 'Dashboard');
         if (initialTargetId === 'analytics-content') { setTimeout(initializeAnalyticsCharts, 150); }
    } else {
         console.warn(`Initial target #${initialTargetId} not found. Defaulting.`);
         $('.sidebar-nav .nav-link, .content-section').removeClass('active'); $('#dashboard-content').addClass('active'); $('.sidebar-nav .nav-link[data-target="dashboard-content"]').addClass('active'); $pageTitle.text('Dashboard');
    }

});