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
    const userTableBody = $('#user-table-body'); // Needed for membership chart

    const addCoachModal = $('#add-coach-modal');
    const addCoachForm = $('#add-coach-form');
    const coachTableBody = $('#coach-table-body');

    const alertModalTitle = $('#alertModalTitle');
    const alertModalMessage = $('#alertModalMessage');
    const alertModalOkButton = $('#alertModalOkButton');
    const alertModalCloseButton = $('#alertModal .alert-modal-close');

    const headerLogoutLink = $('#header-logout-link');

    let trendsChartInstance = null, newUserChartInstance = null, membershipDistChartInstance = null; // Renamed for clarity

    // --- Recent Activity & Stats ---
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

    function calculateTotalRevenue() {
        let totalRevenue = 0;
        $('#payment-table-body tr').each(function() {
            const amountText = $(this).find('td[data-label="Amount"]').text().replace('$', '').replace(',', '');
            const amount = parseFloat(amountText);
            if (!isNaN(amount)) {
                totalRevenue += amount;
            }
        });
        return '$' + totalRevenue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }


    function updateDashboardStats() {
        $('#total-users-stat').text(userTableBody.find('tr').length);
        $('#active-members-stat').text(userTableBody.find('tr td[data-label="Status"]:contains("Active")').length);
        $('#total-revenue-stat').text(calculateTotalRevenue());
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
                    if (!isNaN(num) && num > maxIdNum) {
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
    ];

    // --- Generic Form Reset ---
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

    // --- Generic Form Validation ---
    function validateForm(fieldsToValidate) {
        let isFormValid = true;
        let firstInvalidField = null;

        fieldsToValidate.forEach(field => {
            const $input = field.input;
            const $errorDiv = $('#' + field.errorId);
            const value = $input.val() ? $input.val().trim() : "";
            let errorMessage = '';

            if (field.required && value === '') {
                errorMessage = `${field.name} is required.`;
            } else if (value !== '' && field.isEmail) {
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailPattern.test(value)) {
                    errorMessage = `Please enter a valid ${field.name.toLowerCase()} address.`;
                }
            } else if (value !== '' && field.isNumber) {
                 const numValue = parseFloat(value);
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
            if (isConfirmation) return confirm(message);
            else alert(message);
            return;
        }
        alertModalTitle.text(title);
        alertModalMessage.text(message);
        alertModalOkButton.off('click').on('click', hideAlert);
        $('.modal.show').not(alertModal).removeClass('show');
        alertModal.addClass('show');
    }
    function hideAlert() { if (alertModal.length) alertModal.removeClass('show'); }

    // --- Modal Show/Hide Functions ---
     function showModal($modal) {
        if ($modal && $modal.length) {
            $('.modal.show').not($modal).removeClass('show');
            $modal.addClass('show');
            $modal.find('form input:not([readonly]):not([disabled]):not([type="hidden"]), form select:not([readonly]):not([disabled]), form button:not([disabled])').first().focus();
        } else {
            console.error("Modal element not found to show:", $modal);
            showAlert("Error: Could not open the requested window.", "UI Error");
        }
    }
    function hideModal($modal) { if ($modal && $modal.length) $modal.removeClass('show'); }

    function hideAndResetFormModal($modal, formElement, fieldsToValidate) {
        hideModal($modal);
        resetForm(formElement, fieldsToValidate);
    }

    // --- Event Listeners for Modals, Navigation, etc. ---
    if (alertModalOkButton.length) alertModalOkButton.on('click', hideAlert);
    if (alertModalCloseButton.length) alertModalCloseButton.on('click', hideAlert);
    alertModal.on('click', function(event) { if ($(event.target).is(alertModal)) hideAlert(); });

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
            addRecentActivity("Admin logged out.");
             setTimeout(() => {
                window.location.href = headerLogoutLink.attr('href');
             }, 100);
        });
    } else {
        console.warn("Header logout link or logout modal not found.");
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
                $pageTitle.text($this.find('.nav-text').text().trim() || 'Admin Dashboard');
                if (targetId === 'analytics-content') {
                    setTimeout(initializeAnalyticsCharts, 250);
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

    // --- Modal Close Buttons ---
    $('.modal .close-btn').not('.alert-modal-close, #closeLogoutModalButton').on('click', function() {
        const $modal = $(this).closest('.modal');
        if ($modal.is(addUserModal)) hideAndResetFormModal($modal, addUserForm, userFormFields);
        else if ($modal.is(addCoachModal)) hideAndResetFormModal($modal, addCoachForm, coachFormFields);
        else hideModal($modal);
    });

    // --- Form Submissions ---
    addUserForm.on('submit', function(e) {
        e.preventDefault();
        if (!validateForm(userFormFields)) return;
        const id = $('#user-id').val();
        const firstName = $('#user-first-name').val().trim();
        const lastName = $('#user-last-name').val().trim();
        const suffix = $('#user-suffix').val().trim();
        const email = $('#user-email').val().trim();
        const membership = $('#user-membership').val();
        const status = $('#user-status').val();

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
        addResponsiveTableHeaders();
        showAlert(`User "${firstName} ${lastName}" added successfully!`, 'Success');
        addRecentActivity(`New user added: ${firstName} ${lastName} (${id})`);
        updateDashboardStats();
        if ($('#analytics-content').hasClass('active')) { // If analytics is visible, update charts
            initializeAnalyticsCharts();
        }
        hideAndResetFormModal(addUserModal, addUserForm, userFormFields);
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

        const newRowHtml = `<tr data-id="${id}">
            <td data-label="ID">${id}</td>
            <td data-label="First Name">${firstName}</td>
            <td data-label="Last Name">${lastName}</td>
            <td data-label="Suffix">${suffix}</td>
            <td data-label="Role">${role}</td>
            <td data-label="Email">${email}</td>
            <td data-label="Actions"><button class="btn btn-sm btn-danger">Delete</button></td>
        </tr>`;
        coachTableBody.append(newRowHtml);
        addResponsiveTableHeaders();
        showAlert(`Staff "${firstName} ${lastName}" added successfully!`, 'Success');
        addRecentActivity(`New staff added: ${firstName} ${lastName} (${id})`);
        updateDashboardStats();
        hideAndResetFormModal(addCoachModal, addCoachForm, coachFormFields);
    });

    // --- Click Outside Modal ---
    $(window).on('click', function(event) {
        const $target = $(event.target);
        if ($target.is(addUserModal)) hideAndResetFormModal(addUserModal, addUserForm, userFormFields);
        else if ($target.is(addCoachModal)) hideAndResetFormModal(addCoachModal, addCoachForm, coachFormFields);
        else if ($target.is(logoutModal)) hideModal(logoutModal);
        else if ($target.is(alertModal)) hideAlert();
    });

    // --- Table Action Handlers ---
    $('.content-area').on('click', '.btn-danger', function() {
        var $row = $(this).closest('tr');
        var id = $row.data('id');
        var nameCell = $row.find('td[data-label="Name"], td[data-label="First Name"]').first();
        var itemName = nameCell.text().trim() || id || 'this item';

        if (nameCell.data('label') === "First Name") {
            const lastName = $row.find('td[data-label="Last Name"]').text().trim();
            const suffix = $row.find('td[data-label="Suffix"]').text().trim();
            itemName = `${itemName} ${lastName}${suffix ? ' ' + suffix : ''}`;
        }

        showAlert(`Are you sure you want to delete ${itemName.trim()}? This action cannot be undone.`, 'Confirm Deletion', true);

        alertModalOkButton.off('click').on('click', function proceedDelete() {
            hideAlert();
            const isUserRow = $row.closest('#user-table-body').length > 0; // Check if it's a user row
            $row.fadeOut(400, function() {
                 $(this).remove();
                 addResponsiveTableHeaders();
                 updateDashboardStats();
                 if (isUserRow && $('#analytics-content').hasClass('active')) { // If user deleted and analytics visible
                     initializeAnalyticsCharts();
                 }
                 addRecentActivity(`${itemName.trim()} (ID: ${id}) deleted.`);
                 showAlert(`${itemName.trim()} deleted!`, 'Deletion Complete');
            });
             alertModalOkButton.off('click', proceedDelete).on('click', hideAlert);
        });
         alertModalCloseButton.off('click').on('click', function cancelDelete() {
              hideAlert();
              alertModalOkButton.off('click').on('click', hideAlert);
              alertModalCloseButton.off('click', cancelDelete).on('click', hideAlert);
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

    $('.content-area').on('click', '.btn-info', function() {
         var $row = $(this).closest('tr');
         var paymentId = $row.data('id') || $row.find('td[data-label="Payment ID"]').text();
         showAlert(`Initiating refund process for Payment ID: ${paymentId}.`, 'Refund Action');
    });
    $('.content-area').on('click', '.btn-success', function() {
         var $button = $(this);
         var $row = $button.closest('tr');
         var paymentId = $row.data('id') || $row.find('td[data-label="Payment ID"]').text();
         showAlert(`Marking payment ${paymentId} as Paid...`, 'Payment Action');
         $row.find('td[data-label="Status"]').text('Completed').css('color', 'var(--success)');
         $button.remove();
         addRecentActivity(`Payment ${paymentId} marked as Paid.`);
         updateDashboardStats();
    });

    // --- Initialize Analytics Charts ---
    function initializeAnalyticsCharts() {
        if (typeof Chart === 'undefined') { console.error("Chart.js is not loaded."); return; }

        if (trendsChartInstance) trendsChartInstance.destroy();
        if (newUserChartInstance) newUserChartInstance.destroy();
        if (membershipDistChartInstance) membershipDistChartInstance.destroy(); // Use new name
        trendsChartInstance = null; newUserChartInstance = null; membershipDistChartInstance = null;

        const trendsCtx = document.getElementById('trendsChart')?.getContext('2d');
        const newUserCtx = document.getElementById('newUserChart')?.getContext('2d');
        const membershipDistCtx = document.getElementById('gymPopularityChart')?.getContext('2d'); // Canvas ID remains gymPopularityChart

        if (!trendsCtx || !newUserCtx || !membershipDistCtx) {
             console.warn("One or more chart canvas elements not found. Analytics may be incomplete.");
             if (!$('#analytics-content').hasClass('active')) {
                console.warn("Analytics section is not active. Charts might not initialize correctly if canvas elements are hidden.");
             }
             return;
        }

        const rootStyles = getComputedStyle(document.documentElement);
        const goldColor = rootStyles.getPropertyValue('--main-color').trim() || '#FFD700';
        const goldLightColor = rootStyles.getPropertyValue('--gold-light').trim() || '#FFEC8B';
        const textColor = rootStyles.getPropertyValue('--primary-text').trim() || '#ecf0f1';
        const gridBorderColor = rootStyles.getPropertyValue('--border-color').trim() || '#444';
        const doughnutBorderColor = rootStyles.getPropertyValue('--dark-gray').trim() || '#333333';
        const fontFamily = 'Poppins, sans-serif';

        const commonChartOptions = (type = 'bar') => ({
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: gridBorderColor }, ticks: { color: textColor, font: { family: fontFamily } } },
                x: { grid: { display: type === 'line', color: gridBorderColor }, ticks: { color: textColor, font: { family: fontFamily } } }
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
                     displayColors: true,
                      callbacks: { // UPDATED CALLBACK FOR COUNTS
                        label: function(context) {
                            let label = context.label || '';
                            if (label) { label += ': '; }
                            if (context.parsed !== null) {
                                const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) + '%' : '0%';
                                label += `${context.formattedValue} (${percentage})`; // Shows count and percentage
                            }
                            return label;
                        }
                    },
                     bodyFont: { family: fontFamily }, titleFont: { family: fontFamily }
                }
            },
            animation: { animateRotate: true, animateScale: true, duration: 1000 }
        };

        trendsChartInstance = new Chart(trendsCtx, {
            type: 'line',
            data: {
                labels: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                datasets: [{
                    label: 'Premium Members',
                    data: [45, 50, 55, 65, 70, 75],
                    borderColor: goldColor, backgroundColor: 'rgba(255, 215, 0, 0.2)', tension: 0.3, fill: true
                }, {
                    label: 'Basic Members',
                    data: [80, 81, 85, 90, 98, 105],
                    borderColor: goldLightColor, backgroundColor: 'rgba(255, 236, 139, 0.2)', tension: 0.3, fill: true
                }]
            },
            options: commonChartOptions('line')
        });

        newUserChartInstance = new Chart(newUserCtx, {
            type: 'bar',
            data: {
                labels: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                datasets: [{
                    label: 'New Users',
                    data: [30, 25, 40, 35, 50, 48],
                    backgroundColor: goldColor, borderColor: goldColor, borderWidth: 1, borderRadius: 4
                }]
            },
            options: commonChartOptions('bar')
        });

        // Membership Distribution Chart (Doughnut) - NEW DATA SOURCE
        let premiumMembersCount = 0;
        let basicMembersCount = 0;
        userTableBody.find('tr').each(function() {
            const membershipType = $(this).find('td[data-label="Membership"]').text().trim();
            if (membershipType === 'Premium') {
                premiumMembersCount++;
            } else if (membershipType === 'Basic') {
                basicMembersCount++;
            }
        });

        const membershipTypesLabels = ['Premium Members', 'Basic Members'];
        const membershipTypesData = [premiumMembersCount, basicMembersCount];

        if (premiumMembersCount === 0 && basicMembersCount === 0) { // Handle no members
             membershipTypesLabels.push("No Member Data");
             membershipTypesData.push(1); // Placeholder to render chart
        }

        membershipDistChartInstance = new Chart(membershipDistCtx, { // Use new instance name
            type: 'doughnut',
            data: {
                labels: membershipTypesLabels,
                datasets: [{
                    label: 'Membership Types', // Updated dataset label
                    data: membershipTypesData,
                    backgroundColor: [goldColor, goldLightColor, '#E6BE8A'], // Adjusted colors for potentially 2 types
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
                    match = true;
                } else {
                    for (const col of searchColumns) {
                        const cellText = $row.find(`td[data-label="${col}"]`).text().trim().toLowerCase();
                        if (cellText.includes(searchTerm)) {
                            match = true;
                            break;
                        }
                    }
                }
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
                    if ($headerCells.eq(index).length) {
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
    addResponsiveTableHeaders();
    updateDashboardStats();
    addRecentActivity("Gym Owner dashboard loaded.");

    handleContentSearch('#user-search-input', '#user-table-body', ['First Name', 'Last Name', 'Email', 'ID', 'Membership']);
    handleContentSearch('#staff-search-input', '#coach-table-body', ['First Name', 'Last Name', 'Email', 'ID', 'Role']);
    handleContentSearch('#payment-search-input', '#payment-table-body', ['User Name', 'User ID', 'Payment ID', 'Method', 'Status']);

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
            setTimeout(initializeAnalyticsCharts, 250);
        }
    } else {
        $('#dashboard-content').addClass('active');
        $('.sidebar-nav .nav-link[data-target="dashboard-content"]').addClass('active');
        $pageTitle.text('Dashboard');
    }

});