$(document).ready(function() {

    const $sidebarLinks = $('.sidebar-nav .nav-link');
    const $contentSections = $('.content-section');
    const $pageTitle = $('#page-title');

    const logoutModal = $('#logoutConfirmationModal');
    const alertModal = $('#alertModal');
    const addGymModal = $('#add-gym-modal');
    const addUserModal = $('#add-user-modal');
    const addCoachModal = $('#add-coach-modal');

    const logoutLink = $('#logout-link');
    const closeLogoutModalButton = $('#closeLogoutModalButton');
    const cancelLogoutButton = $('#cancelLogoutButton');
    const okLogoutButton = $('#okLogoutButton');

    const alertModalTitle = $('#alertModalTitle');
    const alertModalMessage = $('#alertModalMessage');
    const alertModalOkButton = $('#alertModalOkButton');
    const alertModalCloseButton = $('#alertModal .alert-modal-close');

    const addGymForm = $('#add-gym-form');
    const gymTableBody = $('#gyms-content table tbody');
    const addUserForm = $('#add-user-form');
    const userTableBody = $('#users-content table tbody');
    const addCoachForm = $('#add-coach-form');
    const coachTableBody = $('#staff-content table tbody');

    const addGymBtnInSection = $('#gyms-content').find('.add-btn');
    const addUserBtnInSection = $('#users-content').find('.add-btn');
    const addCoachBtnInSection = $('#staff-content').find('.add-btn');

    let trendsChartInstance = null, newUserChartInstance = null, newGymChartInstance = null;

    function showAlert(message, title = 'Notification') {
        if (!alertModal.length || !alertModalMessage.length || !alertModalTitle.length) {
            console.error("Alert modal elements not found! Fallback to native alert.");
            alert(message);
            return;
        }
        alertModalTitle.text(title);
        alertModalMessage.text(message);
        $('.modal.show').not(alertModal).removeClass('show');
        alertModal.addClass('show');
    }

    function hideAlert() {
        if (alertModal.length) {
            alertModal.removeClass('show');
        }
    }

    function showModal($modal) {
        if ($modal && $modal.length) {
            $('.modal.show').not($modal).removeClass('show');
            $modal.addClass('show');
             $modal.find('form input:not([type="hidden"])').first().focus();
        } else {
            console.error("Modal element not found to show:", $modal);
            showAlert("Error: Could not open the requested window.", "UI Error");
        }
    }

    function hideModal($modal) {
        if ($modal && $modal.length) {
            $modal.removeClass('show');
        }
    }

    function hideAndResetFormModal($modal, $form) {
        hideModal($modal);
        if ($form && $form.length) {
            try {
                $form[0].reset();
                $form.find('.is-invalid').removeClass('is-invalid');
            } catch (e) {
                console.error("Error resetting form:", $modal.attr('id'), e);
            }
        }
    }

    function addResponsiveTableHeaders() {
        $('table').each(function() {
            var $table = $(this);
            var $headerCells = $table.find('thead th');
            if ($headerCells.length === 0) return;

            $table.find('tbody tr').each(function() {
                const $row = $(this);
                $row.find('td').each(function(index) {
                    if ($headerCells.eq(index).length) {
                        const currentLabel = $(this).attr('data-label');
                        const newLabel = $headerCells.eq(index).text();
                        if (currentLabel !== newLabel) {
                             $(this).attr('data-label', newLabel);
                        }
                    }
                });
                 if (!$row.attr('data-id') && $row.find('td').first().length) {
                    $row.attr('data-id', $row.find('td').first().text().trim());
                 }
            });
        });
    }

    if (alertModalOkButton.length) alertModalOkButton.on('click', hideAlert);
    if (alertModalCloseButton.length) alertModalCloseButton.on('click', hideAlert);
    if (alertModal.length) alertModal.on('click', function(event) {
        if ($(event.target).is(alertModal)) {
            hideAlert();
        }
    });

    if (logoutLink.length && logoutModal.length) {
        logoutLink.on('click', function(e) {
            e.preventDefault();
            showModal(logoutModal);
        });
        if (cancelLogoutButton.length) cancelLogoutButton.on('click', () => hideModal(logoutModal));
        if (closeLogoutModalButton.length) closeLogoutModalButton.on('click', () => hideModal(logoutModal));
        logoutModal.on('click', (event) => { if ($(event.target).is(logoutModal)) hideModal(logoutModal); });
        if (okLogoutButton.length) okLogoutButton.on('click', function() {
            const originalHref = logoutLink.attr('href');
            hideModal(logoutModal);
            if (originalHref) {
                window.location.href = originalHref;
            } else {
                showAlert("Error: Logout destination missing.", "Logout Error");
            }
        });
    } else {
        console.warn("Logout elements missing.");
    }

    if ($sidebarLinks.length && $contentSections.length && $pageTitle.length) {
        $sidebarLinks.on('click', function(e) {
            const $this = $(this);
            if ($this.is('#logout-link')) return;

            e.preventDefault();
            const targetId = $this.data('target');
            const $targetSection = $('#' + targetId);

            if (targetId && $targetSection.length) {
                if (!$this.hasClass('active')) {
                    $sidebarLinks.removeClass('active');
                    $this.addClass('active');
                    $contentSections.removeClass('active');
                    $targetSection.addClass('active');

                    const titleText = $this.find('.nav-text').text().trim();
                    $pageTitle.text(titleText || 'Admin Dashboard');

                    if (targetId === 'analytics-content') {
                        setTimeout(initializeAnalyticsCharts, 50);
                    }
                }
            } else {
                console.error(`Navigation target #${targetId} not found.`);
                const linkText = $this.find('.nav-text').text().trim();
                showAlert(`Content for "${linkText}" could not be found.`, "Navigation Error");
            }
        });
    } else {
        console.error("Core navigation elements missing!");
    }

    function setupAddButtonHandler(buttonSelector, modalElement) {
        if (buttonSelector.length && modalElement.length) {
             buttonSelector.off('click').on('click', function() {
                showModal(modalElement);
            });
        } else {
             console.warn(`Add button or modal element not found for selector targeting ${modalElement.attr('id') || 'unknown modal'}.`);
        }
    }

    setupAddButtonHandler(addGymBtnInSection, addGymModal);
    setupAddButtonHandler(addUserBtnInSection, addUserModal);
    setupAddButtonHandler(addCoachBtnInSection, addCoachModal);

    $('.modal .close-btn').not('.alert-modal-close, #closeLogoutModalButton').on('click', function() {
        const $modal = $(this).closest('.modal');
        const $form = $modal.find('form');
        hideAndResetFormModal($modal, $form);
    });


    if (addGymForm.length && gymTableBody.length) {
        addGymForm.on('submit', function(e) {
            e.preventDefault();
            if (this.checkValidity() === false) {
                showAlert('Please fill out all required gym fields correctly.', 'Validation Error');
                $(this).find(':invalid').first().focus();
                return;
            }
            var gymId = $('#gym-id').val().trim();
            var gymName = $('#gym-name').val().trim();
            var gymLocation = $('#gym-location').val().trim();
            var gymManager = $('#gym-manager').val().trim();
            var gymCapacity = $('#gym-capacity').val().trim();

            if (gymTableBody.find(`tr[data-id="${gymId}"]`).length > 0) {
                 showAlert(`Gym with ID "${gymId}" already exists.`, 'Duplicate Entry');
                 return;
            }
            var newRowHtml = `<tr data-id="${gymId}"><td data-label="ID">${gymId}</td><td data-label="Name">${gymName}</td><td data-label="Location">${gymLocation}</td><td data-label="Manager">${gymManager}</td><td data-label="Capacity">${gymCapacity}</td><td data-label="Actions"><button class="btn btn-sm btn-danger">Delete</button></td></tr>`;
            gymTableBody.append(newRowHtml);
            addResponsiveTableHeaders();
            showAlert(`Gym "${gymName}" added successfully!`, 'Success');
            hideAndResetFormModal(addGymModal, addGymForm);
        });
    }

    if (addUserForm.length && userTableBody.length) {
        addUserForm.on('submit', function(e) {
            e.preventDefault();
             if (this.checkValidity() === false) {
                 showAlert('Please fill out all required user fields correctly.', 'Validation Error');
                 $(this).find(':invalid').first().focus();
                 return;
             }
            var userId = $('#member-id').val().trim();
            var userName = $('#member-name').val().trim();
            var userEmail = $('#email').val().trim();
            var membership = $('#membership').val().trim();
            var status = $('#status').val().trim();

             if (userTableBody.find(`tr[data-id="${userId}"]`).length > 0) {
                 showAlert(`User with ID "${userId}" already exists.`, 'Duplicate Entry');
                 return;
            }
            var newRowHtml = `<tr data-id="${userId}"><td data-label="ID">${userId}</td><td data-label="Name">${userName}</td><td data-label="Email">${userEmail}</td><td data-label="Membership">${membership}</td><td data-label="Status">${status}</td><td data-label="Actions"><button class="btn btn-sm btn-danger">Delete</button></td></tr>`;
            userTableBody.append(newRowHtml);
            addResponsiveTableHeaders();
            showAlert(`User "${userName}" added successfully!`, 'Success');
            hideAndResetFormModal(addUserModal, addUserForm);
        });
    }

    if (addCoachForm.length && coachTableBody.length) {
        addCoachForm.on('submit', function(e) {
            e.preventDefault();
             if (this.checkValidity() === false) {
                 showAlert('Please fill out all required staff fields correctly.', 'Validation Error');
                 $(this).find(':invalid').first().focus();
                 return;
             }
            var coachId = $('#coach-id').val().trim();
            var coachName = $('#coach-name').val().trim();
            var coachRole = $('#coach-role').val().trim();
            var coachEmail = $('#coach-email').val().trim();
            var coachBranch = $('#coach-branch').val().trim();

             if (coachTableBody.find(`tr[data-id="${coachId}"]`).length > 0) {
                 showAlert(`Staff with ID "${coachId}" already exists.`, 'Duplicate Entry');
                 return;
            }
            var newRowHtml = `<tr data-id="${coachId}"><td data-label="ID">${coachId}</td><td data-label="Name">${coachName}</td><td data-label="Role">${coachRole}</td><td data-label="Email">${coachEmail}</td><td data-label="Gym Branch">${coachBranch}</td><td data-label="Actions"><button class="btn btn-sm btn-danger">Delete</button></td></tr>`;
            coachTableBody.append(newRowHtml);
            addResponsiveTableHeaders();
            showAlert(`Staff "${coachName}" added successfully!`, 'Success');
            hideAndResetFormModal(addCoachModal, addCoachForm);
        });
    }

    $(window).on('click', function(event) {
        const $target = $(event.target);
        if ($target.is(addGymModal)) hideAndResetFormModal(addGymModal, addGymForm);
        else if ($target.is(addUserModal)) hideAndResetFormModal(addUserModal, addUserForm);
        else if ($target.is(addCoachModal)) hideAndResetFormModal(addCoachModal, addCoachForm);
        else if ($target.is(logoutModal)) hideModal(logoutModal);
        else if ($target.is(alertModal)) hideAlert();
    });

    $('.content-area').on('click', '.btn-danger', function() {
        var $row = $(this).closest('tr');
        var itemName = $row.find('td[data-label="Name"]').text().trim() || 'this item';
        showAlert(`Deleting ${itemName}... (Simulation)`);
        setTimeout(() => {
            $row.remove();
            showAlert(`${itemName} deleted (Simulation)!`, 'Deletion Complete');
        }, 800);
    });

    $('.content-area').on('click', '.btn-info', function() {
        var $row = $(this).closest('tr');
        var userName = $row.find('td[data-label="User Name"]').text().trim() || 'selected payment';
        showAlert(`Refund action triggered for ${userName} (Simulation).`, 'Payment Action');
    });

    $('.content-area').on('click', '.btn-success', function() {
        var $button = $(this);
        var $row = $button.closest('tr');
        var userName = $row.find('td[data-label="User Name"]').text().trim() || 'selected payment';
        showAlert(`Marking payment for ${userName} as Paid (Simulation)...`, 'Payment Action');
        $row.find('td[data-label="Status"]').text('Completed').css('color', 'var(--success)');
        $button.remove();
    });

    function initializeAnalyticsCharts() {
         if (typeof Chart === 'undefined') { console.error("Chart.js is not loaded."); return; }
         if (trendsChartInstance) trendsChartInstance.destroy();
         if (newUserChartInstance) newUserChartInstance.destroy();
         if (newGymChartInstance) newGymChartInstance.destroy();
         trendsChartInstance = null; newUserChartInstance = null; newGymChartInstance = null;

         const trendsCtx = document.getElementById('trendsChart')?.getContext('2d');
         const newUserCtx = document.getElementById('newUserChart')?.getContext('2d');
         const newGymCtx = document.getElementById('newGymChart')?.getContext('2d');
         if (!trendsCtx && !newUserCtx && !newGymCtx) { console.warn("No chart canvas elements found."); return; }

        try {
            const goldColor = getComputedStyle(document.documentElement).getPropertyValue('--main-color', '#FFD700').trim();
            const goldLightColor = '#FFEC8B'; const textColor = '#ecf0f1';
            const borderColor = '#444'; const darkGrayColor = '#343a40';
            const fontFamily = 'Poppins, sans-serif';

             const commonChartOptions = { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, grid: { color: borderColor }, ticks: { color: textColor, font: { family: fontFamily } } }, x: { grid: { display: false }, ticks: { color: textColor, font: { family: fontFamily } } } }, plugins: { legend: { labels: { color: textColor, font: { family: fontFamily } } }, tooltip: { backgroundColor: 'rgba(0, 0, 0, 0.8)', titleColor: goldColor, bodyColor: textColor, displayColors: false, bodyFont: { family: fontFamily }, titleFont: { family: fontFamily } } }, animation: { duration: 800, easing: 'easeInOutQuad' }};
             const doughnutOptions = { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { color: textColor, font: { family: fontFamily } } }, tooltip: { backgroundColor: 'rgba(0, 0, 0, 0.8)', titleColor: goldColor, bodyColor: textColor, displayColors: true, bodyFont: { family: fontFamily }, titleFont: { family: fontFamily } } }, animation: { animateRotate: true, animateScale: true, duration: 1000 }};

            if (trendsCtx) { trendsChartInstance = new Chart(trendsCtx, { type: 'line', data: { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'], datasets: [{ label: 'Active Members', data: [650, 700, 800, 810, 850, 900, 980], borderColor: goldColor, backgroundColor: 'rgba(255, 215, 0, 0.2)', tension: 0.3, pointRadius: 3, pointHoverRadius: 6, fill: true }] }, options: commonChartOptions }); }
            if (newUserCtx) { newUserChartInstance = new Chart(newUserCtx, { type: 'bar', data: { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'], datasets: [{ label: 'New Users', data: [15, 20, 30, 25, 40, 35, 50], backgroundColor: goldLightColor, borderColor: goldColor, borderWidth: 1, borderRadius: 4 }] }, options: commonChartOptions }); }
            if (newGymCtx) { newGymChartInstance = new Chart(newGymCtx, { type: 'doughnut', data: { labels: ['Downtown', 'Uptown', 'Westside', 'Eastside'], datasets: [{ label: 'Gyms by Region', data: [5, 4, 6, 3], backgroundColor: [ goldColor, goldLightColor, '#E6BE8A', '#D4AC0D' ], borderColor: darkGrayColor, borderWidth: 2, hoverOffset: 8, hoverBorderColor: textColor }] }, options: doughnutOptions }); }
        } catch (error) { console.error("Error initializing charts:", error); showAlert("An error occurred while displaying analytics charts.", "Chart Error"); }
    }

    function handleContentSearch(inputId, buttonId, itemType, tableBodySelector) {
        const $searchInput = $(inputId);
        const $searchButton = $(buttonId);
        const $tableBody = $(tableBodySelector);

        if ($searchInput.length && $searchButton.length && $tableBody.length) {
            const searchHandler = function() {
                const searchTerm = $searchInput.val().trim().toLowerCase();
                let itemsFound = 0;

                $tableBody.find('tr').each(function() {
                    const $row = $(this);
                    let rowText = '';
                    $row.find('td[data-label]').each(function() {
                        if ($(this).data('label') !== 'Actions') {
                            rowText += $(this).text().toLowerCase() + ' ';
                        }
                    });


                    if (rowText.includes(searchTerm)) {
                        $row.show();
                        itemsFound++;
                    } else {
                        $row.hide();
                    }
                });

                if (itemsFound === 0 && searchTerm !== '') {
                     showAlert(`No ${itemType} found matching "${$searchInput.val().trim()}".`, 'Search Results');
                } else if (searchTerm === '') {
                }
            };

            $searchButton.on('click', searchHandler);

            $searchInput.on('keyup', function(e) {
                 searchHandler();
            });

        } else {
            console.warn(`Search elements not found for ${itemType} content section.`);
            if(!$tableBody.length) console.warn(`Table body not found using selector: ${tableBodySelector}`);
        }
    }

    handleContentSearch('#user-search-input', '#user-search-btn', 'Users', '#users-content table tbody');
    handleContentSearch('#staff-search-input', '#staff-search-btn', 'Staff', '#staff-content table tbody');
    handleContentSearch('#gym-search-input', '#gym-search-btn', 'Gyms', '#gyms-content table tbody');
    handleContentSearch('#payment-search-input', '#payment-search-btn', 'Payments', '#payments-content table tbody'); 

    addResponsiveTableHeaders();

    const initialActiveLink = $('.sidebar-nav .nav-link.active').first();
    let initialTargetId = 'dashboard-content';
    if (initialActiveLink.length) {
        initialTargetId = initialActiveLink.data('target') || 'dashboard-content';
    }
    const $initialTargetSection = $('#' + initialTargetId);
    if ($initialTargetSection.length) {
         $('.sidebar-nav .nav-link').removeClass('active');
         $contentSections.removeClass('active');
         $initialTargetSection.addClass('active');
         $(`.sidebar-nav .nav-link[data-target="${initialTargetId}"]`).addClass('active');
         const initialTitle = $(`.sidebar-nav .nav-link[data-target="${initialTargetId}"]`).find('.nav-text').text().trim();
         $pageTitle.text(initialTitle || 'Dashboard');
         if (initialTargetId === 'analytics-content') {
             setTimeout(initializeAnalyticsCharts, 150);
         }
    } else {
         console.warn(`Initial target section #${initialTargetId} not found. Defaulting to dashboard.`);
         $('.sidebar-nav .nav-link').removeClass('active');
         $contentSections.removeClass('active');
         $('#dashboard-content').addClass('active');
         $('.sidebar-nav .nav-link[data-target="dashboard-content"]').addClass('active');
         $pageTitle.text('Dashboard');
    }

});