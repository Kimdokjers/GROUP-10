$(document).ready(function() {

    // --- Existing Logout Confirmation ---
    const logoutButton = document.getElementById('logout-link');
    if (logoutButton) {
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            const userIsSure = window.confirm("Are you sure you want to log out?");
            if (userIsSure) {
                window.location.href = this.href;
            }
        });
    }

    // --- Existing Sidebar Navigation ---
    $('.sidebar-nav .nav-link').on('click', function(e) {
        e.preventDefault();
        var targetId = $(this).data('target');
        if (targetId) {
            $('.sidebar-nav .nav-link').removeClass('active');
            $(this).addClass('active');
            $('.content-section').removeClass('active');
            $('#' + targetId).addClass('active');
            // Correctly get text excluding the icon's text content
            var titleText = $(this).find('.nav-text').text().trim();
            $('#page-title').text(titleText);

            if (targetId === 'analytics-content' && !window.chartsInitialized) { // Prevent re-initialization
                initializeAnalyticsCharts();
                window.chartsInitialized = true; // Flag to track initialization
            }
        }
    });

    // --- Remove Gym Modal Logic ---
    // (Delete all code related to addGymModal, addGymBtnInSection, addGymForm, gymTableBody)
    // Example: Search for "addGymModal", "addGymBtnInSection", "addGymForm", "gymTableBody" and remove those blocks.


    // --- Add User Modal Logic (Keep as is) ---
    var addUserModal = $('#add-user-modal');
    var addUserBtnInSection = $('#users-content button.add-btn'); // Ensure selector targets button within correct section
    var addUserForm = $('#add-user-form');
    var userTableBody = $('#users-content table tbody');

    function showAddUserModal() {
        addUserModal.show();
    }

    function hideAndResetUserModal() {
        addUserModal.hide();
        addUserForm[0].reset();
    }

    addUserBtnInSection.on('click', showAddUserModal);
    addUserModal.find('.close-btn').on('click', hideAndResetUserModal);

    addUserForm.on('submit', function(e) {
        e.preventDefault();
        var userId = $('#member-id').val().trim();
        var userName = $('#member-name').val().trim();
        var userEmail = $('#email').val().trim();
        var membership = $('#membership').val().trim();
        var status = $('#status').val().trim();

        if (!userId || !userName || !userEmail || !membership || !status) {
            alert('Please fill out all member fields.');
            return;
        }

         var newRowHtml = `
            <tr>
                <td data-label="ID">${userId}</td>
                <td data-label="Name">${userName}</td>
                <td data-label="Email">${userEmail}</td>
                <td data-label="Membership">${membership}</td>
                <td data-label="Status">${status}</td>
                <td data-label="Actions">
                    <button class="btn btn-sm btn-danger">Delete</button>
                </td>
            </tr>
        `;
        userTableBody.append(newRowHtml);
        alert(`User "${userName}" added successfully!`);
        hideAndResetUserModal();
        // Re-apply data-labels to the new row for responsiveness
        applyDataLabels(userTableBody.find('tr:last-child'));
    });

    // --- Add Coach/Staff Modal Logic (Modified) ---
    var addCoachModal = $('#add-coach-modal');
    var addCoachBtnInSection = $('#staff-content button.add-btn'); // Ensure selector targets button within correct section
    var addCoachForm = $('#add-coach-form');
    var coachTableBody = $('#staff-content table tbody');

    function showAddCoachModal() {
        addCoachModal.show();
    }

    function hideAndResetCoachModal() {
        addCoachModal.hide();
        addCoachForm[0].reset();
    }

    addCoachBtnInSection.on('click', showAddCoachModal);
    addCoachModal.find('.close-btn').on('click', hideAndResetCoachModal);

    addCoachForm.on('submit', function(e) {
        e.preventDefault();
        var coachId = $('#coach-id').val().trim();
        var coachName = $('#coach-name').val().trim();
        var coachRole = $('#coach-role').val().trim();
        var coachEmail = $('#coach-email').val().trim();
        // Removed coachBranch

        // Updated validation
        if (!coachId || !coachName || !coachRole || !coachEmail) {
            alert('Please fill out all coach/staff fields.');
            return;
        }

        // Updated HTML Row (Removed Gym Branch column)
        var newRowHtml = `
            <tr>
                <td data-label="ID">${coachId}</td>
                <td data-label="Name">${coachName}</td>
                <td data-label="Role">${coachRole}</td>
                <td data-label="Email">${coachEmail}</td>
                <td data-label="Actions">
                    <button class="btn btn-sm btn-danger">Delete</button>
                </td>
            </tr>
        `;
        coachTableBody.append(newRowHtml);
        alert(`Coach/Staff "${coachName}" added successfully!`);
        hideAndResetCoachModal();
         // Re-apply data-labels to the new row for responsiveness
        applyDataLabels(coachTableBody.find('tr:last-child'));
    });

    // --- Existing Modal Close on Window Click ---
    $(window).on('click', function(event) {
        // Removed condition for addGymModal
        if ($(event.target).is(addUserModal)) {
            hideAndResetUserModal();
        }
        if ($(event.target).is(addCoachModal)) {
             hideAndResetCoachModal();
        }
    });

    // --- Existing Delete Button Logic ---
    $('.content-area').on('click', '.btn-danger', function() {
        if (confirm('Are you sure you want to delete this item?')) {
            $(this).closest('tr').fadeOut(300, function() { $(this).remove(); }); // Added fade out
            alert('Item deleted (Simulation)!');
        }
    });

     // --- Existing Payment Action Buttons Logic (Modified 'Mark as Paid' text) ---
     $('.content-area').on('click', '#payments-content .btn-info', function() { // Specific to payments table
         alert('Refund Action (Simulation)');
         // Add actual refund logic here if needed
     });

     $('.content-area').on('click', '#payments-content .btn-success', function() { // Specific to payments table 'Accept Payment' button
         alert('Payment Accepted (Simulation)');
         var $row = $(this).closest('tr');
         $row.find('td[data-label="Status"]').text('Completed');
         $(this).replaceWith('<span class="text-muted">Accepted</span>'); // Replace button with text
          // Potentially update corresponding recent activity item if applicable
          var paymentId = $row.find('td:first-child').text();
          $('.recent-activity .accept-payment-btn[data-payment-id="' + paymentId + '"]').text('Accepted').prop('disabled', true).removeClass('btn-success').addClass('btn-secondary');
     });

    // --- NEW: Accept Payment Button in Recent Activity ---
    $('.recent-activity').on('click', '.accept-payment-btn', function() {
        var paymentId = $(this).data('payment-id');
        alert('Payment ' + paymentId + ' accepted from Recent Activity (Simulation)!');

        // Disable button and change text
        $(this).text('Accepted').prop('disabled', true).removeClass('btn-success').addClass('btn-secondary');

        // Find corresponding row in Payments table and update it
        $('#payments-content table tbody tr').each(function() {
            var $row = $(this);
            var rowPaymentId = $row.find('td:first-child').text();
            if(rowPaymentId === paymentId && $row.find('td[data-label="Status"]').text() === 'Pending') {
                $row.find('td[data-label="Status"]').text('Completed');
                // Replace the 'Accept Payment' button in the table with text
                $row.find('.btn-success').replaceWith('<span class="text-muted">Accepted</span>');
            }
        });
    });


    // --- Analytics Chart Initialization (Modified) ---
    window.chartsInitialized = false; // Flag to prevent re-initialization
    let trendsChartInstance, newUserChartInstance, membershipTypeChartInstance; // Renamed last chart instance

    function initializeAnalyticsCharts() {
        if (trendsChartInstance) trendsChartInstance.destroy();
        if (newUserChartInstance) newUserChartInstance.destroy();
        if (membershipTypeChartInstance) membershipTypeChartInstance.destroy(); // Destroy renamed chart instance

        // Use CSS variables if defined, otherwise fallback hex codes
        const goldColor = getComputedStyle(document.documentElement).getPropertyValue('--gold').trim() || '#f0c44c';
        const goldLightColor = getComputedStyle(document.documentElement).getPropertyValue('--gold-light').trim() || '#febd14';
        const goldLighterColor = '#fece43'; // Example lighter shades
        const goldLightestColor = '#feda75'; // Example lightest shades
        const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || '#555';
        const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-light').trim() || '#ecf0f1';
        const darkGrayColor = getComputedStyle(document.documentElement).getPropertyValue('--dark-gray').trim() || '#333';

        const commonChartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: borderColor },
                    ticks: { color: textColor, padding: 10 }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: textColor, padding: 10 }
                }
            },
            plugins: {
                legend: {
                    labels: { color: textColor, padding: 20 }
                },
                tooltip: {
                     backgroundColor: 'rgba(0, 0, 0, 0.8)',
                     titleColor: goldColor,
                     bodyColor: textColor,
                     padding: 10,
                     displayColors: false
                }
            }
        };

        // Membership Trends Chart (Line)
        const trendsCtx = document.getElementById('trendsChart')?.getContext('2d'); // Add safety check
        if (trendsCtx) {
            trendsChartInstance = new Chart(trendsCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                    datasets: [{
                        label: 'Active Members',
                        data: [650, 700, 800, 810, 850, 900, 980],
                        borderColor: goldColor,
                        backgroundColor: goldLightColor,
                        tension: 0.3,
                        pointRadius: 3,
                        pointHoverRadius: 6,
                        pointBackgroundColor: goldColor,
                    }]
                },
                options: commonChartOptions
            });
        }

        // New User Registrations Chart (Bar)
        const newUserCtx = document.getElementById('newUserChart')?.getContext('2d'); // Add safety check
        if (newUserCtx) {
            newUserChartInstance = new Chart(newUserCtx, {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                    datasets: [{
                        label: 'New Users',
                        data: [15, 20, 30, 25, 40, 35, 50],
                        backgroundColor: goldLighterColor,
                        borderColor: goldColor,
                        borderWidth: 1,
                        borderRadius: 4,
                    }]
                },
                options: {
                    ...commonChartOptions, // Spread common options
                     plugins: { // Override plugins for bar chart if needed
                        legend: { display: false }, // Hide legend for single dataset bar
                        tooltip: {
                             ...commonChartOptions.plugins.tooltip // Inherit common tooltip styles
                         }
                     }
                }
            });
        }


        // Membership Types Chart (Doughnut - Replaces New Gym Locations)
        const membershipTypeCtx = document.getElementById('membershipTypeChart')?.getContext('2d'); // Use new ID, add safety check
         if (membershipTypeCtx) {
             membershipTypeChartInstance = new Chart(membershipTypeCtx, { // Use new instance name
                type: 'doughnut',
                data: {
                    labels: ['Premium', 'Basic', 'Student', 'Corporate'], // Example data
                    datasets: [{
                        label: 'Membership Distribution',
                        data: [450, 300, 150, 80], // Example data
                        backgroundColor: [
                            goldColor,
                            goldLightColor,
                            goldLighterColor,
                            goldLightestColor
                        ],
                        borderColor: darkGrayColor,
                        borderWidth: 2,
                        hoverOffset: 8
                    }]
                },
                 options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: textColor, padding: 15 }
                        },
                        tooltip: {
                             backgroundColor: 'rgba(0, 0, 0, 0.8)',
                             titleColor: goldColor,
                             bodyColor: textColor,
                             padding: 10,
                             displayColors: true // Show color box in tooltip
                        }
                    }
                }
            });
         }
    } // End of initializeAnalyticsCharts function

    // Initial call if Analytics is the default active tab
    if ($('#analytics-content').hasClass('active')) {
        initializeAnalyticsCharts();
        window.chartsInitialized = true;
    }

     // --- NEW: Search/Filter Functionality ---
    function filterTable(inputId, tableBodySelector, searchColumnIndex = 0) { // Default search in first column (ID)
        var searchTerm = $(inputId).val().toLowerCase().trim();
        var $rows = $(tableBodySelector + ' tr');
        var $noResultsRow = $(tableBodySelector).find('.no-results-row'); // Check for existing no-results row

        $rows.show(); // Show all rows initially

        if (searchTerm !== '') {
            $rows.each(function() {
                var $row = $(this);
                 // Skip the 'no results' row if it exists
                if ($row.hasClass('no-results-row')) {
                    return; // continue to next iteration
                }
                var cellText = $row.find('td').eq(searchColumnIndex).text().toLowerCase();
                if (!cellText.includes(searchTerm)) {
                    $row.hide();
                }
            });
        }

         // Check if any rows (excluding no-results) are visible
        var $visibleRows = $rows.filter(':visible:not(.no-results-row)');

        // Handle "No results" message
        if ($visibleRows.length === 0 && searchTerm !== '') {
            if ($noResultsRow.length === 0) {
                // Add "No results" row if it doesn't exist
                var colspan = $(tableBodySelector).closest('table').find('thead th').length;
                 $(tableBodySelector).append('<tr class="no-results-row"><td colspan="' + colspan + '" style="text-align:center; padding: 20px; color: #888;">No matching records found.</td></tr>');
            } else {
                // Show existing "No results" row
                $noResultsRow.show();
            }
        } else {
            // Hide "No results" row if there are visible results or search is empty
            if ($noResultsRow.length > 0) {
                $noResultsRow.hide();
            }
        }
    }

    // User Search Event Listeners
    $('#user-search-btn').on('click', function() {
        filterTable('#user-search-id', '#users-content table tbody', 0); // 0 = ID column index
    });
    $('#user-search-id').on('keyup', function(e) {
        // Filter on keyup, or trigger on Enter key press
        // if (e.key === 'Enter' || this.value.length === 0 || this.value.length > 2) { // Example: filter on enter, clear, or >2 chars
             filterTable('#user-search-id', '#users-content table tbody', 0);
        // }
    });

    // Staff/Coach Search Event Listeners
    $('#staff-search-btn').on('click', function() {
        filterTable('#staff-search-id', '#staff-content table tbody', 0); // 0 = ID column index
    });
    $('#staff-search-id').on('keyup', function(e) {
        // if (e.key === 'Enter' || this.value.length === 0 || this.value.length > 2) {
            filterTable('#staff-search-id', '#staff-content table tbody', 0);
        // }
    });

    // --- Responsive Table data-label Initialization ---
    // Function to apply data-labels
    function applyDataLabels($rows) {
         $rows.each(function() {
             var $row = $(this);
             var $table = $row.closest('table'); // Find the parent table
             var $headerCells = $table.find('thead th'); // Get headers from that specific table
             $row.find('td').each(function(index) {
                 $(this).attr('data-label', $headerCells.eq(index).text());
             });
         });
    }
    // Apply on initial load to all tables
    $('table').each(function() {
        applyDataLabels($(this).find('tbody tr'));
    });

}); // End of document ready